# NOAA Integrated Surface Database (ISD): Air Temperature & Extreme (`KA`) Tags Specification

---

## 1. Overview & Time Representation

* **Dataset:** NOAA Integrated Surface Database (Full ISD, Format 3505).
* **Timestamps:** Every observation record is stamped strictly in **Coordinated Universal Time (UTC)** (`YYYYMMDDhhmm`).
* **Summary Time Principle:** ISD itself does **not** predefine a daily cutoff or summary time. Instead, a summary observation represents the window:
  $$\left[\text{Observation Timestamp} - \text{Period Quantity}\right] \;\longrightarrow\; \left[\text{Observation Timestamp}\right]$$

---

## 2. Mandatory Section: Instantaneous Temperature Variables

Every valid ISD record contains the core ambient air temperature and dew point in its mandatory fixed-position header:

| Field Name | Identifier | Length | Format / Units | Description & Missing Value |
| :--- | :--- | :--- | :--- | :--- |
| **Air Temperature** | `TMP` | 5 chars | Tenths of $^\circ\text{C}$ (signed) | Ambient dry-bulb temperature (e.g., `+0235` = $+23.5^\circ\text{C}$, `-0120` = $-12.0^\circ\text{C}$). Missing: `+9999`. |
| **Air Temp QC** | — | 1 char | Alphanumeric | Quality code (`1`, `5` = Passed QC; `2`, `3`, `6`, `7` = Suspect/Erroneous). |
| **Dew Point Temp** | `DEW` | 5 chars | Tenths of $^\circ\text{C}$ (signed) | Dew point temperature (e.g., `+0115` = $+11.5^\circ\text{C}$). Missing: `+9999`. |
| **Dew Point QC** | — | 1 char | Alphanumeric | Quality code. |

---

## 3. Additional Data Section: Extreme Air Temperature (`KA1`–`KA4`)

When stations track and report maximum or minimum temperatures over preceding time windows (via WMO SYNOP, METAR, or national networks), they are placed in the **Additional Data Section** under the identifiers **`KA1`, `KA2`, `KA3`, and `KA4`**.

### 3.1 Field Structure

Each `KA` block contains exactly **10 characters** (excluding the 3-character identifier):

$$\mathbf{KA[1\text{–}4]} + \underbrace{\mathbf{[PPP]}}_{\text{Period Quantity}} + \underbrace{\mathbf{[C]}}_{\text{Extreme Code}} + \underbrace{\mathbf{[sTTTT]}}_{\text{Air Temperature}} + \underbrace{\mathbf{[Q]}}_{\text{QC Code}}$$

| Element | Length | Type | Description |
| :--- | :--- | :--- | :--- |
| **Identifier** | 3 | Text | `KA1`, `KA2`, `KA3`, or `KA4`. |
| **Period Quantity** | 3 | Numeric | Duration of the measurement window in **tenths of hours** (Range: `001` to `480`). Missing: `999`. |
| **Extreme Code** | 1 | Text | `M` = Maximum temperature during the period.<br>`N` = Minimum temperature during the period. |
| **Temperature** | 5 | Numeric | Extreme temperature in **tenths of $^\circ\text{C}$** with sign (`+` or `-`). Missing: `+9999`. |
| **Quality Code** | 1 | Text | QC status (`1`, `5` = Passed QC). |

---

### 3.2 Occurrence Rules: Why `KA1` vs. `KA2`–`KA4`?

The trailing number (`1` to `4`) represents the **repetition index** within a single observation message:

* **`KA1`:** The **first** extreme group reported in that record. A record will *never* contain `KA2` without first containing `KA1`.
* **`KA2` through `KA4`:** Generated when a station reports **multiple extremes at the exact same observation timestamp**.

#### Common Scenarios with Multiple Tags:
1. **Reporting both Min and Max simultaneously:**
   * `KA1` = Past 6-hour Minimum (`060N`)
   * `KA2` = Past 6-hour Maximum (`060M`)
2. **Reporting different time horizons at a major synoptic hour:**
   * `KA1` = 6-hour Max (`060M`)
   * `KA2` = 6-hour Min (`060N`)
   * `KA3` = 24-hour Max (`240M`)
   * `KA4` = 24-hour Min (`240N`)

---

### 3.3 Period Quantity Reference Table

The 3-digit period quantity represents $\text{hours} \times 10$:

| Encoded Value | Actual Hours | Source / Typical Context |
| :---: | :---: | :--- |
| `010` | **1.0 hour** | **METAR / Airport AWS (ASOS/AWOS):** Hourly extremes logged in remarks. |
| `030` | **3.0 hours** | **Intermediate Synoptic Stations:** Observations at 03, 09, 15, 21 UTC. |
| `060` | **6.0 hours** | **Main Synoptic Stations (WMO):** Observations at 00, 06, 12, 18 UTC. |
| `120` | **12.0 hours** | **WMO Synoptic Day/Night Cycles:** 06:00 UTC (night min) and 18:00 UTC (day max). |
| `240` | **24.0 hours** | **National Climatological Summaries:** Dedicated daily statistical dates. |

---

## 4. International Implementation Examples

### Example A: China Meteorological Administration (CMA Standard)
* **National Rule:** A statistical day runs from **20:00 to 20:00 local time (CST / UTC+8)**, which corresponds to **12:00 to 12:00 UTC**.
* **ISD Appearance:** Look for records stamped at **`12:00 UTC`** containing period `240`:
  ```text
  ...KA1240M+03151KA2240N+01781...
  ```
  * `KA1 240 M +0315 1`: Past **24.0 hours**, **Max** $= +31.5^\circ\text{C}$.
  * `KA2 240 N +0178 1`: Past **24.0 hours**, **Min** $= +17.8^\circ\text{C}$.
  * **Summary Window:** 12:00 UTC yesterday $\rightarrow$ 12:00 UTC today (20:00 to 20:00 CST).

### Example B: Greenland Summit Station (WMO 04419)
* **WMO Synoptic Rule:** Polar and European automated stations rarely emit a single 24-hour tag (`240`). Instead, they transmit **6-hour** (`060`) or **12-hour** (`120`) blocks.
* **ISD Appearance at 06:00 UTC:**
  ```text
  ...KA1060N-05241KA2060M-04311...
  ```
  * `KA1 060 N -0524 1`: Past **6.0 hours** (00:00–06:00 UTC), **Min** $= -52.4^\circ\text{C}$.
  * `KA2 060 M -0431 1`: Past **6.0 hours** (00:00–06:00 UTC), **Max** $= -43.1^\circ\text{C}$.

---

## 5. How to Derive Daily Extremes from Full ISD

1. **For 24-Hour Stations (e.g., China):**
   * Filter records for `Timestamp == Target_Hour UTC` and `Period == 240`.
   * Extract `M` as $T_{\max}$ and `N` as $T_{\min}$.
2. **For Sub-Daily Stations (e.g., WMO 6h / 12h stations like 04419):**
   * Collect all `KA` tags across the sub-daily windows spanning your 24-hour target period:
     $$T_{\max} = \max\left(T_{\text{all } M \text{ reports}}\right), \quad T_{\min} = \min\left(T_{\text{all } N \text{ reports}}\right)$$
3. **Universal Method (Hourly Dry-Bulb):**
   * Group the instantaneous mandatory `TMP` readings across your defined 24-hour window (whether local midnight-to-midnight or national summary time) and compute `min(TMP)` and `max(TMP)`.

---

## 6. Python Parsing Pattern for Full ISD `KA` Tags

```python
import re

# Regular expression to extract all KA tags (KA1 to KA4)
# Captures: (Tag, Period, Type, Temperature, QualityCode)
KA_REGEX = re.compile(r'(KA[1-4])(\d{3})([MN])([+-]\d{4})(\d)')

def parse_isd_temperature_extremes(raw_isd_line):
    """
    Parses extreme temperature tags (KA1-KA4) from an ISD record line.
    Returns a list of structured extreme records.
    """
    results = []
    for match in KA_REGEX.finditer(raw_isd_line):
        tag, period_raw, ext_type, temp_raw, qc = match.groups()
        
        # Scaling factor is 10 for both period and temperature
        period_hours = int(period_raw) / 10.0
        temp_celsius = int(temp_raw) / 10.0
        
        results.append({
            "tag": tag,
            "period_hours": period_hours,
            "metric": "MAX" if ext_type == "M" else "MIN",
            "temperature_c": temp_celsius,
            "qc_code": qc
        })
    return results
```