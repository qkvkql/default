// ─── DOM refs ─────────────────────────────────────────────────────────────────
const excelInput       = document.querySelector("#excelFile");
const kmlInput         = document.querySelector("#kmlFiles");
const excelName        = document.querySelector("#excelName");
const kmlName          = document.querySelector("#kmlName");
const latColumn        = document.querySelector("#latColumn");
const lonColumn        = document.querySelector("#lonColumn");
const valueColumn      = document.querySelector("#valueColumn");
const drawButton       = document.querySelector("#drawButton");
const message          = document.querySelector("#message");
const statusPill       = document.querySelector("#statusPill");
const legend           = document.querySelector("#legend");
const stats            = document.querySelector("#stats");
const resultImage      = document.querySelector("#resultImage");
const imagePlaceholder = document.querySelector("#imagePlaceholder");

// Color-rule panel
const colorRuleToggle  = document.querySelector("#colorRuleToggle");
const colorRuleBody    = document.querySelector("#colorRuleBody");
const colorRuleStatus  = document.querySelector("#colorRuleStatus");
const cpList           = document.querySelector("#cpList");
const addCpBtn         = document.querySelector("#addCpBtn");
const generateRuleBtn  = document.querySelector("#generateRuleBtn");
const crMessage        = document.querySelector("#crMessage");
const crPreviewBody    = document.querySelector("#crPreviewBody");
const importRuleBtn    = document.querySelector("#importRuleBtn");
const saveRuleBtn      = document.querySelector("#saveRuleBtn");
const importRuleInput  = document.querySelector("#importRuleInput");

// ─── State ────────────────────────────────────────────────────────────────────
/**
 * controlPoints: array of { value: number|null, color: string }
 * index 0 = min boundary, last = max boundary.
 */
let controlPoints = [
  { value: null, color: "#ffffff" },  // min boundary
  { value: null, color: "#000000" },  // max boundary
];

/**
 * generatedColorMap: null when not yet generated / invalidated.
 * When valid: { stops: [{value, color}], colorRule: [{value, color}] }
 */
let generatedColorMap = null;

// ─── Utility: general UI ──────────────────────────────────────────────────────
function setStatus(text, mode = "ready") {
  statusPill.textContent = text;
  statusPill.classList.toggle("busy",  mode === "busy");
  statusPill.classList.toggle("error", mode === "error");
}

function setMessage(text, mode = "ready") {
  message.textContent = text;
  setStatus(
    mode === "error" ? "Error" : mode === "busy" ? "Working" : "Ready",
    mode,
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function optionHtml(columns, selectedNeedle) {
  const lowerNeedle = selectedNeedle.toLowerCase();
  return columns
    .map((col) => {
      const selected = col.toLowerCase().includes(lowerNeedle) ? " selected" : "";
      return `<option value="${escapeHtml(col)}"${selected}>${escapeHtml(col)}</option>`;
    })
    .join("");
}

function fillColumnSelectors(columns) {
  latColumn.innerHTML   = optionHtml(columns, "lat");
  lonColumn.innerHTML   = optionHtml(columns, "lon");
  valueColumn.innerHTML = optionHtml(columns, "value");
  for (const select of [latColumn, lonColumn, valueColumn]) {
    select.disabled = false;
    if (!select.value && columns.length) select.value = columns[0];
  }
}

function updateLegend(items) {
  legend.innerHTML = items
    .map(
      (item) => `
        <div class="legend-row">
          <span class="legend-swatch" style="background:${item.color}"></span>
          <span>${escapeHtml(item.label)}</span>
        </div>
      `,
    )
    .join("");
}

function updateStats(summary) {
  stats.classList.remove("muted");
  stats.innerHTML = `
    <span><strong>Source points:</strong> ${summary.points}</span>
    <span><strong>Interpolated min:</strong> ${summary.min.toFixed(2)}</span>
    <span><strong>Interpolated mean:</strong> ${summary.mean.toFixed(2)}</span>
    <span><strong>Interpolated max:</strong> ${summary.max.toFixed(2)}</span>
  `;
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Normalize any user-typed hex string to a 6-digit lowercase #rrggbb,
 * or return null if invalid.
 */
function normalizeHex(raw) {
  const s = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    // Expand 3-digit shorthand
    const expanded = s.split("").map((c) => c + c).join("");
    return "#" + expanded.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) {
    return "#" + s.toLowerCase();
  }
  return null;
}

function interpolateColors(hexA, hexB, steps) {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const count = steps + 2;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
  });
}

// ─── Color rule – collapse toggle ─────────────────────────────────────────────
colorRuleToggle.addEventListener("click", () => {
  const expanded = colorRuleToggle.getAttribute("aria-expanded") === "true";
  colorRuleToggle.setAttribute("aria-expanded", String(!expanded));
  colorRuleBody.hidden = expanded;
  colorRuleToggle.querySelector(".toggle-icon").textContent = expanded ? "▶" : "▼";
});

// ─── Color rule – state helpers ───────────────────────────────────────────────
function invalidateColorMap() {
  generatedColorMap = null;
  setRuleStatus("undefined");
}

function setRuleStatus(state) {
  colorRuleStatus.className   = `rule-badge rule-badge--${state}`;
  colorRuleStatus.textContent = state === "defined" ? "Defined ✓" : "Not defined";
}

function setCrMessage(text, isError = false) {
  crMessage.textContent = text;
  crMessage.className   = isError ? "cr-message cr-message--error" : "cr-message";
}

// ─── Color rule – compound color widget ───────────────────────────────────────
/**
 * Creates a compound color widget: [color-swatch-button] [hex text input]
 * Both stay in sync. On change, calls onChange(hexColor).
 */
function createColorWidget(initialHex, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "color-widget";

  // Invisible native color picker (triggered by clicking the swatch)
  const picker = document.createElement("input");
  picker.type      = "color";
  picker.value     = initialHex;
  picker.className = "color-widget-picker";
  picker.tabIndex  = -1;

  // Visible color swatch (clickable)
  const swatch = document.createElement("button");
  swatch.type      = "button";
  swatch.className = "color-widget-swatch";
  swatch.title     = "Open color picker";
  swatch.style.background = initialHex;
  swatch.addEventListener("click", () => picker.click());

  // Hex text input
  const hexInput = document.createElement("input");
  hexInput.type        = "text";
  hexInput.className   = "color-widget-hex";
  hexInput.value       = initialHex;
  hexInput.maxLength   = 7;
  hexInput.placeholder = "#rrggbb";
  hexInput.spellcheck  = false;

  // Sync: picker → swatch + hex text
  picker.addEventListener("input", () => {
    const hex = picker.value;
    swatch.style.background = hex;
    hexInput.value = hex;
    hexInput.classList.remove("hex-invalid");
    onChange(hex);
  });

  // Sync: hex text → picker + swatch (validates on every keystroke)
  hexInput.addEventListener("input", () => {
    const norm = normalizeHex(hexInput.value);
    if (norm) {
      hexInput.classList.remove("hex-invalid");
      picker.value            = norm;
      swatch.style.background = norm;
      onChange(norm);
    } else {
      hexInput.classList.add("hex-invalid");
      // Don't call onChange when invalid — keep last good color
    }
  });

  // On blur: if invalid, revert to last good color from picker
  hexInput.addEventListener("blur", () => {
    const norm = normalizeHex(hexInput.value);
    if (!norm) {
      hexInput.value = picker.value;
      hexInput.classList.remove("hex-invalid");
    }
  });

  wrapper.appendChild(picker);
  wrapper.appendChild(swatch);
  wrapper.appendChild(hexInput);
  return wrapper;
}

// ─── Color rule – render control point list ───────────────────────────────────
/**
 * Rows:
 *   index 0        → Min boundary (no delete btn)
 *   index last     → Max boundary (no delete btn)
 *   index 1..n-2   → Internal     (delete btn)
 *
 * Grid columns: [value input] [color widget] [role badge] [delete or spacer]
 */
function renderCpList() {
  cpList.innerHTML = "";
  controlPoints.forEach((cp, idx) => {
    const isMin      = idx === 0;
    const isMax      = idx === controlPoints.length - 1;
    const isInternal = !isMin && !isMax;
    const roleClass  = isMin ? "cp-role--min" : isMax ? "cp-role--max" : "cp-role--internal";
    const roleLabel  = isMin ? "Min boundary"  : isMax ? "Max boundary"  : "Internal";

    const row = document.createElement("div");
    row.className    = "cp-row";
    row.dataset.index = idx;

    // ── Value input ──
    const valueInput       = document.createElement("input");
    valueInput.type        = "number";
    valueInput.step        = "1";
    valueInput.className   = "cp-value-input";
    valueInput.placeholder = isMin ? "Min integer" : isMax ? "Max integer" : "Integer";
    valueInput.value       = cp.value !== null ? cp.value : "";
    valueInput.addEventListener("input", () => {
      const raw = valueInput.value.trim();
      controlPoints[idx].value = raw === "" ? null : Math.round(Number(raw));
      invalidateColorMap();
    });

    // ── Compound color widget ──
    const colorWidget = createColorWidget(cp.color, (hex) => {
      controlPoints[idx].color = hex;
      invalidateColorMap();
    });

    // ── Role badge ──
    const roleBadge = document.createElement("span");
    roleBadge.className   = `cp-role ${roleClass}`;
    roleBadge.textContent = roleLabel;

    row.appendChild(valueInput);
    row.appendChild(colorWidget);
    row.appendChild(roleBadge);

    // ── Delete button (internal only) ──
    if (isInternal) {
      const delBtn     = document.createElement("button");
      delBtn.type      = "button";
      delBtn.className = "cp-del-btn";
      delBtn.title     = "Remove this control point";
      delBtn.innerHTML = "✕";
      delBtn.addEventListener("click", () => {
        controlPoints.splice(idx, 1);
        invalidateColorMap();
        renderCpList();
      });
      row.appendChild(delBtn);
    } else {
      row.appendChild(document.createElement("span")); // spacer
    }

    cpList.appendChild(row);
  });
}

// ─── Color rule – add intermediate point ──────────────────────────────────────
addCpBtn.addEventListener("click", () => {
  const lastIdx = controlPoints.length - 1;
  controlPoints.splice(lastIdx, 0, { value: null, color: "#888888" });
  invalidateColorMap();
  renderCpList();
});

// ─── Color rule – generate ────────────────────────────────────────────────────
generateRuleBtn.addEventListener("click", () => {
  setCrMessage("");
  invalidateColorMap();

  // Validate: all values must be integers
  for (let i = 0; i < controlPoints.length; i++) {
    const cp   = controlPoints[i];
    const role = i === 0 ? "Min boundary" : i === controlPoints.length - 1 ? "Max boundary" : `Internal #${i}`;
    if (cp.value === null || !Number.isFinite(cp.value)) {
      setCrMessage(`${role} value is not set. All values must be integers.`, true);
      return;
    }
  }

  // Sort internal points; keep min/max at ends
  const minCp     = controlPoints[0];
  const maxCp     = controlPoints[controlPoints.length - 1];
  const internals = controlPoints.slice(1, -1).slice().sort((a, b) => a.value - b.value);
  const sorted    = [minCp, ...internals, maxCp];

  const minVal = sorted[0].value;
  const maxVal = sorted[sorted.length - 1].value;

  if (minVal >= maxVal) {
    setCrMessage("Min boundary value must be less than Max boundary value.", true);
    return;
  }
  for (let i = 1; i < sorted.length - 1; i++) {
    const v = sorted[i].value;
    if (v <= minVal) {
      setCrMessage(`Internal value ${v} must be greater than Min boundary (${minVal}).`, true);
      return;
    }
    if (v >= maxVal) {
      setCrMessage(`Internal value ${v} must be less than Max boundary (${maxVal}).`, true);
      return;
    }
  }
  const vals = sorted.map((cp) => cp.value);
  if (new Set(vals).size !== vals.length) {
    setCrMessage("All control point values must be unique.", true);
    return;
  }

  // Build full integer-step color map
  const colorRule = [];
  for (let seg = 0; seg < sorted.length - 1; seg++) {
    const cpA    = sorted[seg];
    const cpB    = sorted[seg + 1];
    const vA     = cpA.value;
    const vB     = cpB.value;
    const steps  = vB - vA - 1;
    const palette = interpolateColors(cpA.color, cpB.color, steps);
    for (let k = 0; k < palette.length - 1; k++) {
      colorRule.push({ value: vA + k, color: palette[k] });
    }
  }
  colorRule.push({ value: sorted[sorted.length - 1].value, color: sorted[sorted.length - 1].color });

  generatedColorMap = { stops: sorted.map((cp) => ({ ...cp })), colorRule };
  setRuleStatus("defined");
  setCrMessage(`Color rule generated: ${colorRule.length} color entries (${minVal} → ${maxVal}).`);
  renderColorPreview(colorRule, sorted);
});

// ─── Color rule – preview ─────────────────────────────────────────────────────
function renderColorPreview(colorRule, stops) {
  const gradientCss = `linear-gradient(to right, ${colorRule.map((e) => e.color).join(",")})`;

  const stopRows = stops.map((cp, i) => {
    const role = i === 0 ? "Min" : i === stops.length - 1 ? "Max" : "Internal";
    return `<tr>
      <td>${cp.value}</td>
      <td><span class="preview-swatch" style="background:${cp.color}"></span></td>
      <td style="font-family:monospace">${escapeHtml(cp.color)}</td>
      <td>${role}</td>
    </tr>`;
  }).join("");

  crPreviewBody.innerHTML = `
    <div class="preview-gradient-bar" style="background:${gradientCss}" title="Full color gradient"></div>
    <div class="preview-range-label">
      <span>${colorRule[0].value}</span>
      <span>${colorRule[colorRule.length - 1].value}</span>
    </div>
    <div class="preview-table-wrap">
      <table class="preview-table">
        <thead><tr><th>Value</th><th>Color</th><th>Hex</th><th>Role</th></tr></thead>
        <tbody>${stopRows}</tbody>
      </table>
    </div>
    <div class="preview-total">${colorRule.length} total integer entries</div>
  `;
}

// ─── Color rule – Save ────────────────────────────────────────────────────────
saveRuleBtn.addEventListener("click", () => {
  if (controlPoints.every((cp) => cp.value === null)) {
    setCrMessage("Nothing to save — no values have been set yet.", true);
    return;
  }

  // Save the raw control points (not the generated map) so it can be re-edited
  const payload = {
    version: 1,
    controlPoints: controlPoints.map((cp) => ({ value: cp.value, color: cp.color })),
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);

  const a    = document.createElement("a");
  a.href     = url;
  a.download = `color-rule-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  setCrMessage("Color rule saved to file.");
});

// ─── Color rule – Import ──────────────────────────────────────────────────────
importRuleBtn.addEventListener("click", () => {
  importRuleInput.value = ""; // reset so same file can be re-imported
  importRuleInput.click();
});

importRuleInput.addEventListener("change", () => {
  const file = importRuleInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Support both formats:
      //   { version: 1, controlPoints: [...] }  ← saved by this app
      //   [{value, color}, ...]                  ← raw array shorthand
      let cps;
      if (Array.isArray(data)) {
        cps = data;
      } else if (data && Array.isArray(data.controlPoints)) {
        cps = data.controlPoints;
      } else {
        throw new Error("Unrecognized format. Expected { controlPoints: [...] } or a plain array.");
      }

      if (cps.length < 2) {
        throw new Error("A color rule must have at least 2 control points (min and max boundaries).");
      }

      // Validate each entry
      const imported = cps.map((cp, i) => {
        const value = cp.value === null || cp.value === undefined ? null : Number(cp.value);
        if (value !== null && !Number.isInteger(value)) {
          throw new Error(`Entry ${i}: value must be an integer or null, got "${cp.value}".`);
        }
        const color = normalizeHex(String(cp.color ?? ""));
        if (!color) {
          throw new Error(`Entry ${i}: invalid color "${cp.color}".`);
        }
        return { value: value === null ? null : value, color };
      });

      controlPoints = imported;
      invalidateColorMap();
      renderCpList();
      setCrMessage(`Imported ${imported.length} control points from "${file.name}".`);
    } catch (err) {
      setCrMessage(`Import failed: ${err.message}`, true);
    }
  };
  reader.readAsText(file);
});

// ─── File inputs ──────────────────────────────────────────────────────────────
excelInput.addEventListener("change", async () => {
  const file = excelInput.files[0];
  excelName.textContent = file ? file.name : "No file selected";
  if (!file) return;

  const formData = new FormData();
  formData.append("excel", file);
  setMessage("Reading Excel columns...", "busy");
  try {
    const response = await fetch("/api/excel-columns", { method: "POST", body: formData });
    const result   = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to read Excel file.");
    fillColumnSelectors(result.columns);
    setMessage("Excel columns loaded.");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

kmlInput.addEventListener("change", () => {
  const count = kmlInput.files.length;
  kmlName.textContent =
    count === 0 ? "No files selected" : count === 1 ? kmlInput.files[0].name : `${count} files selected`;
});

// ─── Draw button ──────────────────────────────────────────────────────────────
drawButton.addEventListener("click", async () => {
  if (!excelInput.files[0]) {
    setMessage("Choose an Excel file first.", "error");
    return;
  }
  if (!kmlInput.files.length) {
    setMessage("Choose at least one KML file.", "error");
    return;
  }
  if (!generatedColorMap) {
    setMessage("Please define and generate the Color Rule (section 4) before drawing.", "error");
    if (colorRuleBody.hidden) colorRuleToggle.click();
    generateRuleBtn.classList.add("btn-pulse");
    setTimeout(() => generateRuleBtn.classList.remove("btn-pulse"), 1200);
    return;
  }

  const formData = new FormData();
  formData.append("excel",      excelInput.files[0]);
  for (const file of kmlInput.files) formData.append("kml", file);
  formData.append("lat_col",    latColumn.value);
  formData.append("lon_col",    lonColumn.value);
  formData.append("value_col",  valueColumn.value);
  formData.append("color_rule", JSON.stringify(generatedColorMap.colorRule));

  drawButton.disabled = true;
  setMessage("Running Kriging interpolation and clipping to KML boundaries...", "busy");

  try {
    const response = await fetch("/api/render", { method: "POST", body: formData });
    const result   = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to draw map.");

    resultImage.src         = `${result.image_url}?t=${Date.now()}`;
    resultImage.hidden      = false;
    imagePlaceholder.hidden = true;
    updateLegend(result.legend);
    updateStats(result.stats);
    setMessage("Finished image is shown below.");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    drawButton.disabled = false;
  }
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
renderCpList();
