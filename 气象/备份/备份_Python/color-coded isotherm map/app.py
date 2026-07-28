from __future__ import annotations

import json
import math
import os
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request, send_from_directory
from matplotlib.colors import BoundaryNorm, ListedColormap
from matplotlib.path import Path as MplPath
from matplotlib.patches import PathPatch
from pykrige.ok import OrdinaryKriging
from shapely.geometry import MultiPolygon, Point, Polygon
from shapely.ops import unary_union
from shapely.prepared import prep


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "static" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 80 * 1024 * 1024

TARGET_COLOR_STOPS = [
    (-74, "#ffffff"),
    (-73, "#ffffff"),
    (-72, "#ffffff"),
    (-71, "#ffffff"),
    (-70, "#ffffff"),
    (-69, "#ffffff"),
    (-68, "#ffffff"),
    (-67, "#ffffff"),
    (-66, "#ffffff"),
    (-65, "#ffffff"),
    (-64, "#ffffff"),
    (-63, "#ffffff"),
    (-62, "#ffffff"),
    (-61, "#ffffff"),
    (-60, "#ffffff"),
    (-59, "#ffffff"),
    (-58, "#ffffff"),
    (-57, "#ffffff"),
    (-56, "#ffffff"),
    (-55, "#ffffff"),
    (-54, "#ffffff"),
    (-53, "#ffffff"),
    (-52, "#ffffff"),
    (-51, "#ffffff"),
    (-50, "#ffffff"),
    (-49, "#ffffff"),
    (-48, "#ffffff"),
    (-47, "#ffffff"),
    (-46, "#ffffff"),
    (-45, "#ffffff"),
    (-44, "#ffffff"),
    (-43, "#ffffff"),
    (-42, "#ffffff"),
    (-41, "#ffffff"),
    (-40, "#ffffff"),
    (-39, "#fed4e7"),
    (-38, "#fca8cf"),
    (-37, "#fb7db6"),
    (-36, "#f9519e"),
    (-35, "#f72585"),
    (-34, "#ea238a"),
    (-33, "#dd208f"),
    (-32, "#d01d94"),
    (-31, "#c31a99"),
    (-30, "#b6189e"),
    (-29, "#a815a3"),
    (-28, "#9b12a8"),
    (-27, "#8d0fad"),
    (-26, "#800cb2"),
    (-25, "#730ab7"),
    (-24, "#670ab3"),
    (-23, "#5c0baf"),
    (-22, "#510bab"),
    (-21, "#460ca7"),
    (-20, "#3a0ca4"),
    (-19, "#3b15ab"),
    (-18, "#3c1eb3"),
    (-17, "#3d26ba"),
    (-16, "#3e2fc2"),
    (-15, "#4037c9"),
    (-14, "#4040d1"),
    (-13, "#4148d8"),
    (-12, "#4251e0"),
    (-11, "#4359e7"),
    (-10, "#4361ef"),
    (-9, "#446cef"),
    (-8, "#4576ef"),
    (-7, "#4681ef"),
    (-6, "#478bef"),
    (-5, "#4995f0"),
    (-4, "#49a0f0"),
    (-3, "#4aaaf0"),
    (-2, "#4bb5f0"),
    (-1, "#4cbff0"),
    (0, "#4cc9f0"),
    (1, "#6fcbd1"),
    (2, "#92cdb2"),
    (3, "#b5cf93"),
    (4, "#d8d174"),
    (5, "#d0ce6c"),
    (6, "#c7cb64"),
    (7, "#bfc85c"),
    (8, "#b6c454"),
    (9, "#acbd40"),
    (10, "#a2b52c"),
    (11, "#98ae18"),
    (12, "#8ea604"),
    (13, "#a8ac03"),
    (14, "#c2b102"),
    (15, "#dcb601"),
    (16, "#f5bb00"),
    (17, "#eea701"),
    (18, "#e69302"),
    (19, "#df7f03"),
    (20, "#d76a03"),
    (21, "#d15c03"),
    (22, "#cb4e02"),
    (23, "#c54001"),
    (24, "#bf3100"),
    (25, "#000000"),
    (26, "#000000"),
    (27, "#000000"),
    (28, "#000000"),
    (29, "#000000"),
    (30, "#000000"),
    (31, "#000000"),
    (32, "#000000"),
    (33, "#000000"),
    (34, "#000000"),
    (35, "#000000"),
    (36, "#000000"),
    (37, "#000000"),
    (38, "#000000"),
    (39, "#000000"),
    (40, "#000000"),
    (41, "#000000"),
    (42, "#000000"),
    (43, "#000000"),
    (44, "#000000"),
    (45, "#000000"),
    (46, "#000000"),
    (47, "#000000"),
    (48, "#000000"),
    (49, "#000000"),
    (50, "#000000"),
    (51, "#000000"),
    (52, "#000000"),
    (53, "#000000"),
    (54, "#000000"),
]


def target_color_rules() -> tuple[list[float], list[str], list[str]]:
    boundaries = [-75.0] + [float(stop) for stop, _ in TARGET_COLOR_STOPS]
    colors = [color for _, color in TARGET_COLOR_STOPS]
    labels = [f"{int(boundaries[index])} to {int(boundaries[index + 1])}" for index in range(len(colors))]
    return boundaries, colors, labels


def target_color_legend(boundaries: list[float], colors: list[str], labels: list[str]) -> list[dict[str, str]]:
    legend = [{"color": "#ffffff", "label": "<= -75", "range": "<= -75"}]
    legend.extend(
        {"color": colors[index], "label": labels[index], "range": labels[index]}
        for index in range(len(colors))
    )
    legend.append({"color": "#000000", "label": ">= 54", "range": ">= 54"})
    return legend


def read_excel_columns(file_storage) -> list[str]:
    excel = pd.ExcelFile(file_storage)
    df = excel.parse(excel.sheet_names[0], nrows=5)
    return [str(column) for column in df.columns]


def parse_coordinate_block(text: str) -> list[tuple[float, float]]:
    coordinates: list[tuple[float, float]] = []
    for token in text.replace("\n", " ").replace("\t", " ").split():
        parts = token.split(",")
        if len(parts) < 2:
            continue
        try:
            lon = float(parts[0])
            lat = float(parts[1])
        except ValueError:
            continue
        coordinates.append((lon, lat))
    return coordinates


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def descendants_named(element: ET.Element, name: str) -> list[ET.Element]:
    return [child for child in element.iter() if local_name(child.tag) == name]


def first_descendant_named(element: ET.Element, name: str) -> ET.Element | None:
    matches = descendants_named(element, name)
    return matches[0] if matches else None


def polygon_from_element(element: ET.Element) -> Polygon | MultiPolygon | None:
    outer_boundary = first_descendant_named(element, "outerBoundaryIs")
    if outer_boundary is None:
        return None
    outer = first_descendant_named(outer_boundary, "coordinates")
    if outer is None or not outer.text:
        return None

    outer_coords = parse_coordinate_block(outer.text)
    if len(outer_coords) < 4:
        return None

    holes: list[list[tuple[float, float]]] = []
    for inner_boundary in descendants_named(element, "innerBoundaryIs"):
        inner_coords = first_descendant_named(inner_boundary, "coordinates")
        if inner_coords is not None and inner_coords.text:
            hole_coords = parse_coordinate_block(inner_coords.text)
            if len(hole_coords) >= 4:
                holes.append(hole_coords)

    polygon = Polygon(outer_coords, holes)
    if not polygon.is_valid:
        polygon = polygon.buffer(0)
    return polygon if not polygon.is_empty else None


def parse_kml_boundaries(files) -> tuple[Polygon | MultiPolygon, list[Polygon | MultiPolygon]]:
    """Return (unioned boundary, list of individual province polygons)."""
    polygons: list[Polygon | MultiPolygon] = []

    for file_storage in files:
        tree = ET.parse(file_storage)
        root = tree.getroot()
        for polygon_element in descendants_named(root, "Polygon"):
            polygon = polygon_from_element(polygon_element)
            if polygon is not None:
                polygons.append(polygon)

    if not polygons:
        raise ValueError("No valid Polygon boundaries were found in the selected KML files.")

    unioned = unary_union(polygons)
    if unioned.is_empty:
        raise ValueError("The selected KML boundaries are empty after parsing.")
    return unioned, polygons


def dataframe_from_upload(file_storage, lat_col: str, lon_col: str, value_col: str) -> pd.DataFrame:
    df = pd.read_excel(file_storage)
    required = [lat_col, lon_col, value_col]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required column(s): {', '.join(missing)}")

    data = df[required].rename(columns={lat_col: "lat", lon_col: "lon", value_col: "value"})
    data = data.apply(pd.to_numeric, errors="coerce").dropna()
    data = data[
        data["lat"].between(-90, 90)
        & data["lon"].between(-180, 180)
        & np.isfinite(data["value"])
    ]
    if len(data) < 4:
        raise ValueError("At least four valid latitude, longitude, and value rows are required for Kriging.")
    return data


def normalize_color_rules(raw_rules: str) -> tuple[list[float], list[str], list[str]]:
    rules = json.loads(raw_rules)
    cleaned = []
    for rule in rules:
        lower = float(rule["min"])
        upper = float(rule["max"])
        color = str(rule["color"])
        label = str(rule.get("label") or f"{lower:g} to {upper:g}")
        if not color.startswith("#") or len(color) not in (4, 7):
            raise ValueError(f"Invalid color value: {color}")
        if upper <= lower:
            raise ValueError("Each color rule maximum must be greater than its minimum.")
        cleaned.append((lower, upper, color, label))

    cleaned.sort(key=lambda item: item[0])
    if len(cleaned) < 2:
        raise ValueError("Please provide at least two color rules.")

    boundaries = [cleaned[0][0]]
    colors: list[str] = []
    labels: list[str] = []
    for lower, upper, color, label in cleaned:
        if not math.isclose(lower, boundaries[-1], rel_tol=0, abs_tol=1e-9):
            raise ValueError("Color rules must be continuous with no gaps or overlaps.")
        boundaries.append(upper)
        colors.append(color)
        labels.append(label)
    return boundaries, colors, labels


def make_grid(bounds: tuple[float, float, float, float], point_count: int = 300) -> tuple[np.ndarray, np.ndarray]:
    min_lon, min_lat, max_lon, max_lat = bounds
    width = max_lon - min_lon
    height = max_lat - min_lat
    if width <= 0 or height <= 0:
        raise ValueError("KML boundary extent is invalid.")

    if width >= height:
        nx = point_count
        ny = max(40, int(point_count * height / width))
    else:
        ny = point_count
        nx = max(40, int(point_count * width / height))

    return np.linspace(min_lon, max_lon, nx), np.linspace(min_lat, max_lat, ny)


def kriging_surface(
    data: pd.DataFrame,
    grid_lon: np.ndarray,
    grid_lat: np.ndarray,
    mode: str = "mean",
) -> np.ndarray:
    """Interpolate station values onto a regular grid using Ordinary Kriging.

    Parameters
    ----------
    mode : {"mean", "low", "high"}
        Controls how the surface is corrected where Kriging smoothing causes it
        to deviate significantly from the source station values.

        ``"mean"``
            Pure Kriging — no correction applied.  Smoothing is maximal.  Best
            for daily-mean or normal temperature maps where isolated cold
            mountain stations should not dominate their neighbourhood.

        ``"low"``
            Cold-biased correction.  Where a station's exact minimum is colder
            than the Kriging estimate, a smooth Gaussian correction (σ ≈ 2°)
            is blended in so the coldest recorded value always appears on the
            map.  Warm corrections are suppressed wherever cold ones are active.
            Designed for all-time or seasonal *minimum* temperature maps.

        ``"high"``
            Warm-biased correction — the mirror of ``"low"``.  Where a
            station's maximum exceeds the Kriging estimate, that extreme is
            blended back in.  Cold corrections are suppressed wherever warm ones
            are active.  Designed for all-time or seasonal *maximum*
            temperature maps.
    """
    # Deduplicate stations at identical coordinates to prevent singular matrix errors
    deduped = (
        data
        .assign(_lon_r=data["lon"].round(6), _lat_r=data["lat"].round(6))
        .groupby(["_lon_r", "_lat_r"], as_index=False)
        .agg(lon=("lon", "mean"), lat=("lat", "mean"), value=("value", "mean"))
    )

    # Basic, smooth Kriging configuration
    kriging = OrdinaryKriging(
        deduped["lon"].to_numpy(),
        deduped["lat"].to_numpy(),
        deduped["value"].to_numpy(),
        variogram_model="spherical",
        nlags=20,
        verbose=False,
        enable_plotting=False,
    )

    values, _ = kriging.execute("grid", grid_lon, grid_lat)
    values = np.asarray(values, dtype=float)

    if mode == "mean":
        # No correction — return the smooth Kriging surface as-is.
        return values

    # --- Smooth correction pass (used by "low" and "high" modes) ---
    # For every station where the interpolated surface misses the exact value by
    # more than 0.5 units, inject a radial Gaussian correction (sigma ≈ 2°)
    # centred on that station.  The correction delta decays smoothly to zero at
    # the edges so the contour lines remain perfectly smooth with no pixel
    # artefacts.
    #
    # Accumulation rule: cold deltas and warm deltas are collected independently
    # (each cell keeps the most-extreme value seen across all stations).
    # When combining:
    #   "low"  mode → cold wins; warm is suppressed where cold is active.
    #   "high" mode → warm wins; cold is suppressed where warm is active.
    lon_step = float(grid_lon[1] - grid_lon[0])
    lat_step = float(grid_lat[1] - grid_lat[0])
    sigma_deg = 2.0            # correction radius ≈ 200 km — wide enough to be smooth
    sigma_lon_cells = sigma_deg / lon_step
    sigma_lat_cells = sigma_deg / lat_step

    lon_grid, lat_grid = np.meshgrid(grid_lon, grid_lat)

    max_cold_delta = np.zeros_like(values)   # most-negative delta (colder than Kriging)
    max_warm_delta = np.zeros_like(values)   # most-positive  delta (warmer than Kriging)

    for _, row in deduped.iterrows():
        lat_idx = int(np.argmin(np.abs(grid_lat - row["lat"])))
        lon_idx = int(np.argmin(np.abs(grid_lon - row["lon"])))
        diff = float(row["value"]) - values[lat_idx, lon_idx]

        if abs(diff) <= 0.5:
            continue

        # Gaussian weight field centred on this station
        dist_lon = (lon_grid - row["lon"]) / lon_step
        dist_lat = (lat_grid - row["lat"]) / lat_step
        gauss = np.exp(-0.5 * ((dist_lon / sigma_lon_cells) ** 2 +
                                (dist_lat / sigma_lat_cells) ** 2))
        center_val = gauss[lat_idx, lon_idx]
        if abs(center_val) < 1e-12:
            continue

        # delta field: equals diff at the station centre, decays outward
        delta = diff * gauss / center_val

        if diff < 0:
            max_cold_delta = np.minimum(max_cold_delta, delta)
        else:
            max_warm_delta = np.maximum(max_warm_delta, delta)

    has_cold = max_cold_delta < 0
    has_warm = max_warm_delta > 0

    if mode == "low":
        # Cold corrections win; apply warm only where cold is absent
        values[has_cold] += max_cold_delta[has_cold]
        values[has_warm & ~has_cold] += max_warm_delta[has_warm & ~has_cold]
    else:  # mode == "high"
        # Warm corrections win; apply cold only where warm is absent
        values[has_warm] += max_warm_delta[has_warm]
        values[has_cold & ~has_warm] += max_cold_delta[has_cold & ~has_warm]

    return values


def clip_surface_to_boundary(surface: np.ndarray, grid_lon: np.ndarray, grid_lat: np.ndarray, boundary) -> np.ma.MaskedArray:
    prepared = prep(boundary)
    mask = np.ones(surface.shape, dtype=bool)
    for row_index, lat in enumerate(grid_lat):
        for col_index, lon in enumerate(grid_lon):
            point = Point(float(lon), float(lat))
            mask[row_index, col_index] = not prepared.contains(point) and not prepared.touches(point)
    return np.ma.array(surface, mask=mask)


MIN_OUTLINE_AREA_RATIO = 0.00002


def is_visible_outline_part(area: float, total_area: float) -> bool:
    return total_area <= 0 or (area / total_area) >= MIN_OUTLINE_AREA_RATIO


def orthographic_project(lon, lat, center_lon: float, center_lat: float):
    lon_rad = np.radians(lon)
    lat_rad = np.radians(lat)
    center_lon_rad = math.radians(center_lon)
    center_lat_rad = math.radians(center_lat)
    delta_lon = lon_rad - center_lon_rad
    x = np.cos(lat_rad) * np.sin(delta_lon)
    y = (
        math.cos(center_lat_rad) * np.sin(lat_rad)
        - math.sin(center_lat_rad) * np.cos(lat_rad) * np.cos(delta_lon)
    )
    return x, y


def projection_center(boundary) -> tuple[float, float]:
    point = boundary.representative_point()
    return float(point.x), float(point.y)


def projected_ring_parts(coordinates, center_lon: float, center_lat: float) -> tuple[list[tuple[float, float]], list[int]]:
    vertices = list(coordinates)
    if not vertices:
        return [], []
    if vertices[0] != vertices[-1]:
        vertices.append(vertices[0])

    lon = np.array([vertex[0] for vertex in vertices], dtype=float)
    lat = np.array([vertex[1] for vertex in vertices], dtype=float)
    x, y = orthographic_project(lon, lat, center_lon, center_lat)
    projected_vertices = list(zip(x.tolist(), y.tolist()))
    codes = [MplPath.MOVETO] + [MplPath.LINETO] * (len(projected_vertices) - 2) + [MplPath.CLOSEPOLY]
    return projected_vertices, codes


def draw_boundary_outline(ax, boundary, center_lon: float, center_lat: float) -> None:
    total_area = float(boundary.area)
    polygons = list(boundary.geoms) if isinstance(boundary, MultiPolygon) else [boundary]
    for polygon in polygons:
        if not is_visible_outline_part(float(polygon.area), total_area):
            continue
        exterior_lon, exterior_lat = polygon.exterior.xy
        exterior_x, exterior_y = orthographic_project(exterior_lon, exterior_lat, center_lon, center_lat)
        ax.plot(exterior_x, exterior_y, color="#1f2937", linewidth=1.1, antialiased=True)


def draw_province_borders(ax, province_polygons: list, center_lon: float, center_lat: float) -> None:
    """Draw individual province borders as dotted dark-grey lines."""
    for geom in province_polygons:
        polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
        for polygon in polys:
            exterior_lon, exterior_lat = polygon.exterior.xy
            exterior_x, exterior_y = orthographic_project(
                np.array(exterior_lon), np.array(exterior_lat), center_lon, center_lat
            )
            ax.plot(exterior_x, exterior_y, color="#b0b0b0", linewidth=0.6, linestyle="solid", antialiased=True)


def ring_to_path_parts(coordinates) -> tuple[list[tuple[float, float]], list[int]]:
    vertices = list(coordinates)
    if not vertices:
        return [], []
    if vertices[0] != vertices[-1]:
        vertices.append(vertices[0])
    codes = [MplPath.MOVETO] + [MplPath.LINETO] * (len(vertices) - 2) + [MplPath.CLOSEPOLY]
    return vertices, codes


def boundary_clip_patch(boundary, center_lon: float, center_lat: float) -> PathPatch:
    vertices: list[tuple[float, float]] = []
    codes: list[int] = []
    total_area = float(boundary.area)
    polygons = list(boundary.geoms) if isinstance(boundary, MultiPolygon) else [boundary]

    for polygon in polygons:
        if not is_visible_outline_part(float(polygon.area), total_area):
            continue
        ring_vertices, ring_codes = projected_ring_parts(polygon.exterior.coords, center_lon, center_lat)
        vertices.extend(ring_vertices)
        codes.extend(ring_codes)

    return PathPatch(MplPath(vertices, codes), facecolor="none", edgecolor="none", antialiased=True)


def get_merged_intervals(intervals: list[tuple[float, float]]) -> list[tuple[float, float]]:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        previous = merged[-1]
        if current[0] <= previous[1] + 1e-9:
            merged[-1] = (previous[0], max(previous[1], current[1]))
        else:
            merged.append(current)
    return merged


def save_surface_image(
    surface: np.ndarray,
    grid_lon: np.ndarray,
    grid_lat: np.ndarray,
    boundary,
    boundaries: list[float],
    colors: list[str],
    province_polygons: list | None = None,
    under_color: str = "#ffffff",
    over_color: str = "#000000",
    value_levels: list[int] | None = None,
    extra_lats: list[float] | None = None,
    extra_lons: list[float] | None = None,
) -> str:
    filename = f"isotherm-{uuid.uuid4().hex}.png"
    output_path = OUTPUT_DIR / filename

    center_lon, center_lat = projection_center(boundary)
    lon_mesh, lat_mesh = np.meshgrid(grid_lon, grid_lat)
    x_mesh, y_mesh = orthographic_project(lon_mesh, lat_mesh, center_lon, center_lat)
    clip_patch = boundary_clip_patch(boundary, center_lon, center_lat)
    clip_vertices = clip_patch.get_path().vertices
    if len(clip_vertices) == 0:
        raise ValueError("The selected KML boundaries could not be projected.")

    min_x, min_y = np.nanmin(clip_vertices, axis=0)
    max_x, max_y = np.nanmax(clip_vertices, axis=0)
    extent_width = max(max_x - min_x, 0.05)
    extent_height = max(max_y - min_y, 0.05)
    margin = max(extent_width, extent_height) * 0.025
    aspect = max(extent_width / extent_height, 0.2)
    width = 16
    height = min(max(width / aspect, 4), 20)

    fig, ax = plt.subplots(figsize=(width, height), dpi=150)
    ax.add_patch(clip_patch)
    cmap = ListedColormap(colors)
    cmap.set_under(under_color)
    cmap.set_over(over_color)
    # BoundaryNorm uses left-closed intervals [boundaries[i], boundaries[i+1]).
    # Our color rule defines RIGHT-closed intervals (prev, value].
    # Subtract a tiny epsilon so that a value exactly equal to an integer boundary
    # falls just below the edge — landing in the correct lower band.
    shifted_surface = surface - 1e-9

    norm = BoundaryNorm(boundaries, cmap.N)

    # contourf draws smooth filled regions between exact level boundaries —
    # no visible grid cells.  The bullseye rings were produced by the Kriging
    # surface itself (ill-conditioned solver → local spikes); now that
    # pseudo_inv=True yields a clean surface, contourf is artifact-free.
    contour_fill = ax.contourf(
        x_mesh,
        y_mesh,
        shifted_surface,
        levels=boundaries,
        cmap=cmap,
        norm=norm,
        extend="both",
        antialiased=False,
    )
    contour_fill.set_clip_path(clip_patch)

    # Draw contour lines at the pre-filtered multiples-of-10 levels.
    if value_levels:
        contour_lines = ax.contour(
            x_mesh,
            y_mesh,
            shifted_surface,
            levels=sorted(value_levels),
            colors="black",
            linewidths=0.7,
            linestyles="solid",
            antialiased=True,
        )
        contour_lines.set_clip_path(clip_patch)
        
        # Calculate valid label locations strictly inside the KML boundary
        # to ensure non-closed lines get labels properly placed inside.
        clip_mpl_path = clip_patch.get_path()
        label_locations = []
        
        paths = []
        if hasattr(contour_lines, "collections") and contour_lines.collections:
            for col in contour_lines.collections:
                paths.extend(col.get_paths())
        elif hasattr(contour_lines, "get_paths"):
            paths.extend(contour_lines.get_paths())

        for path in paths:
            vertices = path.vertices
            if len(vertices) == 0:
                continue
            inside = clip_mpl_path.contains_points(vertices)
            if not inside.any():
                continue
            indices = np.where(inside)[0]
            groups = np.split(indices, np.where(np.diff(indices) > 1)[0] + 1)
            longest_group = max(groups, key=len)
            if len(longest_group) > 0:
                mid_idx = longest_group[len(longest_group) // 2]
                label_locations.append(tuple(vertices[mid_idx]))
                
        if label_locations:
            texts = ax.clabel(
                contour_lines,
                levels=sorted(value_levels),
                fmt="%g",
                fontsize=8,
                colors="black",
                inline=True,
                inline_spacing=2,
                manual=label_locations,
            )
        else:
            texts = ax.clabel(
                contour_lines,
                levels=sorted(value_levels),
                fmt="%g",
                fontsize=8,
                colors="black",
                inline=True,
                inline_spacing=2,
            )
            for txt in texts:
                tx, ty = txt.get_position()
                if not clip_mpl_path.contains_point((tx, ty)):
                    txt.set_visible(False)

    if province_polygons:
        draw_province_borders(ax, province_polygons, center_lon, center_lat)

    if extra_lats or extra_lons:
        polygons = list(boundary.geoms) if isinstance(boundary, MultiPolygon) else [boundary]
        lon_intervals = []
        lat_intervals = []
        for poly in polygons:
            poly_min_lon, poly_min_lat, poly_max_lon, poly_max_lat = poly.bounds
            lon_intervals.append((poly_min_lon, poly_max_lon))
            lat_intervals.append((poly_min_lat, poly_max_lat))
        
        lon_intervals = get_merged_intervals(lon_intervals)
        lat_intervals = get_merged_intervals(lat_intervals)

    if extra_lats:
        for lat in extra_lats:
            for int_min_lon, int_max_lon in lon_intervals:
                num_points = max(10, int((int_max_lon - int_min_lon) * 2))
                lons = np.linspace(int_min_lon, int_max_lon, num_points)
                lats_arr = np.full_like(lons, lat)
                x, y = orthographic_project(lons, lats_arr, center_lon, center_lat)
                line, = ax.plot(x, y, color="grey", linestyle=":", linewidth=1.0, antialiased=True)
                line.set_clip_path(clip_patch)

    if extra_lons:
        for lon in extra_lons:
            for int_min_lat, int_max_lat in lat_intervals:
                num_points = max(10, int((int_max_lat - int_min_lat) * 2))
                lats_arr = np.linspace(int_min_lat, int_max_lat, num_points)
                lons_arr = np.full_like(lats_arr, lon)
                x, y = orthographic_project(lons_arr, lats_arr, center_lon, center_lat)
                line, = ax.plot(x, y, color="grey", linestyle=":", linewidth=1.0, antialiased=True)
                line.set_clip_path(clip_patch)

    draw_boundary_outline(ax, boundary, center_lon, center_lat)
    ax.set_xlim(min_x - margin, max_x + margin)
    ax.set_ylim(min_y - margin, max_y + margin)
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)
    fig.savefig(output_path, transparent=True, pad_inches=0)
    plt.close(fig)
    return f"/static/outputs/{filename}"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/excel-columns", methods=["POST"])
def excel_columns():
    try:
        file = request.files.get("excel")
        if file is None:
            raise ValueError("Please choose an Excel file.")
        return jsonify({"columns": read_excel_columns(file)})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/render", methods=["POST"])
def render_map():
    try:
        excel = request.files.get("excel")
        kml_files = request.files.getlist("kml")
        if excel is None:
            raise ValueError("Please choose an Excel file.")
        if not kml_files:
            raise ValueError("Please choose at least one KML boundary file.")

        lat_col = request.form["lat_col"]
        lon_col = request.form["lon_col"]
        value_col = request.form["value_col"]

        extra_lats = json.loads(request.form.get("extra_lats", "[]"))
        extra_lons = json.loads(request.form.get("extra_lons", "[]"))

        # ── Parse the dynamic color rule sent by the frontend ──────────────
        raw_color_rule = request.form.get("color_rule")
        if not raw_color_rule:
            raise ValueError("Color rule is not defined. Please generate a color rule before drawing.")

        entries = json.loads(raw_color_rule)  # [{"value": int, "color": "#rrggbb"}, …]
        if len(entries) < 2:
            raise ValueError("Color rule must contain at least two entries.")

        # Sort by value and build BoundaryNorm inputs.
        # Each entry represents a color RANGE where:
        #   - entry[0] with value V0 covers the range (V0-1, V0]
        #   - entry[i] with value Vi covers the range (V_{i-1}, Vi]
        # So the boundaries are exact integers: [V0-1, V0, V1, V2, ...]
        entries.sort(key=lambda e: e["value"])
        entry_values = [int(e["value"]) for e in entries]
        entry_colors = [str(e["color"]) for e in entries]

        # Build exact-integer BoundaryNorm boundaries: N colors → N+1 edges
        boundaries = [entry_values[0] - 1] + list(entry_values)
        colors = entry_colors
        under_color = entry_colors[0]   # values below lower bound
        over_color  = entry_colors[-1]  # values above upper bound

        # Legend: each entry represents the range (prev, value]
        legend_items = []
        for i, v in enumerate(entry_values):
            lower = entry_values[i - 1] if i > 0 else entry_values[0] - 1
            label = f"{lower} to {v}"
            legend_items.append({"color": entry_colors[i], "label": label, "range": label})

        data = dataframe_from_upload(excel, lat_col, lon_col, value_col)
        boundary, province_polygons = parse_kml_boundaries(kml_files)
        min_lon, min_lat, max_lon, max_lat = boundary.bounds
        grid_lon, grid_lat = make_grid((min_lon, min_lat, max_lon, max_lat))
        interp_mode = request.form.get("interp_mode", "mean")
        if interp_mode not in ("mean", "low", "high"):
            interp_mode = "mean"
        surface = kriging_surface(data, grid_lon, grid_lat, mode=interp_mode)

        # Clamp the kriging surface to the actual source data value range to
        # prevent extrapolation from producing values beyond what the data supports.
        data_min = float(data["value"].min())
        data_max = float(data["value"].max())
        surface = np.clip(surface, data_min, data_max)

        clipped = clip_surface_to_boundary(surface, grid_lon, grid_lat, boundary)

        visible_values = clipped.compressed()
        if len(visible_values) == 0:
            raise ValueError("No interpolated grid cells fall inside the selected KML boundaries.")

        # Contour lines at multiples of 10 that lie within the data range
        multiples_of_10 = [
            v for v in range(
                math.ceil(data_min / 10) * 10,
                math.floor(data_max / 10) * 10 + 1,
                10,
            )
        ]

        image_url = save_surface_image(
            surface, grid_lon, grid_lat, boundary, boundaries, colors, province_polygons,
            under_color=under_color, over_color=over_color,
            value_levels=multiples_of_10,
            extra_lats=extra_lats,
            extra_lons=extra_lons,
        )

        return jsonify(
            {
                "image_url": image_url,
                "legend": legend_items,
                "stats": {
                    "points": int(len(data)),
                    "min": float(np.nanmin(visible_values)),
                    "max": float(np.nanmax(visible_values)),
                    "mean": float(np.nanmean(visible_values)),
                },
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/static/outputs/<path:filename>")
def output_file(filename: str):
    return send_from_directory(OUTPUT_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True)
