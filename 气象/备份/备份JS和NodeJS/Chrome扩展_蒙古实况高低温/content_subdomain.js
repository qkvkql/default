// =====================================================================
// Simplified Extension for subdomain pages (e.g. uvs.weather.gov.mn)
// Only 2 functions: Input target date + Get Avg
// =====================================================================

let forcedLatestMonthDay = '';
let lastHourlyDataLines = [];      // Cache last collected hourly data lines
const stationHourlyCache = new Map(); // normalized station name -> its hourly chart data

// Wait 1 second after load to inject the panel
setTimeout(() => {
    initSimplifiedExtension();
}, 1000);

function initSimplifiedExtension() {
    const panel = document.createElement('div');
    panel.id = 'my-weather-extension-panel-simple';

    // --- Header (always visible, clickable to collapse) ---
    const header = document.createElement('div');
    header.className = 'panel-header-simple';

    const title = document.createElement('span');
    title.className = 'panel-title-simple';
    title.innerText = '🌡 Weather Avg Tool';

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'panel-collapse-btn';
    collapseBtn.title = 'Collapse / Expand';
    collapseBtn.innerText = '▲';

    header.appendChild(title);
    header.appendChild(collapseBtn);
    panel.appendChild(header);

    // Toggle collapse when header or button is clicked
    header.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
    });

    // --- Body (collapsible) ---
    const body = document.createElement('div');
    body.className = 'panel-body-simple';

    // --- Date Input ---
    const forcedDateRow = document.createElement('div');
    forcedDateRow.className = 'forced-date-row-simple';
    const forcedDateInput = document.createElement('input');
    forcedDateInput.id = 'my-weather-forced-latest-date-simple';
    forcedDateInput.type = 'text';
    forcedDateInput.maxLength = 5;
    forcedDateInput.placeholder = 'Target date (mm-dd)';
    forcedDateInput.value = getTodayMonthDayDash();
    forcedLatestMonthDay = forcedDateInput.value;
    forcedDateInput.addEventListener('input', () => {
        forcedLatestMonthDay = (forcedDateInput.value || '').trim();
    });
    forcedDateRow.appendChild(forcedDateInput);
    body.appendChild(forcedDateRow);

    // --- Button Row (Get Avg) ---
    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row-simple';

    const avgBtn = document.createElement('button');
    avgBtn.id = 'my-btn-get-avg-simple';
    avgBtn.innerText = 'Get Avg';
    avgBtn.className = 'btn-avg-simple';
    avgBtn.addEventListener('click', handleGetDailyAverage);
    btnRow.appendChild(avgBtn);
    body.appendChild(btnRow);

    // --- Button Row (Copy Hourly Data) ---
    const copyRow = document.createElement('div');
    copyRow.className = 'btn-row-simple';
    const copyHourlyBtn = document.createElement('button');
    copyHourlyBtn.id = 'my-btn-copy-hourly-simple';
    copyHourlyBtn.innerText = 'Copy Hourly Data';
    copyHourlyBtn.className = 'btn-copy-hourly-simple';
    copyHourlyBtn.addEventListener('click', handleCopyHourlyData);
    copyRow.appendChild(copyHourlyBtn);
    body.appendChild(copyRow);

    // --- Result Box ---
    const resultBox = document.createElement('div');
    resultBox.id = 'my-weather-result-simple';
    resultBox.innerText = 'Ready...';
    resultBox.title = 'Click to copy raw content';
    resultBox.addEventListener('click', () => {
        copyToClipboard(resultBox.innerText, resultBox);
    });
    body.appendChild(resultBox);

    // --- Get Map Data Button ---
    const mapBtnRow = document.createElement('div');
    mapBtnRow.className = 'btn-row-simple';
    const mapBtn = document.createElement('button');
    mapBtn.id = 'my-btn-get-map-data-simple';
    mapBtn.innerText = 'Get Map Data';
    mapBtn.className = 'btn-map-data-simple';
    mapBtn.addEventListener('click', handleGetMapData);
    mapBtnRow.appendChild(mapBtn);
    body.appendChild(mapBtnRow);

    // --- Map Result Box ---
    const mapResultBox = document.createElement('div');
    mapResultBox.id = 'my-weather-map-result-simple';
    mapResultBox.innerText = 'Map data: not loaded';
    mapResultBox.title = 'Click to copy map station data';
    mapResultBox.addEventListener('click', () => {
        copyToClipboard(mapResultBox.innerText, mapResultBox);
    });
    body.appendChild(mapResultBox);

    panel.appendChild(body);
    document.body.appendChild(panel);

    // Seed the per-station cache from the station already selected on page load.
    getStationHourlyState(getSelectedStationName());
    initializeMapStationList();
}

// =====================================================================
// Utility functions
// =====================================================================

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function pad2(n) {
    return String(n).padStart(2, '0');
}

function getTodayMonthDayDash() {
    const now = new Date();
    return `${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function copyToClipboard(text, elementToFlash) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        if (elementToFlash) {
            const originalColor = elementToFlash.style.color;
            elementToFlash.style.color = 'white';
            setTimeout(() => { elementToFlash.style.color = originalColor; }, 200);
        }
        alert("Copied to clipboard!");
    });
}

function copyTextSilently(text) {
    const value = text ?? '';
    return navigator.clipboard.writeText(value).catch(clipboardError => {
        // The chart sweep may outlast the browser's transient user-gesture
        // window. With the extension clipboardWrite permission, execCommand
        // provides a synchronous fallback that still works after that delay.
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-10000px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        let copied = false;
        try {
            copied = document.execCommand('copy');
        } finally {
            textarea.remove();
        }
        if (!copied) throw clipboardError;
    });
}

function getSelectedStationName() {
    const candidates = Array.from(document.querySelectorAll('p.text-base'));
    for (const el of candidates) {
        const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        const match = text.match(/^\d{1,2}:\d{2},\s*(.+)$/);
        if (match && match[1].trim()) return match[1].trim();
    }
    return '';
}

function getStationHourlyState(name) {
    const displayName = String(name || '').trim();
    if (!displayName) return null;
    // Map popups often show only the station name, while the page header shows
    // "aimag, station". Use the final component so both resolve to one cache.
    const stationPart = displayName.split(',').map(part => part.trim()).filter(Boolean).pop() || displayName;
    const key = normalizeStationName(stationPart);
    if (!key) return null;
    if (!stationHourlyCache.has(key)) {
        stationHourlyCache.set(key, {
            name: displayName,
            read: false,
            hourlyRecords: null,
            parsedEntries: null,
            hourlyLines: []
        });
    }
    return stationHourlyCache.get(key);
}

// =====================================================================
// Date parsing / target date resolution
// =====================================================================

function parseForcedMonthDayInput(value) {
    const cleaned = String(value || '').trim();
    const m = cleaned.match(/^(\d{2})-(\d{2})$/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    return { month, day };
}

function resolveTargetDateForRecords(parsedEntries) {
    if (!Array.isArray(parsedEntries) || !parsedEntries.length) return null;
    const latest = parsedEntries.reduce((a, b) => (a.dt > b.dt ? a : b));
    const latestDate = new Date(latest.dt.getFullYear(), latest.dt.getMonth(), latest.dt.getDate());
    const forced = parseForcedMonthDayInput(forcedLatestMonthDay);
    if (!forced) return latestDate;

    let year = latestDate.getFullYear();
    if (forced.month - (latestDate.getMonth() + 1) > 6) {
        year -= 1;
    }
    return new Date(year, forced.month - 1, forced.day);
}

function formatMMDDHH(dateObj) {
    return `${pad2(dateObj.getMonth() + 1)}/${pad2(dateObj.getDate())} ${pad2(dateObj.getHours())}:00`;
}

function parseMMDDHH(dateTimeStr) {
    const m = dateTimeStr.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    const hour = Number(m[3]);
    const minute = Number(m[4]);
    const now = new Date();
    let year = now.getFullYear();
    if (month - (now.getMonth() + 1) > 6) {
        year -= 1;
    }
    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

// =====================================================================
// Tooltip parsing (for reading temperature data from ECharts tooltips)
// =====================================================================

function parseTooltipText(tooltipText) {
    if (!tooltipText) return [];
    // Normalize unicode minus signs
    const normalized = tooltipText.replace(/[\u2212\u2013\u2014]/g, '-');
    const lines = normalized
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    // Support 2024-09-30 02:00, 2024.09.30 02:00, 2024/09/30 02:00, 09/30 02:00, 09-30 02:00, 09.30 02:00
    const dateRegex = /(?:(\d{4})[-/.])?\s*(\d{1,2})[-/. сарын]+\s*(\d{1,2})\s+(\d{1,2}):(\d{2})/;
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Must relate to air temperature, but exclude soil or felt temperature
        if (!lower.includes('температур')) continue;
        if (lower.includes('хөрсний') || lower.includes('мэдрэгдэх')) continue;

        // Look for date in previous lines (or current / next lines)
        let dateTime = null;
        for (let j = i; j >= 0; j--) {
            const m = lines[j].match(dateRegex);
            if (m) {
                dateTime = `${pad2(m[2])}/${pad2(m[3])} ${pad2(m[4])}:${m[5]}`;
                break;
            }
        }
        if (!dateTime) {
            for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
                const m = lines[j].match(dateRegex);
                if (m) {
                    dateTime = `${pad2(m[2])}/${pad2(m[3])} ${pad2(m[4])}:${m[5]}`;
                    break;
                }
            }
        }
        if (!dateTime) continue;

        let tempValue = null;
        // 1. Check if number is on the same line after 'температур'
        const idx = lower.indexOf('температур');
        let after = line.slice(idx + 'температур'.length);
        // Avoid matching '2m' / '2м' sensor height specification
        after = after.replace(/\b2\s*[мm]\b/gi, '');

        // If colon present, check after colon first
        const colonIdx = after.indexOf(':');
        if (colonIdx >= 0) {
            const mColon = after.slice(colonIdx + 1).match(/-?\d+(?:\.\d+)?/);
            if (mColon) tempValue = Number(mColon[0]);
        }
        // If not found yet, check with °C
        if (tempValue === null) {
            const mDeg = after.match(/(-?\d+(?:\.\d+)?)\s*°?C/i);
            if (mDeg) tempValue = Number(mDeg[1]);
        }
        // Fallback for same line
        if (tempValue === null) {
            const mSame = after.match(/-?\d+(?:\.\d+)?/);
            if (mSame) tempValue = Number(mSame[0]);
        }

        // 2. If not on the same line, check next 1-3 lines
        if (tempValue === null) {
            for (let k = i + 1; k <= i + 3 && k < lines.length; k++) {
                const kLower = lines[k].toLowerCase();
                if (kLower.includes('салхины') || kLower.includes('тунадас') || dateRegex.test(lines[k])) {
                    // series boundary
                }
                const mNext = lines[k].match(/-?\d+(?:\.\d+)?/);
                if (mNext) {
                    tempValue = Number(mNext[0]);
                    break;
                }
            }
        }

        if (typeof tempValue === 'number' && !Number.isNaN(tempValue)) {
            output.push({ dateTime, temp: tempValue });
        }
    }

    // Fallback: if no line had 'температур' explicitly, look for date + °C
    if (output.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(dateRegex);
            if (m) {
                const dt = `${pad2(m[2])}/${pad2(m[3])} ${pad2(m[4])}:${m[5]}`;
                for (let k = i + 1; k <= Math.min(lines.length - 1, i + 3); k++) {
                    const mTemp = lines[k].match(/(-?\d+(?:\.\d+)?)\s*(?:°C|C)?/);
                    if (mTemp && (lines[k].includes('°C') || !lines[k].includes('m/s'))) {
                        const val = Number(mTemp[1]);
                        if (!Number.isNaN(val)) {
                            output.push({ dateTime: dt, temp: val });
                            break;
                        }
                    }
                }
            }
        }
    }

    return output;
}

// =====================================================================
// Chart interaction: zoom, pan, collect temperature data
// =====================================================================

function findChartCanvas() {
    return document.querySelector('.echarts-container canvas') ||
        document.querySelector('canvas[data-zr-dom-id]') ||
        document.querySelector('.echarts-for-react canvas') ||
        null;
}

function getHourlyChartHost() {
    const chartCanvas = findChartCanvas();
    if (!chartCanvas) return null;
    const host = chartCanvas.closest('div[_echarts_instance_]') ||
        chartCanvas.closest('.echarts-for-react') ||
        chartCanvas.closest('.echarts-container') ||
        chartCanvas.parentElement;
    return host || null;
}

function getEchartsInstanceFromHost(host) {
    const echartsGlobal = window.echarts;
    if (!echartsGlobal || typeof echartsGlobal.getInstanceByDom !== 'function') return null;
    let chart = echartsGlobal.getInstanceByDom(host);
    if (chart) return chart;
    const withInstance = host.querySelector?.('div[_echarts_instance_]');
    if (withInstance) {
        chart = echartsGlobal.getInstanceByDom(withInstance);
    }
    return chart;
}

function getDataZoomCoveragePercent(chart) {
    const option = chart.getOption?.();
    const dataZoom = option?.dataZoom || [];
    if (!dataZoom.length) return 100;
    let minStart = 100;
    let maxEnd = 0;
    dataZoom.forEach(z => {
        if (typeof z.start === 'number') minStart = Math.min(minStart, z.start);
        if (typeof z.end === 'number') maxEnd = Math.max(maxEnd, z.end);
    });
    if (minStart === 100 && maxEnd === 0) return 0;
    return Math.max(0, maxEnd - minStart);
}

function isDataZoomAtFullRange(chart) {
    const dataZoom = chart?.getOption?.()?.dataZoom || [];
    return dataZoom.every(z => {
        const start = typeof z.start === 'number' ? z.start : 0;
        const end = typeof z.end === 'number' ? z.end : 100;
        return start <= 0.5 && end >= 99.5;
    });
}

function forceDataZoomFullRange(chart) {
    const option = chart.getOption?.();
    const dataZoom = option?.dataZoom || [];
    if (!dataZoom.length) return;
    const patchedDataZoom = dataZoom.map(z => ({
        ...z,
        start: 0,
        end: 100,
        startValue: null,
        endValue: null
    }));
    chart.setOption({ dataZoom: patchedDataZoom }, { replaceMerge: ['dataZoom'] });
    chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
    for (let i = 0; i < patchedDataZoom.length; i++) {
        chart.dispatchAction({ type: 'dataZoom', dataZoomIndex: i, start: 0, end: 100 });
    }
}

async function ensureHourlyChartFullRange(chartCanvas) {
    const host = chartCanvas?.closest('div[_echarts_instance_]') || getHourlyChartHost();
    const chart = host ? getEchartsInstanceFromHost(host) : null;
    // Some builds keep ECharts private. In that case, confirm both scrollbar
    // handles are physically at their track endpoints by checking the cursor.
    if (!chart) return await areScrollbarHandlesAtEndpoints(chartCanvas);

    for (let attempt = 0; attempt < 4; attempt++) {
        forceDataZoomFullRange(chart);
        await wait(180);
        if (isDataZoomAtFullRange(chart) && getDataZoomCoveragePercent(chart) >= 99.5) return true;
    }
    return false;
}

async function areScrollbarHandlesAtEndpoints(chartCanvas) {
    if (!chartCanvas) return false;
    const rect = chartCanvas.getBoundingClientRect();
    const yOffsets = [18, 16, 20, 22, 14, 24, 26, 12, 28];
    let leftFound = false;
    let rightFound = false;

    for (const yOffset of yOffsets) {
        const y = rect.bottom - yOffset;
        for (let xOffset = 48; xOffset <= 100 && !leftFound; xOffset += 2) {
            dispatchHoverPoint(chartCanvas, rect.left + xOffset, y);
            await wait(3);
            leftFound = isResizeCursor(getCursorStyle(chartCanvas));
        }
        for (let xOffset = rect.width - 100; xOffset <= rect.width - 38 && !rightFound; xOffset += 2) {
            dispatchHoverPoint(chartCanvas, rect.left + xOffset, y);
            await wait(3);
            rightFound = isResizeCursor(getCursorStyle(chartCanvas));
        }
        if (leftFound && rightFound) return true;
    }
    return false;
}

function dispatchPointerLikeMouseEvent(target, type, clientX, clientY, buttons) {
    target.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        button: 0,
        buttons
    }));
}

async function dragZoomRightEdgeToMax(chartCanvas, bottomOffsetPx) {
    const rect = chartCanvas.getBoundingClientRect();
    const y = Math.max(rect.top + 1, rect.bottom - bottomOffsetPx);
    const startX = rect.left + rect.width * 0.5;
    const endX = rect.left + rect.width - 2;

    dispatchPointerLikeMouseEvent(chartCanvas, 'mousemove', startX, y, 0);
    await wait(10);
    dispatchPointerLikeMouseEvent(chartCanvas, 'mousedown', startX, y, 1);
    await wait(20);

    const steps = 10;
    for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        dispatchPointerLikeMouseEvent(window, 'mousemove', x, y, 1);
        dispatchPointerLikeMouseEvent(document, 'mousemove', x, y, 1);
        dispatchPointerLikeMouseEvent(chartCanvas, 'mousemove', x, y, 1);
        await wait(8);
    }

    dispatchPointerLikeMouseEvent(window, 'mouseup', endX, y, 0);
    dispatchPointerLikeMouseEvent(document, 'mouseup', endX, y, 0);
    dispatchPointerLikeMouseEvent(chartCanvas, 'mouseup', endX, y, 0);
}

async function zoomOutHourlyChartFully() {
    const host = getHourlyChartHost();
    if (!host) {
        throw new Error('Hourly chart container not found.');
    }
    const chartCanvas = host.querySelector('canvas') || findChartCanvas();
    if (!chartCanvas) {
        throw new Error('Hourly chart canvas not found for zoom drag.');
    }

    const chart = getEchartsInstanceFromHost(host);
    if (chart) {
        for (let i = 0; i < 3; i++) {
            forceDataZoomFullRange(chart);
            await wait(100);
            const coverage = getDataZoomCoveragePercent(chart);
            if (coverage >= 99.5) break;
        }
    }

    const bottomOffsets = [12, 16, 20, 24, 28, 32, 36];
    for (const offset of bottomOffsets) {
        await dragZoomRightEdgeToMax(chartCanvas, offset);
        await wait(90);
    }

    if (chart) {
        forceDataZoomFullRange(chart);
        await wait(120);
    }
}

// =====================================================================
// Step 4: Sweep hourly chart from left to right to read all hour points
// =====================================================================

function extractActiveTooltipTexts(chartCanvas) {
    const texts = [];
    const host = chartCanvas.closest('div[_echarts_instance_]') || chartCanvas.parentElement || document.body;

    const selectors = [
        'div[style*="z-index: 9999999"]',
        'div[style*="z-index:9999999"]',
        'div[style*="z-index: 999999"]',
        'div[style*="z-index:999999"]',
        'div[style*="z-index: 99999"]',
        'div[style*="z-index:99999"]',
        'div[style*="z-index: 9999"]',
        'div[style*="z-index:9999"]',
        'div[style*="position: absolute"]',
        'div[style*="position:absolute"]'
    ];

    const elements = new Set();
    selectors.forEach(sel => {
        try {
            host.querySelectorAll(sel).forEach(el => elements.add(el));
            document.body.querySelectorAll(sel).forEach(el => elements.add(el));
        } catch (_) {}
    });

    if (chartCanvas.parentElement) {
        chartCanvas.parentElement.querySelectorAll('div').forEach(el => elements.add(el));
    }
    if (host && host !== chartCanvas.parentElement) {
        host.querySelectorAll('div').forEach(el => elements.add(el));
    }

    for (const el of elements) {
        if (el === chartCanvas) continue;
        if (el.closest('#my-weather-extension-panel-simple')) continue;
        if (el.closest('#my-virtual-cursor')) continue;

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (parseFloat(style.opacity || '1') === 0) continue;

        const txt = el.innerText || el.textContent || '';
        if (!txt) continue;

        const normalized = txt.replace(/[\u2212\u2013\u2014]/g, '-');
        if (normalized.toLowerCase().includes('температур') || /\d{1,2}\/\d{1,2}/.test(normalized) || /\d{4}[-/.]\d{1,2}/.test(normalized)) {
            texts.push(normalized);
        }
    }

    return texts;
}

async function sweepHourlyChartTemperature(chartCanvas, box) {
    // Ensure chart is scrolled into view so bounding client rect coordinates are accurate
    try {
        chartCanvas.scrollIntoView({ behavior: 'auto', block: 'center' });
        await wait(80);
    } catch (_) {}

    const rect = chartCanvas.getBoundingClientRect();
    // Grid 0 starts around left: 50px-60px, ends around right: 40px-50px
    const startX = Math.round(rect.left + 50);
    const endX = Math.round(rect.right - 40);

    // Temperature line is in Grid 0 (upper 35% of chart)
    const sweepY = Math.round(rect.top + (rect.height * 0.25 || 75));

    const recordsMap = new Map();
    const sweepStep = 2; // 2px precision to guarantee every hourly point is hovered
    const totalSteps = Math.max(1, Math.floor((endX - startX) / sweepStep));

    enterCanvas(chartCanvas, startX, sweepY);
    dispatchHoverPoint(chartCanvas, startX, sweepY);
    await wait(40);

    for (let step = 0; step <= totalSteps; step++) {
        const curX = Math.min(endX, startX + step * sweepStep);

        dispatchHoverPoint(chartCanvas, curX, sweepY);

        const tooltipTexts = extractActiveTooltipTexts(chartCanvas);
        for (const text of tooltipTexts) {
            const pairs = parseTooltipText(text);
            for (const { dateTime, temp } of pairs) {
                recordsMap.set(dateTime, temp);
            }
        }

        if (step % 12 === 0 || step === totalSteps) {
            const pct = Math.round((step / totalSteps) * 100);
            showVirtualCursor(curX, sweepY, `READING ${pct}% (${recordsMap.size} pts) ⟶`);
            if (box) {
                const recent = Array.from(recordsMap.entries()).slice(-4).map(([dt, t]) => `  ${dt}: ${t} °C`);
                box.innerText = [
                    'Step 4: Reading hourly chart from left to right...',
                    `Progress: ${pct}% (X = ${Math.round(curX)})`,
                    `Hours collected: ${recordsMap.size}`,
                    '',
                    'Recent points:',
                    ...recent
                ].join('\n');
            }
        }

        await wait(8);
    }

    // Complete sweep
    dispatchHoverPoint(chartCanvas, endX, sweepY);
    showVirtualCursor(endX, sweepY, `SWEEP COMPLETE (${recordsMap.size} pts) ✓`);
    await wait(250);

    const curEl = document.getElementById('my-virtual-cursor');
    if (curEl) curEl.remove();

    return recordsMap;
}

async function collectTemperatureAcrossPannedViews(statusBox) {
    const host = getHourlyChartHost();
    if (!host) throw new Error('Hourly chart container not found.');
    const chartCanvas = host.querySelector('canvas') || findChartCanvas();
    if (!chartCanvas) throw new Error('Hourly chart canvas not found.');

    const merged = new Map();
    const collectOnce = async (label) => {
        if (statusBox) statusBox.innerText = `Reading hourly chart (${label})...`;
        const map = await collectTemperatureFromHourlyChart();
        map.forEach((v, k) => merged.set(k, v));
    };

    await collectOnce('current');

    for (let i = 0; i < 3; i++) {
        await panZoomBar(chartCanvas, 'right');
        await wait(120);
        await collectOnce(`right ${i + 1}`);
    }

    for (let i = 0; i < 6; i++) {
        await panZoomBar(chartCanvas, 'left');
        await wait(120);
        await collectOnce(`left ${i + 1}`);
    }

    return merged;
}

// =====================================================================
// Daily average calculation
// =====================================================================

function getDayEightPointAverage(recordsMap, targetDate) {
    const formerDate = new Date(targetDate);
    formerDate.setDate(formerDate.getDate() - 1);
    const requiredTimes = [
        new Date(formerDate.getFullYear(), formerDate.getMonth(), formerDate.getDate(), 23, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 2, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 5, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 8, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 11, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 14, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 17, 0, 0, 0),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 20, 0, 0, 0)
    ];

    const hoursSummary = [];
    const values = [];
    for (const dt of requiredTimes) {
        const key = formatMMDDHH(dt);
        const v = recordsMap.get(key);
        const valid = typeof v === 'number' && !Number.isNaN(v);
        hoursSummary.push(`${key} = ${valid ? v : 'EMPTY'}`);
        if (!valid) {
            return { hasAll: false, averageStr: 'EMPTY', hoursSummary };
        }
        values.push(v);
    }
    return {
        hasAll: true,
        averageStr: (values.reduce((s, n) => s + n, 0) / values.length).toFixed(2),
        hoursSummary
    };
}

function getHourlyExtremesForTargetDate(parsedEntries, targetDate) {
    if (!Array.isArray(parsedEntries) || !parsedEntries.length || !targetDate) return null;

    const start = new Date(targetDate);
    start.setDate(start.getDate() - 1);
    start.setHours(20, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(20, 0, 0, 0);

    const temps = parsedEntries
        .filter(entry => entry?.dt instanceof Date && entry.dt >= start && entry.dt <= end
            && typeof entry.temp === 'number' && Number.isFinite(entry.temp))
        .map(entry => entry.temp);
    if (!temps.length) return null;
    return { min: Math.min(...temps), max: Math.max(...temps) };
}

function getThreeDayAverages(recordsMap) {
    const parsedEntries = [];
    for (const [key, temp] of recordsMap.entries()) {
        const dt = parseMMDDHH(key);
        if (!dt || typeof temp !== 'number' || Number.isNaN(temp)) continue;
        parsedEntries.push({ dt, temp });
    }
    if (!parsedEntries.length) {
        return { latestDateStr: '', dayResults: [] };
    }

    const latestDate = resolveTargetDateForRecords(parsedEntries);
    const dayResults = [];

    for (let i = 0; i < 3; i++) {
        const day = new Date(latestDate);
        day.setDate(day.getDate() - i);
        const calc = getDayEightPointAverage(recordsMap, day);
        dayResults.push({
            dateStr: `${pad2(day.getMonth() + 1)}/${pad2(day.getDate())}`,
            hasAll: calc.hasAll,
            averageStr: calc.averageStr,
            hoursSummary: calc.hoursSummary
        });
    }

    return {
        latestDateStr: `${pad2(latestDate.getMonth() + 1)}/${pad2(latestDate.getDate())}`,
        dayResults
    };
}

// =====================================================================
// Step 1: Find and hover on the left handle of dataZoom scrollbar
// =====================================================================

// Check if a cursor value indicates a horizontal resize handle
function isResizeCursor(cursor) {
    if (!cursor) return false;
    const c = cursor.toLowerCase().trim();
    return c === 'ew-resize' || c === 'col-resize' || c === 'w-resize' || c === 'e-resize';
}

// Check if cursor indicates the scrollbar body (cross/move shape)
function isScrollbarMoveCursor(cursor) {
    if (!cursor) return false;
    const c = cursor.toLowerCase().trim();
    return c === 'move' || c === 'grab' || c === 'crosshair' || c === 'pointer';
}

function getCursorStyle(chartCanvas) {
    const p = chartCanvas.parentElement;
    const h = chartCanvas.closest('div[_echarts_instance_]');
    return (p?.style?.cursor || chartCanvas.style?.cursor || h?.style?.cursor || '').trim().toLowerCase();
}

// Dispatch native-like pointer and mouse events
// ZRender in Chrome listens primarily to pointer events (pointermove)
function dispatchHoverPoint(chartCanvas, clientX, clientY) {
    const parent = chartCanvas.parentElement;
    const host = chartCanvas.closest('div[_echarts_instance_]') || parent;

    const common = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX,
        clientY,
        screenX: clientX,
        screenY: clientY,
        pageX: clientX + window.scrollX,
        pageY: clientY + window.scrollY,
        button: 0,
        buttons: 0
    };

    if (window.PointerEvent) {
        try {
            const pe = new PointerEvent('pointermove', {
                ...common,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true,
                width: 1,
                height: 1,
                pressure: 0
            });
            chartCanvas.dispatchEvent(pe);
            if (parent) parent.dispatchEvent(pe);
        } catch (_) {}
    }

    try {
        const me = new MouseEvent('mousemove', common);
        chartCanvas.dispatchEvent(me);
        if (parent) parent.dispatchEvent(me);
        if (host && host !== parent) host.dispatchEvent(me);
    } catch (_) {}
}

// Enter the canvas region to initialize ZRender pointer state
function enterCanvas(chartCanvas, clientX, clientY) {
    const common = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX,
        clientY,
        button: 0,
        buttons: 0
    };
    if (window.PointerEvent) {
        try {
            chartCanvas.dispatchEvent(new PointerEvent('pointerenter', { ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
            chartCanvas.dispatchEvent(new PointerEvent('pointerover', { ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
        } catch (_) {}
    }
    try {
        chartCanvas.dispatchEvent(new MouseEvent('mouseenter', common));
        chartCanvas.dispatchEvent(new MouseEvent('mouseover', common));
    } catch (_) {}
}

// Scan the bottom area of the chart canvas to locate the left handle
// of the dataZoom slider.
async function findLeftHandleOfDataZoom(chartCanvas, box) {
    const rect = chartCanvas.getBoundingClientRect();

    // DataZoom slider on this page:
    // Chart height = 300px, bottom grid ends at 270px (90%).
    // The dataZoom slider is located between 270px and 295px (5px to 25px from bottom).
    // The slider track starts at rect.left + 60px (grid left is 60).
    const yOffsets = [18, 16, 20, 22, 14, 24, 26, 12, 28, 10, 30, 8, 34, 38];

    // Initialize pointer over the chart
    enterCanvas(chartCanvas, rect.left + 60, rect.bottom - 18);
    await wait(20);

    let observedCursors = new Set();

    for (const yOff of yOffsets) {
        const y = rect.bottom - yOff;
        if (y <= rect.top) continue;

        if (box) box.innerText = `Step 1: Scanning for left handle (Y = bottom - ${yOff}px)...`;

        // Scan across the full width of the dataZoom track with 2px precision
        const scanStart = 50;
        const scanEnd = Math.max(scanStart + 10, rect.width - 50);

        for (let xOff = scanStart; xOff <= scanEnd; xOff += 2) {
            const x = rect.left + xOff;

            dispatchHoverPoint(chartCanvas, x, y);
            await wait(3); // Allow ZRender frame cycle to process hover

            const cur = getCursorStyle(chartCanvas);
            if (cur && cur !== 'default') {
                observedCursors.add(cur);
            }

            if (isResizeCursor(cur)) {
                // Found a resize handle!
                // Scanning from left to right, the first resize handle found is GUARANTEED to be the LEFT HANDLE.

                // Find the exact outer-left boundary of the handle icon (near default cursor)
                let minX = x;
                for (let bx = x; bx >= rect.left + 30; bx--) {
                    dispatchHoverPoint(chartCanvas, bx, y);
                    await wait(2);
                    if (isResizeCursor(getCursorStyle(chartCanvas))) {
                        minX = bx;
                    } else {
                        break;
                    }
                }

                // Find the inner-right boundary of the handle icon (boundary with filler bar)
                let maxX = x;
                for (let fx = x; fx <= x + 25; fx++) {
                    dispatchHoverPoint(chartCanvas, fx, y);
                    await wait(2);
                    if (isResizeCursor(getCursorStyle(chartCanvas))) {
                        maxX = fx;
                    } else {
                        break;
                    }
                }

                // Click safely at minX + 2px:
                // This is on the outer left edge of the handle icon, safely away from the filler bar!
                const safeHandleX = minX + 2;

                // Dispatch multiple times to firmly anchor the hover state & show tooltip
                for (let k = 0; k < 5; k++) {
                    dispatchHoverPoint(chartCanvas, safeHandleX, y);
                    await wait(15);
                }

                return {
                    x: safeHandleX,
                    y,
                    cursor: getCursorStyle(chartCanvas) || 'ew-resize',
                    yOffset: yOff,
                    handleSpan: `${minX}px ~ ${maxX}px (Target: ${safeHandleX}px)`
                };
            }
        }
    }

    return {
        failed: true,
        observedCursors: Array.from(observedCursors),
        canvasWidth: rect.width,
        canvasHeight: rect.height,
        left: rect.left,
        top: rect.top
    };
}

// =====================================================================
// Visual Virtual Mouse Indicator
// =====================================================================

function showVirtualCursor(x, y, label = 'VIRTUAL MOUSE') {
    let el = document.getElementById('my-virtual-cursor');
    if (!el) {
        el = document.createElement('div');
        el.id = 'my-virtual-cursor';
        document.body.appendChild(el);
    }
    el.style.cssText = `
        position: fixed;
        left: ${Math.round(x)}px;
        top: ${Math.round(y)}px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: monospace;
        font-size: 12px;
        font-weight: bold;
        color: #00ffff;
        background: rgba(0, 0, 0, 0.88);
        border: 2px solid #00ffff;
        border-radius: 6px;
        padding: 4px 8px;
        box-shadow: 0 0 14px rgba(0, 255, 255, 0.9);
        transition: left 0.02s linear;
    `;
    el.innerHTML = `<span style="font-size: 16px;">⟷</span><span>${label}</span>`;
}

// =====================================================================
// Helper: dispatch mouse and pointer events for drag simulation
// =====================================================================

function dispatchDragEvent(target, type, clientX, clientY, buttons, button = 0) {
    const common = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX,
        clientY,
        screenX: clientX,
        screenY: clientY,
        pageX: clientX + window.scrollX,
        pageY: clientY + window.scrollY,
        button,
        buttons,
        which: buttons ? 1 : (type === 'mouseup' ? 1 : 0)
    };

    if (window.PointerEvent) {
        const pointerTypeMap = {
            mousedown: 'pointerdown',
            mousemove: 'pointermove',
            mouseup: 'pointerup'
        };
        const pType = pointerTypeMap[type];
        if (pType) {
            try {
                target.dispatchEvent(new PointerEvent(pType, {
                    ...common,
                    pointerId: 1,
                    pointerType: 'mouse',
                    isPrimary: true,
                    width: 1,
                    height: 1,
                    pressure: buttons ? 0.5 : 0
                }));
            } catch (_) {}
        }
    }

    try {
        target.dispatchEvent(new MouseEvent(type, common));
    } catch (_) {}
}

// =====================================================================
// Step 2: Drag left handle to the scrollbar leftmost
// =====================================================================

async function dragLeftHandleToScrollbarLeftmost(chartCanvas, startX, startY, box) {
    const rect = chartCanvas.getBoundingClientRect();
    // Scrollbar track starts at rect.left + 60px (grid.left = 60).
    // Drag to rect.left + 50px to reach the scrollbar track's leftmost edge (0%).
    const endX = Math.max(0, Math.round(rect.left + 50));

    if (box) {
        box.innerText = [
            'Step 1 SUCCESS ✓ (Left handle locked)',
            `Handle at: (${Math.round(startX)}, ${Math.round(startY)})`,
            '',
            'Step 2: Pressing mouse left button strictly on left handle...'
        ].join('\n');
    }

    // 1. Move to handle & firmly anchor hover
    for (let k = 0; k < 5; k++) {
        dispatchHoverPoint(chartCanvas, startX, startY);
        await wait(20);
    }
    showVirtualCursor(startX, startY, 'HANDLE LOCKED');
    await wait(60);

    // Verify cursor style right before press
    let curBeforePress = getCursorStyle(chartCanvas);
    if (!isResizeCursor(curBeforePress)) {
        // Nudge inwards into the handle (towards center), NEVER outwards into empty space!
        for (let step = 0; step < 4; step++) {
            startX += 1;
            dispatchHoverPoint(chartCanvas, startX, startY);
            await wait(15);
            if (isResizeCursor(getCursorStyle(chartCanvas))) break;
        }
    }

    // 2. Press left mouse button ONLY on chartCanvas (with bubbles: true).
    // This triggers ZRender's handle hit-test strictly for handle: 'left'
    dispatchDragEvent(chartCanvas, 'mousedown', startX, startY, 1, 0);
    showVirtualCursor(startX, startY, 'DRAGGING LEFT ⟵');
    await wait(60);

    // 3. Drag step by step from startX to scrollbar leftmost
    const steps = 15;
    const dx = endX - startX;
    for (let i = 1; i <= steps; i++) {
        const curX = startX + (dx * i) / steps;

        showVirtualCursor(curX, startY, `DRAGGING ${Math.round((i / steps) * 100)}% ⟵`);

        // Dispatch move events to canvas, document, and window
        dispatchDragEvent(chartCanvas, 'mousemove', curX, startY, 1, 0);
        dispatchDragEvent(document, 'mousemove', curX, startY, 1, 0);
        dispatchDragEvent(window, 'mousemove', curX, startY, 1, 0);

        if (box && i % 5 === 0) {
            box.innerText = [
                'Step 1 SUCCESS ✓',
                `Initial handle: (${Math.round(startX)}, ${Math.round(startY)})`,
                '',
                `Step 2: Dragging left handle to scrollbar leftmost... ${Math.round((i / steps) * 100)}%`
            ].join('\n');
        }
        await wait(12);
    }

    // Hold at scrollbar leftmost edge
    dispatchDragEvent(chartCanvas, 'mousemove', endX, startY, 1, 0);
    dispatchDragEvent(window, 'mousemove', endX, startY, 1, 0);
    showVirtualCursor(endX, startY, 'SCROLLBAR LEFT');
    await wait(40);

    // 4. Release mouse left key
    dispatchDragEvent(chartCanvas, 'mouseup', endX, startY, 0, 0);
    dispatchDragEvent(document, 'mouseup', endX, startY, 0, 0);
    dispatchDragEvent(window, 'mouseup', endX, startY, 0, 0);

    showVirtualCursor(endX, startY, 'RELEASED ✓');

    // 5. Wait for ECharts to update and re-render
    await wait(200);
}

// Scan to check new handle position after drag
async function checkHandleAfterDrag(chartCanvas, y) {
    const rect = chartCanvas.getBoundingClientRect();
    for (let xOff = 50; xOff <= 350; xOff += 2) {
        const x = rect.left + xOff;
        dispatchHoverPoint(chartCanvas, x, y);
        await wait(3);
        if (isResizeCursor(getCursorStyle(chartCanvas))) {
            return x;
        }
    }
    return null;
}

// Single drag cycle helper (exact logic of one click from step 216)
async function executeOneClickCycle(box, cycleLabel) {
    const chartCanvas = findChartCanvas();
    if (!chartCanvas) {
        throw new Error('Chart canvas not found on page.');
    }

    if (box) box.innerText = `${cycleLabel}: Locating left handle...`;
    const result = await findLeftHandleOfDataZoom(chartCanvas, box);

    if (!result || result.failed) {
        const parentCursor = chartCanvas.parentElement?.style?.cursor || '(none)';
        const observed = (result?.observedCursors && result.observedCursors.length)
            ? result.observedCursors.join(', ')
            : '(none)';

        box.innerText = [
            `${cycleLabel}: Left handle not detected yet.`,
            '',
            'Diagnostic info:',
            `- Canvas size: ${Math.round(result?.canvasWidth || 0)} x ${Math.round(result?.canvasHeight || 0)}`,
            `- Canvas position: (${Math.round(result?.left || 0)}, ${Math.round(result?.top || 0)})`,
            `- Parent cursor: "${parentCursor}"`,
            `- Observed cursors during scan: [${observed}]`,
            '',
            'Scanned Y offsets: bottom - 8px to 38px, X: 50px to 450px.'
        ].join('\n');
        return null;
    }

    // Show handle locked & activate hover
    dispatchHoverPoint(chartCanvas, result.x, result.y);
    showVirtualCursor(result.x, result.y, 'HANDLE LOCKED');

    box.innerText = [
        `${cycleLabel}: Step 1 SUCCESS ✓`,
        `Left handle found at (${Math.round(result.x)}, ${Math.round(result.y)})`,
        `Cursor: "${result.cursor}"`,
        '',
        'Starting Step 2: Dragging to scrollbar leftmost...'
    ].join('\n');

    await wait(200);

    // Drag left handle
    await dragLeftHandleToScrollbarLeftmost(chartCanvas, result.x, result.y, box);
    return result;
}

// =====================================================================
// Step 3: Find and drag the right handle of dataZoom scrollbar to rightmost
// =====================================================================

async function findRightHandleOfDataZoom(chartCanvas, preferredY, box) {
    const rect = chartCanvas.getBoundingClientRect();
    const yOffsets = [18, 16, 20, 22, 14, 24, 26, 12, 28, 10, 30, 8, 34, 38];
    const candidateYs = [];
    if (typeof preferredY === 'number') {
        candidateYs.push(preferredY);
    }
    for (const yOff of yOffsets) {
        const y = rect.bottom - yOff;
        if (!candidateYs.includes(y) && y > rect.top) {
            candidateYs.push(y);
        }
    }

    let observedCursors = new Set();

    for (const y of candidateYs) {
        if (box) box.innerText = `Step 3: Scanning for right handle...`;

        // Scan from right towards left (from rect.width - 35 down to 100)
        // Scanning from the right guarantees the first resize handle found is the RIGHT HANDLE!
        const scanStart = Math.max(80, Math.round(rect.width - 35));
        const scanEnd = 100;

        for (let xOff = scanStart; xOff >= scanEnd; xOff -= 2) {
            const x = rect.left + xOff;

            dispatchHoverPoint(chartCanvas, x, y);
            await wait(3);

            const cur = getCursorStyle(chartCanvas);
            if (cur && cur !== 'default') {
                observedCursors.add(cur);
            }

            if (isResizeCursor(cur)) {
                // Found right resize handle!
                // Find outer-right boundary of the right handle icon (boundary with default cursor)
                let maxX = x;
                for (let fx = x; fx <= rect.left + rect.width - 25; fx++) {
                    dispatchHoverPoint(chartCanvas, fx, y);
                    await wait(2);
                    if (isResizeCursor(getCursorStyle(chartCanvas))) {
                        maxX = fx;
                    } else {
                        break;
                    }
                }

                // Find inner-left boundary of the right handle icon (boundary with filler bar)
                let minX = x;
                for (let bx = x; bx >= x - 25; bx--) {
                    dispatchHoverPoint(chartCanvas, bx, y);
                    await wait(2);
                    if (isResizeCursor(getCursorStyle(chartCanvas))) {
                        minX = bx;
                    } else {
                        break;
                    }
                }

                // Click safely at maxX - 2px:
                // For the right handle, the filler bar is to the LEFT (minX).
                // So clicking on the outer right edge (maxX - 2) ensures we stay safely away from the filler bar!
                const safeHandleX = maxX - 2;

                // Dispatch multiple times to firmly anchor hover state & show tooltip
                for (let k = 0; k < 5; k++) {
                    dispatchHoverPoint(chartCanvas, safeHandleX, y);
                    await wait(15);
                }

                return {
                    x: safeHandleX,
                    y,
                    cursor: getCursorStyle(chartCanvas) || 'ew-resize',
                    handleSpan: `${minX}px ~ ${maxX}px (Target: ${safeHandleX}px)`
                };
            }
        }
    }

    return {
        failed: true,
        observedCursors: Array.from(observedCursors)
    };
}

async function dragRightHandleToScrollbarRightmost(chartCanvas, startX, startY, box) {
    const rect = chartCanvas.getBoundingClientRect();
    // Scrollbar track ends at rect.right - 50px (grid.right = 50).
    // Drag to rect.right - 45px to reach the scrollbar track's rightmost edge (100%).
    const endX = Math.min(Math.round(rect.right - 5), Math.round(rect.right - 45));

    if (box) {
        box.innerText = [
            'Step 3: Right handle locked',
            `Handle at: (${Math.round(startX)}, ${Math.round(startY)})`,
            '',
            'Pressing mouse left button strictly on right handle...'
        ].join('\n');
    }

    // 1. Move to handle & ensure cursor is resize cursor
    dispatchHoverPoint(chartCanvas, startX, startY);
    showVirtualCursor(startX, startY, 'RIGHT HANDLE LOCKED');
    await wait(60);

    // Verify cursor style right before press
    let curBeforePress = getCursorStyle(chartCanvas);
    if (!isResizeCursor(curBeforePress)) {
        // If not resize cursor, nudge right pixel-by-pixel towards the outer handle edge
        for (let step = 0; step < 8; step++) {
            startX += 1;
            dispatchHoverPoint(chartCanvas, startX, startY);
            await wait(15);
            if (isResizeCursor(getCursorStyle(chartCanvas))) break;
        }
    }

    // 2. Press left mouse button ONLY on chartCanvas (with bubbles: true).
    // This triggers ZRender's handle hit-test strictly for handle: 'right'
    dispatchDragEvent(chartCanvas, 'mousedown', startX, startY, 1, 0);
    showVirtualCursor(startX, startY, 'DRAGGING RIGHT ⟶');
    await wait(60);

    // 3. Drag step by step from startX to scrollbar rightmost
    const steps = 15;
    const dx = endX - startX;
    for (let i = 1; i <= steps; i++) {
        const curX = startX + (dx * i) / steps;

        showVirtualCursor(curX, startY, `DRAGGING RIGHT ${Math.round((i / steps) * 100)}% ⟶`);

        dispatchDragEvent(chartCanvas, 'mousemove', curX, startY, 1, 0);
        dispatchDragEvent(document, 'mousemove', curX, startY, 1, 0);
        dispatchDragEvent(window, 'mousemove', curX, startY, 1, 0);

        if (box && i % 5 === 0) {
            box.innerText = [
                'Step 3: Dragging right handle to scrollbar rightmost...',
                `${Math.round((i / steps) * 100)}% (X = ${Math.round(curX)})`
            ].join('\n');
        }
        await wait(12);
    }

    // Hold at scrollbar rightmost edge
    dispatchDragEvent(chartCanvas, 'mousemove', endX, startY, 1, 0);
    dispatchDragEvent(window, 'mousemove', endX, startY, 1, 0);
    showVirtualCursor(endX, startY, 'SCROLLBAR RIGHT');
    await wait(40);

    // 4. Release mouse left key
    dispatchDragEvent(chartCanvas, 'mouseup', endX, startY, 0, 0);
    dispatchDragEvent(document, 'mouseup', endX, startY, 0, 0);
    dispatchDragEvent(window, 'mouseup', endX, startY, 0, 0);

    showVirtualCursor(endX, startY, 'RELEASED ✓');
    await wait(200);
}

// Helper to execute one right handle cycle
async function executeRightHandleCycle(box, cycleLabel, preferredY) {
    const chartCanvas = findChartCanvas();
    if (!chartCanvas) {
        throw new Error('Chart canvas not found on page.');
    }

    if (box) box.innerText = `${cycleLabel}: Locating right handle...`;
    const result = await findRightHandleOfDataZoom(chartCanvas, preferredY, box);

    if (!result || result.failed) {
        box.innerText = `${cycleLabel}: Right handle not detected.`;
        return null;
    }

    // Show handle locked & activate hover
    dispatchHoverPoint(chartCanvas, result.x, result.y);
    showVirtualCursor(result.x, result.y, 'RIGHT HANDLE LOCKED');

    box.innerText = [
        `${cycleLabel}: Right handle located ✓`,
        `Handle found at (${Math.round(result.x)}, ${Math.round(result.y)})`,
        '',
        'Dragging right handle to scrollbar rightmost...'
    ].join('\n');

    await wait(200);

    // Drag right handle
    await dragRightHandleToScrollbarRightmost(chartCanvas, result.x, result.y, box);
    return result;
}

// =====================================================================
// Step 5: Calculate 8-point average & display in panel
// =====================================================================

async function calculateAndDisplayStep5(recordsMap, parsedEntries, box, isCached = false) {
    // Resolve target date from forced input or auto-detect latest
    const targetDate = resolveTargetDateForRecords(parsedEntries);
    if (!targetDate) {
        box.innerText = [
            `Collected ${recordsMap.size} points, but cannot resolve target date.`,
            'Please set the target date in the input field (mm-dd).'
        ].join('\n');
        // Clearing the clipboard is optional; a denied clipboard permission
        // must not replace the useful date-resolution message with an error.
        try { await copyTextSilently(''); } catch (_) {}
        return;
    }

    const calc = getDayEightPointAverage(recordsMap, targetDate);

    // Format the 8-point detail lines
    const targetDateStr = `${pad2(targetDate.getMonth() + 1)}/${pad2(targetDate.getDate())}`;

    const detailLines = calc.hoursSummary.map((line) => {
        // Mark missing entries clearly
        const isMissing = line.includes('EMPTY');
        return `${isMissing ? '✗' : '✓'} ${line}`;
    });

    const avgDisplay = calc.hasAll ? calc.averageStr : 'EMPTY (missing data)';
    const panelLines = [
        `8-point Average: ${avgDisplay}`,
        `Target date: ${targetDateStr}`,
        '----------------------------------------',
        ...detailLines,
        '----------------------------------------',
        `Hourly points collected: ${recordsMap.size}${isCached ? ' (cached)' : ''}`,
        `(Click "Copy Hourly Data" for all hourly records)`
    ];

    box.innerText = panelLines.join('\n');

    // Copy only the avg value (or empty string) to clipboard
    const clipboardValue = calc.hasAll ? calc.averageStr : '';
    try {
        await copyTextSilently(clipboardValue);
    } catch (e) {
        // The average is already calculated and displayed. Clipboard access is
        // optional, so keep the result visible when the site denies permission.
        box.innerText += `\n\nClipboard copy was denied; the average is shown above. (${e.message})`;
    }

    // Visual flash feedback on "Get Avg" button
    const avgBtn = document.getElementById('my-btn-get-avg-simple');
    if (avgBtn) {
        const origBg = avgBtn.style.backgroundColor || '';
        const origText = avgBtn.innerText;
        avgBtn.style.backgroundColor = '#2e7d32';
        avgBtn.innerText = calc.hasAll ? `Avg: ${calc.averageStr} ✓` : 'Calculated! ✓';
        setTimeout(() => {
            avgBtn.style.backgroundColor = origBg;
            avgBtn.innerText = origText;
        }, 1200);
    }
}

// =====================================================================
// Main handler: Get Avg button (Executes Step 1, Step 2, Step 3, and Step 4, or uses cached data)
// =====================================================================

let isSweepingInProgress = false;

async function handleGetDailyAverage(evt, stationNameOverride = '') {
    const box = document.getElementById('my-weather-result-simple');
    if (isSweepingInProgress) {
        return;
    }

    // Always ensure forcedLatestMonthDay is synchronized from input
    const dateInput = document.getElementById('my-weather-forced-latest-date-simple');
    if (dateInput) {
        forcedLatestMonthDay = (dateInput.value || '').trim();
    }

    const forceRefresh = Boolean(evt && evt.shiftKey);
    const stationName = String(stationNameOverride || '').trim() || getSelectedStationName();
    const stationState = getStationHourlyState(stationName);

    // Reuse only this station's saved hourly data. Other stations still need
    // their own first chart sweep.
    if (!forceRefresh && stationState?.read && stationState.hourlyRecords?.size > 0 && stationState.parsedEntries?.length > 0) {
        try {
            lastHourlyDataLines = stationState.hourlyLines.slice();
            await calculateAndDisplayStep5(stationState.hourlyRecords, stationState.parsedEntries, box, true);
        } catch (e) {
            box.innerText = `Error: ${e.message}`;
        }
        return;
    }

    isSweepingInProgress = true;
    try {
        // --- STEP 1 & STEP 2: Drag left handle to scrollbar leftmost ---
        box.innerText = 'Step 1 & 2: Dragging left handle to scrollbar leftmost...';
        const leftRes = await executeOneClickCycle(box, 'Step 1 & 2');
        if (!leftRes) return;

        // Check if left handle reached leftmost; if not, do 1 retry pass
        const chartCanvas = findChartCanvas();
        const checkLeftX = chartCanvas ? await checkHandleAfterDrag(chartCanvas, leftRes.y) : null;
        const targetLeftX = chartCanvas ? Math.round(chartCanvas.getBoundingClientRect().left + 75) : 0;
        if (checkLeftX !== null && checkLeftX > targetLeftX) {
            box.innerText = 'Step 1 & 2: Ensuring left handle reaches leftmost...';
            await executeOneClickCycle(box, 'Step 1 & 2 (Retry)');
        }

        // Pause before Step 3
        await wait(300);

        // --- STEP 3: Drag right handle to scrollbar rightmost ---
        const preferredY = leftRes?.y;

        box.innerText = 'Step 3: Dragging right handle to scrollbar rightmost...';
        const rightRes = await executeRightHandleCycle(box, 'Step 3', preferredY);
        if (!rightRes) return;

        const canvasForRangeCheck = findChartCanvas();
        let fullRangeConfirmed = await ensureHourlyChartFullRange(canvasForRangeCheck);
        for (let retry = 1; !fullRangeConfirmed && retry <= 2; retry++) {
            box.innerText = `Scrollbar range did not settle; retrying expansion (${retry}/2)...`;
            const retryLeft = await executeOneClickCycle(box, `Range retry ${retry}: left`);
            if (!retryLeft) break;
            const retryRight = await executeRightHandleCycle(box, `Range retry ${retry}: right`, retryLeft.y);
            if (!retryRight) break;
            fullRangeConfirmed = await ensureHourlyChartFullRange(findChartCanvas());
        }
        if (!fullRangeConfirmed) {
            throw new Error('Could not confirm the hourly chart reached the full scrollbar range. Please try again.');
        }

        // --- STEP 4: Simulate hover from left to right on hourly chart ---
        box.innerText = [
            'Step 1, 2, 3 SUCCESS ✓ (Scrollbar fully expanded)',
            '',
            'Step 4: Preparing hourly chart hover sweep...'
        ].join('\n');

        // Allow ECharts to settle and render all newly revealed points
        await wait(400);

        const canvasForSweep = findChartCanvas();
        if (!canvasForSweep) {
            throw new Error('Chart canvas not found for Step 4 sweep.');
        }

        box.innerText = 'Step 4: Reading hourly chart from left to right...';
        const recordsMap = await sweepHourlyChartTemperature(canvasForSweep, box);

        if (!recordsMap || recordsMap.size === 0) {
            box.innerText = [
                'Step 4: Sweep completed, but 0 points were collected.',
                'Please check if tooltips are displayed when hovering the hourly chart.'
            ].join('\n');
            return;
        }

        // Sort collected records chronologically (needed for resolveTargetDateForRecords)
        const parsedEntries = [];
        for (const [dateTime, temp] of recordsMap.entries()) {
            const dt = parseMMDDHH(dateTime);
            if (dt && typeof temp === 'number' && !Number.isNaN(temp)) {
                parsedEntries.push({ dt, temp });
            }
        }

        // Cache all hourly data lines (for "Copy Hourly Data" button)
        const sortedEntries = parsedEntries
            .slice()
            .sort((a, b) => a.dt - b.dt);
        lastHourlyDataLines = sortedEntries.map(e =>
            `${pad2(e.dt.getMonth() + 1)}/${pad2(e.dt.getDate())} ${pad2(e.dt.getHours())}:00\t${e.temp} °C`
        );

        // Cache retrieved records for instant subsequent calculations
        if (stationState) {
            stationState.read = true;
            stationState.hourlyRecords = new Map(recordsMap);
            stationState.parsedEntries = parsedEntries.slice();
            stationState.hourlyLines = lastHourlyDataLines.slice();
        }

        // --- STEP 5: Calculate 8-point average for target date ---
        box.innerText = 'Step 5: Calculating 8-point average...';
        await wait(50);

        await calculateAndDisplayStep5(recordsMap, parsedEntries, box, false);

    } catch (e) {
        box.innerText = `Error: ${e.message}`;
    } finally {
        isSweepingInProgress = false;
    }
}

// =====================================================================
// Copy Hourly Data button handler (re-copies last sweep result)
// =====================================================================

async function handleCopyHourlyData() {
    const box = document.getElementById('my-weather-result-simple');
    const btn = document.getElementById('my-btn-copy-hourly-simple');

    if (!lastHourlyDataLines || lastHourlyDataLines.length === 0) {
        box.innerText = 'No hourly data yet.\nPlease click "Get Avg" first to collect data.';
        return;
    }

    const text = lastHourlyDataLines.join('\n');
    try {
        await copyTextSilently(text);

        // Flash button green briefly
        if (btn) {
            const origBg = btn.style.backgroundColor || '';
            const origText = btn.innerText;
            btn.style.backgroundColor = '#2e7d32';
            btn.innerText = `Copied! ✓ (${lastHourlyDataLines.length} rows)`;
            setTimeout(() => {
                btn.style.backgroundColor = origBg;
                btn.innerText = origText;
            }, 1800);
        }
    } catch (e) {
        if (box) box.innerText = `Copy failed: ${e.message}`;
    }
}

// =====================================================================
// Map station data collection
// =====================================================================

let cachedMapStationData = null; // Cache last collected map station data
let isMapCollectionInProgress = false;

async function initializeMapStationList() {
    const mapBox = document.getElementById('my-weather-map-result-simple');
    if (!mapBox || isMapCollectionInProgress) return;
    isMapCollectionInProgress = true;
    mapBox.innerText = 'Waiting for interactive map stations...';
    try {
        // The interactive map opens on current temperature. Read names from that
        // layer so the user can choose stations before collecting extrema.
        await waitForMapStationPaths();
        const originalValue = getActiveMapTemperatureKind();
        const currentData = await collectMapStationData(null);
        const data = currentData.map(st => ({ ...st, min: '', max: '' }));
        cachedMapStationData = data;
        displayMapStationData(mapBox, data, false);
        // Keep the page's original selection in case it was not the default.
        if (originalValue !== 'current') await selectMapTemperatureOption(originalValue);
    } catch (e) {
        mapBox.innerText = `Could not load station list: ${e.message}`;
    } finally {
        isMapCollectionInProgress = false;
    }
}

async function waitForMapStationPaths(timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (getMapStationPaths().length > 0) return;
        await wait(500);
    }
    throw new Error('Leaflet map or station markers did not finish loading within 30 seconds.');
}

/**
 * Collect all station names and temperature values from the Leaflet map.
 * Strategy:
 *   1. Find all invisible SVG <path> elements with aria-describedby="leaflet-tooltip-XX"
 *   2. Read the temperature VALUE from the corresponding <div id="leaflet-tooltip-XX">
 *   3. Click each path to trigger the Leaflet popup → read the station NAME
 *   4. Return array of { name, value, tooltipId }
 *
 * NOTE: Clicking each station changes the selected station in the left panel.
 *       The last clicked station will remain selected after collection.
 */
async function collectMapStationData(statusBox) {
    const container = document.querySelector('.leaflet-container');
    if (!container) throw new Error('Leaflet map container not found on page.');

    const svgEl = container.querySelector('svg.leaflet-zoom-animated');
    if (!svgEl) throw new Error('Leaflet SVG overlay not found.');

    // Find all station marker paths (circles with aria-describedby, skip the province polygon)
    const paths = Array.from(
        svgEl.querySelectorAll('path.leaflet-interactive[aria-describedby^="leaflet-tooltip-"]')
    );
    if (!paths.length) throw new Error('No station markers found on the map.');

    const results = [];

    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const tooltipId = path.getAttribute('aria-describedby');
        if (!tooltipId) continue;

        // ① Read temperature value from the always-visible tooltip div
        const tooltipEl = document.getElementById(tooltipId);
        if (!tooltipEl) continue;
        const value = tooltipEl.textContent.trim();

        // ② Click the path center to trigger Leaflet popup with station name
        const rect = path.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Simulate a full pointer-click sequence so Leaflet's event system picks it up
        const evtOpts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window };
        path.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
        path.dispatchEvent(new MouseEvent('mousedown', evtOpts));
        path.dispatchEvent(new PointerEvent('pointerup', evtOpts));
        path.dispatchEvent(new MouseEvent('mouseup', evtOpts));
        path.dispatchEvent(new MouseEvent('click', evtOpts));

        // Wait for Leaflet to open the popup
        await wait(400);

        // ③ Read station name from the popup
        const popupEl = container.querySelector('.leaflet-popup-content');
        const name = popupEl ? popupEl.textContent.trim() : `Station #${i + 1}`;

        results.push({ name, value, tooltipId, markerPathD: path.getAttribute('d') || '' });

        if (statusBox) {
            statusBox.innerText = [
                `Reading map stations: ${i + 1} / ${paths.length}`,
                `${name}: ${value}`
            ].join('\n');
        }
    }

    return results;
}

async function handleGetMapData() {
    const mapBox = document.getElementById('my-weather-map-result-simple');
    const btn = document.getElementById('my-btn-get-map-data-simple');
    if (!mapBox) return;

    if (isMapCollectionInProgress) return;
    isMapCollectionInProgress = true;

    let originalValue = null;
    try {
        originalValue = getActiveMapTemperatureKind();
        mapBox.innerText = 'Collecting maximum temperature...';
        await selectMapTemperatureOption('maximum');
        const maximumData = await collectMapStationData(mapBox);

        mapBox.innerText = 'Collecting minimum temperature...';
        await selectMapTemperatureOption('minimum');
        const minimumData = await collectMapStationData(mapBox);

        // Restore the user's selection when finished.
        await selectMapTemperatureOption(originalValue);

        const minByName = new Map(minimumData.map(st => [normalizeStationName(st.name), st.value]));
        const data = maximumData.map(st => ({
            ...st,
            min: minByName.get(normalizeStationName(st.name)) ?? '',
            max: st.value
        }));
        data.forEach(st => getStationHourlyState(st.name));

        if (!data || data.length === 0) {
            mapBox.innerText = 'No stations found on the map.';
            return;
        }

        cachedMapStationData = data;
        displayMapStationData(mapBox, data, false);

        // Flash button green
        if (btn) {
            const origBg = btn.style.backgroundColor || '';
            const origText = btn.innerText;
            btn.style.backgroundColor = '#2e7d32';
            btn.innerText = `Done! ✓ (${data.length} stations)`;
            setTimeout(() => {
                btn.style.backgroundColor = origBg;
                btn.innerText = origText;
            }, 1500);
        }
    } catch (e) {
        if (originalValue !== null) await selectMapTemperatureOption(originalValue).catch(() => {});
        mapBox.innerText = `Error: ${e.message}`;
    } finally {
        isMapCollectionInProgress = false;
    }
}

function normalizeStationName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function getSystemMinMaxValidity(recordsMap, now = new Date()) {
    const hasRecordAtLatestHour = hour => {
        const latest = new Date(now);
        latest.setHours(hour, 0, 0, 0);
        if (latest > now) latest.setDate(latest.getDate() - 1);
        return recordsMap.has(formatMMDDHH(latest));
    };
    return {
        minValid: hasRecordAtLatestHour(8),
        maxValid: hasRecordAtLatestHour(20)
    };
}

function getTemperatureTabLabel(kind) {
    if (kind === 'maximum') return 'Хамгийн их температур';
    if (kind === 'minimum') return 'Хамгийн бага температур';
    return 'Температур';
}

function findMapTemperatureTab(kind) {
    const wanted = getTemperatureTabLabel(kind);
    const candidates = Array.from(document.querySelectorAll('button,[role="button"],label,div,span'))
        .filter(el => {
            const rect = el.getBoundingClientRect();
            const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
            return rect.width > 0 && rect.height > 0 && text === wanted;
        });
    return candidates.sort((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height) - (b.getBoundingClientRect().width * b.getBoundingClientRect().height))[0] || null;
}

function getActiveMapTemperatureKind() {
    for (const kind of ['current', 'maximum', 'minimum']) {
        const tab = findMapTemperatureTab(kind);
        if (!tab) continue;
        const activeNode = tab.closest('[aria-pressed="true"], [aria-selected="true"], .active, .selected, .checked, .ant-radio-button-wrapper-checked, .is-active');
        if (activeNode) return kind;
    }
    // The page defaults to the current-temperature tab when no selected state is exposed.
    return 'current';
}

async function selectMapTemperatureOption(kind) {
    const tab = findMapTemperatureTab(kind);
    if (!tab) throw new Error(`Could not find the map tab "${getTemperatureTabLabel(kind)}".`);
    tab.click();
    await wait(1500);
}

function displayMapStationData(box, data, isCached) {
    box.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'map-result-heading-simple';
    heading.textContent = `Map Stations: ${data.length}${isCached ? ' (cached)' : ''}`;
    box.appendChild(heading);

    for (const st of data) {
        const row = document.createElement('div');
        row.className = 'map-result-row-simple';

        const mainRow = document.createElement('div');
        mainRow.className = 'map-station-main-row-simple';
        const name = document.createElement('span');
        name.className = 'map-result-values-simple';
        name.textContent = st.name;
        mainRow.appendChild(name);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.textContent = 'copy';
        copyBtn.title = 'Copy min and max';
        copyBtn.addEventListener('click', async event => {
            event.stopPropagation();
            if (st.min === '' || st.max === '') {
                if (isMapCollectionInProgress) return;
                isMapCollectionInProgress = true;
                copyBtn.disabled = true;
                const originalValue = getActiveMapTemperatureKind();
                copyBtn.textContent = '…';
                try {
                    st.max = await collectOneStationTemperature(st, 'maximum');
                    st.min = await collectOneStationTemperature(st, 'minimum');
                    if (originalValue !== getActiveMapTemperatureKind()) {
                        await selectMapTemperatureOption(originalValue);
                    }
                    updateMapStationRow(row, st);
                } catch (e) {
                    if (originalValue !== getActiveMapTemperatureKind()) {
                        await selectMapTemperatureOption(originalValue).catch(() => {});
                    }
                    copyBtn.title = `Could not retrieve min/max: ${e.message}`;
                    return;
                } finally {
                    isMapCollectionInProgress = false;
                    copyBtn.disabled = false;
                    copyBtn.textContent = 'copy';
                }
            }
            try { await copyTextSilently(`${st.min}\t${st.max}`); flashMapActionButton(copyBtn, 'copied'); }
            catch (e) { copyBtn.title = `Copy failed: ${e.message}`; }
        });
        mainRow.appendChild(copyBtn);

        const avgBtn = document.createElement('button');
        avgBtn.type = 'button';
        avgBtn.textContent = 'avg';
        avgBtn.title = 'Open this station chart and calculate its average';
        avgBtn.addEventListener('click', async event => {
            event.stopPropagation();
            if (isSweepingInProgress) return;
            const paths = getMapStationPaths();
            const path = paths.find(candidate => st.markerPathD && candidate.getAttribute('d') === st.markerPathD)
                || paths.find(candidate => candidate.getAttribute('aria-describedby') === st.tooltipId);
            if (!path) { avgBtn.title = 'Station marker is no longer available; load map data again.'; return; }
            avgBtn.disabled = true;
            avgBtn.textContent = '…';
            try {
                clickMapStationPath(path);
                await wait(1800);
                await handleGetDailyAverage(undefined, st.name);
                const stationState = getStationHourlyState(st.name);
                const targetDate = resolveTargetDateForRecords(stationState?.parsedEntries || []);
                const hourlyExtremes = getHourlyExtremesForTargetDate(stationState?.parsedEntries, targetDate);
                st.hourlyMin = hourlyExtremes?.min ?? '';
                st.hourlyMax = hourlyExtremes?.max ?? '';
                updateMapStationRow(row, st);
                const validity = getSystemMinMaxValidity(stationState?.hourlyRecords || new Map());
                validityMarks.replaceChildren();
                if (validity.minValid) validityMarks.appendChild(createValidityBadge('min✓'));
                if (validity.maxValid) validityMarks.appendChild(createValidityBadge('max✓'));
            } finally {
                avgBtn.disabled = false;
                avgBtn.textContent = 'avg';
            }
        });
        mainRow.appendChild(avgBtn);

        const validityMarks = document.createElement('span');
        validityMarks.className = 'map-validity-marks-simple';
        mainRow.appendChild(validityMarks);
        row.appendChild(mainRow);

        const detailsRow = document.createElement('div');
        detailsRow.className = 'map-station-details-simple';
        const hourlyValues = document.createElement('span');
        hourlyValues.className = 'map-station-hourly-values-simple';
        hourlyValues.textContent = `Hourly: ${st.hourlyMin === '' || st.hourlyMin == null ? '—' : st.hourlyMin} / ${st.hourlyMax === '' || st.hourlyMax == null ? '—' : st.hourlyMax}`;
        detailsRow.appendChild(hourlyValues);
        const systemValues = document.createElement('span');
        systemValues.className = 'map-station-system-values-simple';
        systemValues.textContent = `System: ${st.min || '—'} / ${st.max || '—'}`;
        detailsRow.appendChild(systemValues);
        row.appendChild(detailsRow);
        box.appendChild(row);
    }
}

async function collectOneStationTemperature(station, kind) {
    await selectMapTemperatureOption(kind);
    const paths = getMapStationPaths();
    const path = paths.find(candidate => station.markerPathD && candidate.getAttribute('d') === station.markerPathD)
        || paths.find(candidate => candidate.getAttribute('aria-describedby') === station.tooltipId);
    if (!path) throw new Error(`Could not find ${station.name} on the ${kind} map layer.`);
    const tooltipId = path.getAttribute('aria-describedby');
    const tooltip = tooltipId ? document.getElementById(tooltipId) : null;
    if (!tooltip) throw new Error(`Temperature value for ${station.name} is unavailable.`);
    return tooltip.textContent.trim();
}

function updateMapStationRow(row, station) {
    const systemValues = row.querySelector('.map-station-system-values-simple');
    if (systemValues) systemValues.textContent = `System: ${station.min || '—'} / ${station.max || '—'}`;
    const hourlyValues = row.querySelector('.map-station-hourly-values-simple');
    if (hourlyValues) hourlyValues.textContent = `Hourly: ${station.hourlyMin === '' || station.hourlyMin == null ? '—' : station.hourlyMin} / ${station.hourlyMax === '' || station.hourlyMax == null ? '—' : station.hourlyMax}`;
}

function createValidityBadge(label) {
    const badge = document.createElement('span');
    badge.className = 'map-validity-simple';
    badge.textContent = label;
    badge.title = label.startsWith('min')
        ? 'A temperature record exists at the latest 08:00.'
        : 'A temperature record exists at the latest 20:00.';
    return badge;
}

function flashMapActionButton(button, label) {
    const old = button.textContent;
    button.textContent = label;
    button.disabled = true;
    setTimeout(() => { button.textContent = old; button.disabled = false; }, 900);
}

function getMapStationPaths() {
    const svg = document.querySelector('.leaflet-container svg.leaflet-zoom-animated');
    return svg ? Array.from(svg.querySelectorAll('path.leaflet-interactive[aria-describedby^="leaflet-tooltip-"]')) : [];
}

function clickMapStationPath(path) {
    const rect = path.getBoundingClientRect();
    const evtOpts = { bubbles: true, cancelable: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, view: window };
    path.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
    path.dispatchEvent(new MouseEvent('mousedown', evtOpts));
    path.dispatchEvent(new PointerEvent('pointerup', evtOpts));
    path.dispatchEvent(new MouseEvent('mouseup', evtOpts));
    path.dispatchEvent(new MouseEvent('click', evtOpts));
}
