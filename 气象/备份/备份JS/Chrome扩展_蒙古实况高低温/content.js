// Global variable to store the accumulated result
let fullResultText = '';
let fullAvgMap = new Map();
let forcedLatestMonthDay = '';

// Wait 1 second after load to inject the panel
setTimeout(() => {
    initExtension();
}, 1000);

function initExtension() {
    const panel = document.createElement('div');
    panel.id = 'my-weather-extension-panel';
    
    const title = document.createElement('span');
    title.className = 'panel-title';
    title.innerText = 'Weather Data Tools';
    panel.appendChild(title);

    const forcedDateRow = document.createElement('div');
    forcedDateRow.className = 'forced-date-row';
    const forcedDateInput = document.createElement('input');
    forcedDateInput.id = 'my-weather-forced-latest-date';
    forcedDateInput.type = 'text';
    forcedDateInput.maxLength = 5;
    forcedDateInput.placeholder = 'Force latest displayed date (mm-dd)';
    forcedDateInput.value = getTodayMonthDayDash();
    forcedLatestMonthDay = forcedDateInput.value;
    forcedDateInput.addEventListener('input', () => {
        forcedLatestMonthDay = (forcedDateInput.value || '').trim();
    });
    forcedDateRow.appendChild(forcedDateInput);
    panel.appendChild(forcedDateRow);

    // --- TOP ROW (Existing 5 Buttons) ---
    const layoutTop = document.createElement('div');
    layoutTop.className = 'control-layout';

    const leftControls = document.createElement('div');
    leftControls.className = 'controls-left';
    const rightControls = document.createElement('div');
    rightControls.className = 'controls-right';

    createButton(leftControls, '1. Open Menu', 'btn-setup', handleOpenDropdown);
    createButton(leftControls, '2. Sel 100', 'btn-setup', handleSelect100);
    createButton(leftControls, '4. Prev Pg', 'btn-nav', handlePrevPage);
    createButton(leftControls, '3. Next Pg', 'btn-nav', handleNextPage);
    createButton(rightControls, 'Get Min/Max', 'btn-run', handleRunScript);

    layoutTop.appendChild(leftControls);
    layoutTop.appendChild(rightControls);
    panel.appendChild(layoutTop);

    // --- BOTTOM ROW (New 2 Buttons) ---
    const layoutBottom = document.createElement('div');
    layoutBottom.className = 'control-layout-bottom';

    createButton(layoutBottom, 'Get All Min/Max', 'btn-auto', handleAutoRun);
    createButton(layoutBottom, 'Get Avg', 'btn-daily', handleGetDailyAverage);
    createButton(layoutBottom, 'Get All Avg', 'btn-test', handleTestSelectStation);

    panel.appendChild(layoutBottom);

    const layoutCorrected = document.createElement('div');
    layoutCorrected.className = 'control-layout-single';
    createButton(layoutCorrected, 'Get Corrected Min/Max/Avg', 'btn-corrected', handleGetCorrectedMinMaxAvg);
    panel.appendChild(layoutCorrected);

    // --- RESULT BOX ---
    const resultBox = document.createElement('div');
    resultBox.id = 'my-weather-result';
    resultBox.innerText = 'Ready...';
    resultBox.title = 'Click to copy raw content';
    
    // Simple click copy for the box (Requirement 2)
    resultBox.addEventListener('click', () => {
        copyToClipboard(resultBox.innerText, resultBox);
    });

    panel.appendChild(resultBox);
    document.body.appendChild(panel);
}

function createButton(parent, text, className, clickHandler) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.className = className;
    btn.addEventListener('click', clickHandler);
    parent.appendChild(btn);
}

function updateStatus(msg) {
    const box = document.getElementById('my-weather-result');
    if (box) box.innerText = msg + '\n\n' + box.innerText;
}

// Utility: Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Copy helper
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
    return navigator.clipboard.writeText(text ?? '');
}

// --- Button Functions ---

function handleOpenDropdown() {
    const items = document.querySelectorAll('.ant-select-selection-item');
    let found = false;
    items.forEach(item => {
        if (item.innerText.trim() === '10 / page') {
            item.click(); 
            item.closest('.ant-select-selector')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            found = true;
        }
    });
    return found;
}

function handleSelect100() {
    const options = document.querySelectorAll('.ant-select-item-option-content');
    let found = false;
    options.forEach(opt => {
        if (opt.innerText.trim() === '100 / page') {
            opt.click();
            found = true;
        }
    });
    return found;
}

function getCurrentPageNumber() {
    const activeItem = document.querySelector('.ant-pagination-item-active');
    return activeItem ? parseInt(activeItem.title || activeItem.innerText) : 1;
}

function handleNextPage() {
    const current = getCurrentPageNumber();
    const nextItem = document.querySelector(`.ant-pagination-item-${current + 1}`);
    if (nextItem) {
        nextItem.click();
        return true;
    }
    return false;
}

function handlePrevPage() {
    const current = getCurrentPageNumber();
    if (current <= 1) return;
    const prevItem = document.querySelector(`.ant-pagination-item-${current - 1}`);
    if (prevItem) prevItem.click();
}

// Helper to capture console.log output from your custom script without printing to UI immediately
function captureScriptOutput() {
    let logs = [];
    const originalLog = console.log;
    console.log = function(...args) {
        logs.push(args.join('\t')); // Use Tab to ensure TSV compatibility if user sends multiple args
    };

    try {
        yourCustomExtractionLogic();
    } catch (e) {
        logs.push("Error: " + e.message);
    } finally {
        console.log = originalLog;
    }
    return logs.join('\n');
}

// Button 5: Manual Run
function handleRunScript() {
    const output = captureScriptOutput();
    const box = document.getElementById('my-weather-result');
    box.innerText = output;
}

// --- STEP 2: AUTO BUTTON LOGIC ---
async function handleAutoRun() {
    const box = document.getElementById('my-weather-result');
    box.innerText = "Starting Get All Min/Max...";
    await collectAllMinMaxPages(box);

    try {
        const arrOfObj = parseCollectedResultToObjects(fullResultText);
        const tsvWithAvg = getFinalResult(arrOfObj, new Map());
        const minMaxOnly = tsvWithAvg
            .split('\n')
            .map(line => {
                const idx = line.lastIndexOf('\t');
                return idx >= 0 ? line.slice(0, idx) : line;
            })
            .join('\n');
        await copyTextSilently(minMaxOnly);
        box.innerText = "Get All Min/Max finished!\nMin/Max TSV auto-copied.";
    } catch (e) {
        box.innerText = `Get All Min/Max finished, but auto-copy failed: ${e.message}`;
    }
    console.log("Auto: Finished");
}

async function collectAllMinMaxPages(statusBox) {
    await wait(1000);
    fullResultText = '';
    fullAvgMap = new Map();
    console.log("Auto: Started");

    handleOpenDropdown();
    await wait(1000);
    handleSelect100();
    await wait(1000);

    let firstPageResult = captureScriptOutput();
    fullResultText = firstPageResult;
    if (statusBox) statusBox.innerText = `Page 1 Captured. Lines: ${firstPageResult.split('\n').length}`;
    await wait(1000);

    let keepGoing = true;
    let pageCount = 1;
    while (keepGoing) {
        let currentPage = getCurrentPageNumber();
        let clickedNext = handleNextPage();
        await wait(1000);
        let newPage = getCurrentPageNumber();

        if (!clickedNext || newPage === currentPage) {
            keepGoing = false;
            if (statusBox) statusBox.innerText += `\nReached End at Page ${pageCount}.`;
        } else {
            pageCount++;
            let pageResult = captureScriptOutput();
            fullResultText += '\n';
            let lines = pageResult.split('\n');
            if (lines.length > 1) {
                lines.shift();
                fullResultText += lines.join('\n');
            }
            if (statusBox) statusBox.innerText = `Processing Page ${pageCount}...\nTotal Text Length: ${fullResultText.length}`;
        }
    }
}

// --- STEP 3: COPY RESULT BUTTON LOGIC ---
async function handleCopyFinal() {
    if (!fullResultText) {
        alert("No data collected yet. Please run 'Get All Min/Max' first.");
        return;
    }

    try {
        // Step 3-a: Convert collected TSV to Array of Objects
        const arrOfObj = parseCollectedResultToObjects(fullResultText);

        console.log(`Parsed ${arrOfObj.length} rows of data.`);

        // Step 3-b: Use already prepared avg map (from Get All Daily Avg). If empty, keep avg column empty.
        const avgMap = fullAvgMap;

        // Step 3-c: Build final TSV
        const finalString = getFinalResult(arrOfObj, avgMap);

        // Copy to clipboard
        copyToClipboard(finalString, document.getElementById('my-weather-result'));

    } catch (e) {
        console.error(e);
        alert("Error processing data: " + e.message);
    }
}

function parseCollectedResultToObjects(collectedText) {
    const rows = (collectedText || '').trim().split('\n');
    if (rows.length < 2) {
        throw new Error("Not enough data to process.");
    }
    const headers = rows[0].split('\t').map(h => h.trim());
    const arrOfObj = [];
    for (let i = 1; i < rows.length; i++) {
        const currentLine = rows[i].split('\t');
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = (currentLine[index] || '').trim();
        });
        arrOfObj.push(obj);
    }
    return arrOfObj;
}

async function getCurrentStationLatestAvgContext() {
    try {
        const selectedText = getCurrentSelectedStationText();
        const parsedStation = parseSelectedStationText(selectedText);
        if (!parsedStation) {
            return { selectedAimag: '', selectedCym: '', avgValue: '' };
        }

        await zoomOutHourlyChartFully();
        const recordsMap = await collectTemperatureAcrossPannedViews(null);
        const summary = getThreeDayAverages(recordsMap);
        const latestAvg = summary.dayResults && summary.dayResults.length > 0 && summary.dayResults[0].hasAll
            ? summary.dayResults[0].averageStr
            : '';

        return {
            selectedAimag: parsedStation.aimag,
            selectedCym: parsedStation.cym,
            avgValue: latestAvg
        };
    } catch (e) {
        console.error('Avg context failed:', e);
        return { selectedAimag: '', selectedCym: '', avgValue: '' };
    }
}

function stationKey(aimag, cym) {
    return `${(aimag || '').trim()}||${(cym || '').trim()}`;
}

function normalizeText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
}

function getTargetStationsFromGetFinalResult() {
    const fnStr = getFinalResult.toString();
    const m = fnStr.match(/let\s+arrOfStations\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) return [];
    try {
        // Parse literal array from function source without eval/new Function.
        const arr = JSON.parse(m[1]);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

async function getLatestAvgMapForAllTargetStations(stations, statusBox) {
    const avgMap = new Map();
    if (!Array.isArray(stations) || !stations.length) return avgMap;

    for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        const aimag = (station?.aimag || '').trim();
        const cym = (station?.cym || '').trim();
        const keyword = `${aimag}, ${cym}`;
        const key = stationKey(aimag, cym);

        if (statusBox) statusBox.innerText = `Calculating avg ${i + 1}/${stations.length}: ${keyword}`;

        try {
            const selected = await selectStationByKeyword(keyword);
            if (!selected) {
                avgMap.set(key, '');
                continue;
            }
            await wait(2000); // wait chart refresh after station switch
            await zoomOutHourlyChartFully();
            const recordsMap = await collectTemperatureAcrossPannedViews(statusBox);
            const latest = getLatestDayAverageOnly(recordsMap);
            const avg = latest.hasAll ? latest.averageStr : '';
            avgMap.set(key, avg);
        } catch (e) {
            console.error(`Avg station failed: ${keyword}`, e);
            avgMap.set(key, '');
        }
    }

    return avgMap;
}

async function getAvgAndCorrectionMapForAllStations(stations, baseMinMaxMap, statusBox) {
    const avgMap = new Map();
    const correctedMinMap = new Map();
    const correctedMaxMap = new Map();
    if (!Array.isArray(stations) || !stations.length) {
        return { avgMap, correctedMinMap, correctedMaxMap };
    }

    for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        const aimag = (station?.aimag || '').trim();
        const cym = (station?.cym || '').trim();
        const keyword = `${aimag}, ${cym}`;
        const key = stationKey(aimag, cym);
        if (statusBox) statusBox.innerText = `Correcting ${i + 1}/${stations.length}: ${keyword}`;

        try {
            const selected = await selectStationByKeyword(keyword);
            if (!selected) {
                avgMap.set(key, '');
                correctedMinMap.set(key, baseMinMaxMap.get(key)?.min ?? '无');
                correctedMaxMap.set(key, baseMinMaxMap.get(key)?.max ?? '无');
                continue;
            }
            await wait(2000);
            await zoomOutHourlyChartFully();
            const recordsMap = await collectTemperatureAcrossPannedViews(statusBox);
            const latest = getLatestDayAverageOnly(recordsMap);
            avgMap.set(key, latest.hasAll ? latest.averageStr : '');

            const periodValues = getLatestStatisticPeriodValues(recordsMap);
            const base = baseMinMaxMap.get(key) || {};
            const corrected = getCorrectedMinMax(base.min, base.max, periodValues);
            correctedMinMap.set(key, corrected.min);
            correctedMaxMap.set(key, corrected.max);
        } catch (e) {
            console.error(`Correct station failed: ${keyword}`, e);
            avgMap.set(key, '');
            correctedMinMap.set(key, baseMinMaxMap.get(key)?.min ?? '无');
            correctedMaxMap.set(key, baseMinMaxMap.get(key)?.max ?? '无');
        }
    }

    return { avgMap, correctedMinMap, correctedMaxMap };
}

async function selectStationByKeyword(keyword) {
    const input = document.querySelector('input.ant-select-selection-search-input');
    if (!input) return false;

    input.focus();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(80);

    input.value = keyword;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(220);

    const options = Array.from(document.querySelectorAll('.ant-select-item-option-content'));
    const exact = options.find(opt => normalizeText(opt.textContent) === normalizeText(keyword));
    if (exact) {
        exact.click();
        return true;
    }

    if (options.length === 1) {
        options[0].click();
        return true;
    }

    // fallback: if already selected
    const selected = getCurrentSelectedStationText();
    return normalizeText(selected) === normalizeText(keyword);
}

function getCurrentSelectedStationText() {
    const selected = document.querySelector('.ant-select-selection-item[title]') ||
        document.querySelector('.ant-select-selection-item');
    if (!selected) return '';
    return (selected.getAttribute('title') || selected.textContent || '').trim();
}

function parseSelectedStationText(stationText) {
    if (!stationText) return null;
    const cleaned = stationText.replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    return { aimag: parts[0], cym: parts[1] };
}

// --- STEP 4: DAILY AVERAGE FROM HOURLY TEMPERATURE CHART ---
async function handleGetDailyAverage() {
    const box = document.getElementById('my-weather-result');
    try {
        box.innerText = 'Zooming chart / preparing pan...';
        await zoomOutHourlyChartFully();
        const recordsMap = await collectTemperatureAcrossPannedViews(box);
        const summary = getThreeDayAverages(recordsMap);

        if (!summary.dayResults.length) {
            box.innerText = 'No valid temperature records parsed from chart.\n\nAverage copied (latest day): ""';
            await copyTextSilently('');
            return;
        }

        const output = [];
        output.push(`Latest Date: ${summary.latestDateStr}`);
        output.push('');
        output.push('Daily 8-point averages:');
        summary.dayResults.forEach(r => output.push(`${r.dateStr}: ${r.averageStr}`));
        output.push('');
        output.push('Required hours detail:');
        summary.dayResults.forEach(r => {
            output.push(`-- ${r.dateStr} --`);
            output.push(...r.hoursSummary);
        });

        const latestCopy = summary.dayResults[0].hasAll ? summary.dayResults[0].averageStr : '';
        box.innerText = `${output.join('\n')}\n\nAverage copied (latest day): ${latestCopy || '""'}`;
        await copyTextSilently(latestCopy);
    } catch (e) {
        box.innerText = `Get Daily Avg failed: ${e.message}`;
    }
}

async function handleTestSelectStation() {
    const box = document.getElementById('my-weather-result');
    box.innerText = 'Get All Daily Avg: calculating avg for all targeted stations...';
    try {
        const targetStations = getTargetStationsFromGetFinalResult();
        if (!targetStations.length) {
            box.innerText = 'Test failed: target station list is empty (cannot start selection loop).';
            return;
        }
        const avgMap = await getLatestAvgMapForAllTargetStations(targetStations, box);
        fullAvgMap = avgMap;

        const lines = [];
        for (let i = 0; i < targetStations.length; i++) {
            const s = targetStations[i];
            const key = stationKey(s.aimag, s.cym);
            const avg = avgMap.get(key) || '';
            lines.push(avg);
        }

        const resultText = lines.join('\n');
        box.innerText = `${resultText}\n\nDone. Lines: ${lines.length}\nAuto-copied.`;
        await copyTextSilently(resultText);
    } catch (e) {
        box.innerText = `Test select error: ${e.message}`;
    }
}

async function handleGetCorrectedMinMaxAvg() {
    const box = document.getElementById('my-weather-result');
    box.innerText = 'Step 1/3: Get all min/max from pages...';
    try {
        await collectAllMinMaxPages(box);
        const arrOfObj = parseCollectedResultToObjects(fullResultText);
        const targetStations = getTargetStationsFromGetFinalResult();
        if (!targetStations.length) {
            box.innerText = 'Get Corrected Min/Max/Avg failed: target station list is empty.';
            return;
        }

        box.innerText = 'Step 2/3: Get all avg and corrected min/max...';
        const baseMinMaxMap = buildStationMinMaxMap(arrOfObj);
        const corrected = await getAvgAndCorrectionMapForAllStations(targetStations, baseMinMaxMap, box);
        fullAvgMap = corrected.avgMap;

        box.innerText = 'Step 3/3: Building corrected TSV and copying...';
        const tsv = buildCorrectedTsv(targetStations, corrected.correctedMinMap, corrected.correctedMaxMap, corrected.avgMap);
        await copyTextSilently(tsv);
        box.innerText = `Get Corrected Min/Max/Avg finished.\nLines: ${targetStations.length}\nAuto-copied.`;
    } catch (e) {
        box.innerText = `Get Corrected Min/Max/Avg failed: ${e.message}`;
    }
}

function getLatestDayAverageOnly(recordsMap) {
    const parsedEntries = [];
    for (const [key, temp] of recordsMap.entries()) {
        const dt = parseMMDDHH(key);
        if (!dt || typeof temp !== 'number' || Number.isNaN(temp)) continue;
        parsedEntries.push({ dt, temp });
    }
    if (!parsedEntries.length) {
        return { hasAll: false, averageStr: '', latestDateStr: '' };
    }
    const targetDate = resolveTargetDateForRecords(parsedEntries);
    const calc = getDayEightPointAverage(recordsMap, targetDate);
    return {
        hasAll: calc.hasAll,
        averageStr: calc.hasAll ? calc.averageStr : '',
        latestDateStr: `${pad2(targetDate.getMonth() + 1)}/${pad2(targetDate.getDate())}`
    };
}

function parseNumberMaybe(value) {
    if (typeof value === 'number') return Number.isNaN(value) ? null : value;
    const m = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
}

function formatNumberLikeOriginal(n) {
    if (typeof n !== 'number' || Number.isNaN(n)) return '';
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function buildStationMinMaxMap(arrOfObj) {
    const map = new Map();
    for (let i = 0; i < arrOfObj.length; i++) {
        const row = arrOfObj[i];
        const aimag = (row['Аймаг нэр'] || '').trim();
        const cym = (row['Сумын нэр'] || '').trim();
        if (!aimag || !cym) continue;
        map.set(stationKey(aimag, cym), {
            min: (row['Хамгийн бага температур'] || '').trim(),
            max: (row['Хамгийн их температур'] || '').trim()
        });
    }
    return map;
}

function getLatestStatisticPeriodValues(recordsMap) {
    const parsedEntries = [];
    for (const [key, temp] of recordsMap.entries()) {
        const dt = parseMMDDHH(key);
        if (!dt || typeof temp !== 'number' || Number.isNaN(temp)) continue;
        parsedEntries.push({ dt, temp });
    }
    if (!parsedEntries.length) return [];

    const latestDate = resolveTargetDateForRecords(parsedEntries);
    const prev = new Date(latestDate);
    prev.setDate(prev.getDate() - 1);
    const times = [
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 20, 0, 0, 0),
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 23, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 2, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 5, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 8, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 11, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 14, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 17, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 20, 0, 0, 0)
    ];

    const values = [];
    for (const dt of times) {
        const key = formatMMDDHH(dt);
        const v = recordsMap.get(key);
        if (typeof v === 'number' && !Number.isNaN(v)) values.push(v);
    }
    return values;
}

function getCorrectedMinMax(baseMinStr, baseMaxStr, periodValues) {
    const baseMin = parseNumberMaybe(baseMinStr);
    const baseMax = parseNumberMaybe(baseMaxStr);
    const allVals = [];
    if (baseMin !== null) allVals.push(baseMin);
    if (baseMax !== null) allVals.push(baseMax);
    if (Array.isArray(periodValues)) {
        for (const v of periodValues) {
            if (typeof v === 'number' && !Number.isNaN(v)) allVals.push(v);
        }
    }
    if (!allVals.length) {
        return {
            min: baseMinStr || '无',
            max: baseMaxStr || '无'
        };
    }
    return {
        min: formatNumberLikeOriginal(Math.min(...allVals)),
        max: formatNumberLikeOriginal(Math.max(...allVals))
    };
}

function buildCorrectedTsv(stations, correctedMinMap, correctedMaxMap, avgMap) {
    const lines = [];
    for (let i = 0; i < stations.length; i++) {
        const s = stations[i];
        const key = stationKey(s.aimag, s.cym);
        const min = correctedMinMap.get(key) ?? '无';
        const max = correctedMaxMap.get(key) ?? '无';
        const avg = avgMap.get(key) ?? '';
        lines.push(`${min}\t${max}\t${avg}`);
    }
    return lines.join('\n');
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function getTodayMonthDayDash() {
    const now = new Date();
    return `${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

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

    // Handle year boundary in winter months (display is MM/DD without year).
    if (month - (now.getMonth() + 1) > 6) {
        year -= 1;
    }

    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function parseTooltipText(tooltipText) {
    const lines = tooltipText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    const dateRegex = /^\d{2}\/\d{2}\s+\d{2}:\d{2}$/;
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes('Температур')) continue;

        let dateTime = null;
        for (let j = i; j >= 0; j--) {
            if (dateRegex.test(lines[j])) {
                dateTime = lines[j];
                break;
            }
        }
        if (!dateTime) continue;

        let tempValue = null;
        for (let k = i + 1; k <= i + 3 && k < lines.length; k++) {
            const numeric = lines[k].match(/-?\d+(?:\.\d+)?/);
            if (numeric) {
                tempValue = Number(numeric[0]);
                break;
            }
        }
        if (typeof tempValue === 'number' && !Number.isNaN(tempValue)) {
            output.push({ dateTime, temp: tempValue });
        }
    }

    return output;
}

async function collectTemperatureFromHourlyChart() {
    const chartCanvas = document.querySelector('.echarts-container canvas');
    if (!chartCanvas) {
        throw new Error('Hourly chart canvas not found.');
    }

    const rect = chartCanvas.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const hostContainer = chartCanvas.closest('.echarts-container') || document;
    const recordsMap = new Map();

    const sweepStep = Math.max(1, Math.floor(rect.width / 450)); // cap events for performance
    for (let x = 0; x <= Math.floor(rect.width); x += sweepStep) {
        const clientX = rect.left + x;
        chartCanvas.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY: centerY
        }));

        const tooltipNodes = hostContainer.querySelectorAll('div[style*="z-index: 9999999"]');
        tooltipNodes.forEach(node => {
            const style = window.getComputedStyle(node);
            if (style.visibility === 'hidden' || style.opacity === '0') return;
            const pairs = parseTooltipText(node.innerText || '');
            pairs.forEach(({ dateTime, temp }) => recordsMap.set(dateTime, temp));
        });

        if (x % 50 === 0) await wait(0);
    }

    chartCanvas.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return recordsMap;
}

async function collectTemperatureAcrossPannedViews(statusBox) {
    const host = getHourlyChartHost();
    if (!host) throw new Error('Hourly chart container not found.');
    const chartCanvas = host.querySelector('canvas') || document.querySelector('.echarts-container canvas');
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

function getHourlyChartHost() {
    const chartCanvas = document.querySelector('.echarts-container canvas');
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

async function zoomOutHourlyChartFully() {
    const host = getHourlyChartHost();
    if (!host) {
        throw new Error('Hourly chart container not found.');
    }

    const chartCanvas = host.querySelector('canvas') || document.querySelector('.echarts-container canvas');
    if (!chartCanvas) {
        throw new Error('Hourly chart canvas not found for zoom drag.');
    }

    // First try API-level zoom reset.
    const chart = getEchartsInstanceFromHost(host);
    if (chart) {
        for (let i = 0; i < 3; i++) {
            forceDataZoomFullRange(chart);
            await wait(100);
            const coverage = getDataZoomCoveragePercent(chart);
            if (coverage >= 99.5) break;
        }
    }

    // Then enforce your manual method by dragging the right edge to max.
    // We try several Y coordinates near chart bottom to hit the slider handle reliably.
    const bottomOffsets = [12, 16, 20, 24, 28, 32, 36];
    for (const offset of bottomOffsets) {
        await dragZoomRightEdgeToMax(chartCanvas, offset);
        await wait(90);
    }

    // Final API nudge in case the page synchronizes zoom state after drag.
    if (chart) {
        forceDataZoomFullRange(chart);
        await wait(120);
    }
}

async function dragZoomRightEdgeToMax(chartCanvas, bottomOffsetPx) {
    const rect = chartCanvas.getBoundingClientRect();
    const y = Math.max(rect.top + 1, rect.bottom - bottomOffsetPx);

    // User-described default: right edge starts around 50% width.
    const startX = rect.left + rect.width * 0.5;
    const endX = rect.left + rect.width - 2;

    dispatchPointerLikeMouseEvent(chartCanvas, 'mousemove', startX, y, 0);
    await wait(10);
    dispatchPointerLikeMouseEvent(chartCanvas, 'mousedown', startX, y, 1);
    await wait(20);

    // Drag in small steps so chart can track the handle movement.
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

async function panZoomBar(chartCanvas, direction) {
    const rect = chartCanvas.getBoundingClientRect();
    const y = rect.bottom - 22;
    const startX = rect.left + rect.width * 0.35;
    const distance = rect.width * 0.38;
    const endX = direction === 'right'
        ? Math.min(rect.right - 3, startX + distance)
        : Math.max(rect.left + 3, startX - distance);

    dispatchPointerLikeMouseEvent(chartCanvas, 'mousemove', startX, y, 0);
    await wait(10);
    dispatchPointerLikeMouseEvent(chartCanvas, 'mousedown', startX, y, 1);
    await wait(10);

    const steps = 12;
    for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        dispatchPointerLikeMouseEvent(window, 'mousemove', x, y, 1);
        dispatchPointerLikeMouseEvent(document, 'mousemove', x, y, 1);
        dispatchPointerLikeMouseEvent(chartCanvas, 'mousemove', x, y, 1);
        await wait(7);
    }

    dispatchPointerLikeMouseEvent(window, 'mouseup', endX, y, 0);
    dispatchPointerLikeMouseEvent(document, 'mouseup', endX, y, 0);
    dispatchPointerLikeMouseEvent(chartCanvas, 'mouseup', endX, y, 0);
}

function dispatchPointerLikeMouseEvent(target, type, clientX, clientY, buttons) {
    target.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        button: type === 'mousedown' ? 0 : 0,
        buttons
    }));
}

function getLatestDayEightPointAverage(recordsMap) {
    if (!recordsMap || recordsMap.size === 0) {
        return { ok: false, message: 'No temperature records found from chart.' };
    }

    const parsedEntries = [];
    for (const [key, temp] of recordsMap.entries()) {
        const dt = parseMMDDHH(key);
        if (!dt || typeof temp !== 'number' || Number.isNaN(temp)) continue;
        parsedEntries.push({ key, dt, temp });
    }
    if (parsedEntries.length === 0) {
        return { ok: false, message: 'No valid temperature records parsed from chart.' };
    }

    const latestDate = resolveTargetDateForRecords(parsedEntries);
    const formerDate = new Date(latestDate);
    formerDate.setDate(formerDate.getDate() - 1);

    const requiredTimes = [
        new Date(formerDate.getFullYear(), formerDate.getMonth(), formerDate.getDate(), 23, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 2, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 5, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 8, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 11, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 14, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 17, 0, 0, 0),
        new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 20, 0, 0, 0)
    ];

    const hoursSummary = [];
    const values = [];
    for (const dt of requiredTimes) {
        const key = formatMMDDHH(dt);
        const v = recordsMap.get(key);
        const valid = typeof v === 'number' && !Number.isNaN(v);
        hoursSummary.push(`${key} = ${valid ? v : 'EMPTY'}`);
        if (!valid) {
            return {
                ok: false,
                message: `Latest Date: ${pad2(latestDate.getMonth() + 1)}/${pad2(latestDate.getDate())}\n8-point Avg: EMPTY (missing hour value)\n\n${hoursSummary.join('\n')}`
            };
        }
        values.push(v);
    }

    const average = (values.reduce((s, n) => s + n, 0) / values.length).toFixed(2);
    return {
        ok: true,
        latestDateStr: `${pad2(latestDate.getMonth() + 1)}/${pad2(latestDate.getDate())}`,
        average,
        hoursSummary
    };
}

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

// ---------------------------------------------------------
// YOUR PROVIDED PROCESSING FUNCTION (Step 3-c)
// ---------------------------------------------------------
function getFinalResult(arrOfObj, avgMap){
    let arrOfStations = [{"站点":"乌布苏省 特斯","aimag":"Увс","cym":"Тэс"},{"站点":"乌布苏省 东戈壁","aimag":"Увс","cym":"Зүүнговь"},{"站点":"扎布汗省 特斯","aimag":"Завхан","cym":"Тэс"},{"站点":"扎布汗省 台勒门","aimag":"Завхан","cym":"Тэлмэн"},{"站点":"扎布汗省 鄂特冈","aimag":"Завхан","cym":"Отгон"},{"站点":"库苏古尔省 查干诺尔","aimag":"Хөвсгөл","cym":"Цагааннуур"},{"站点":"色楞格省 尧勒","aimag":"Сэлэнгэ","cym":"Ерөө"},{"站点":"乌布苏省 乌兰固木","aimag":"Увс","cym":"Улаангом"},{"站点":"扎布汗省 巴彦特斯","aimag":"Завхан","cym":"Баянтэс"},{"站点":"扎布汗省 车臣乌拉","aimag":"Завхан","cym":"Цэцэн-Уул"},{"站点":"扎布汗省 陶松臣格勒","aimag":"Завхан","cym":"Тосонцэнгэл"},{"站点":"库苏古尔省 仁钦隆勃","aimag":"Хөвсгөл","cym":"Ренчинлхүмбэ"},{"站点":"乌兰巴托市 乌兰巴托","aimag":"Нийслэл","cym":"Улаанбаатар"},{"站点":"乌兰巴托市 Налайх","aimag":"Нийслэл","cym":"Налайх"},{"站点":"乌兰巴托市 Буянт-Ухаа","aimag":"Нийслэл","cym":"Хан-Уул (Буянт-Ухаа)"},{"站点":"巴彦洪戈尔省 古尔班布拉格","aimag":"Баянхонгор","cym":"Гурванбулаг"},{"站点":"巴彦洪戈尔省 扎尔嘎朗特","aimag":"Баянхонгор","cym":"Жаргалант"},{"站点":"巴彦洪戈尔省 巴彦布拉格","aimag":"Баянхонгор","cym":"Баянбулаг"},{"站点":"巴彦洪戈尔省 嘎鲁特","aimag":"Баянхонгор","cym":"Галуут"},{"站点":"科布多省 德尔根","aimag":"Ховд","cym":"Дөргөн"},{"站点":"科布多省 额尔德尼布伦","aimag":"Ховд","cym":"Эрдэнэбүрэн"},{"站点":"科布多省 其其格","aimag":"Ховд","cym":"Цэцэг"},{"站点":"科布多省 布尔干","aimag":"Ховд","cym":"Булган"},{"站点":"科布多省 Мөст","aimag":"Ховд","cym":"Мөст"},{"站点":"戈壁阿尔泰省 额尔德尼","aimag":"Говь-Алтай","cym":"Эрдэнэ"},{"站点":"戈壁阿尔泰省 阿尔泰","aimag":"Говь-Алтай","cym":"Есөн булаг"},{"站点":"库苏古尔省 查干乌拉","aimag":"Хөвсгөл","cym":"Цагаан-Уул"},{"站点":"库苏古尔省 乌兰乌拉","aimag":"Хөвсгөл","cym":"Улаан-Уул"},{"站点":"库苏古尔省 查干乌尔","aimag":"Хөвсгөл","cym":"Цагаан-Үүр"},{"站点":"库苏古尔省 阿拉格额尔德尼","aimag":"Хөвсгөл","cym":"Алаг-Эрдэнэ"},{"站点":"库苏古尔省 哈特嘎勒","aimag":"Хөвсгөл","cym":"Хатгал тосгон"},{"站点":"库苏古尔省 木伦","aimag":"Хөвсгөл","cym":"Мөрөн"},{"站点":"库苏古尔省 阿尔布拉格","aimag":"Хөвсгөл","cym":"Арбулаг"},{"站点":"库苏古尔省 车车尔勒格","aimag":"Хөвсгөл","cym":"Цэцэрлэг"},{"站点":"库苏古尔省 巴彦珠尔赫","aimag":"Хөвсгөл","cym":"Баянзүрх"},{"站点":"库苏古尔省 汗赫","aimag":"Хөвсгөл","cym":"Ханх"},{"站点":"库苏古尔省 额尔德尼布尔干","aimag":"Хөвсгөл","cym":"Эрдэнэбулган"},{"站点":"库苏古尔省 拉善特","aimag":"Хөвсгөл","cym":"Рашаант"},{"站点":"色楞格省 宗布伦","aimag":"Сэлэнгэ","cym":"Зүүнбүрэн"},{"站点":"色楞格省 Зэлтэр","aimag":"Сэлэнгэ","cym":"Зэлтэр"},{"站点":"色楞格省 鄂尔浑图勒","aimag":"Сэлэнгэ","cym":"Орхонтуул"},{"站点":"乌布苏省 达布斯特","aimag":"Увс","cym":"Давст"},{"站点":"乌布苏省 马勒钦","aimag":"Увс","cym":"Малчин"},{"站点":"乌布苏省 南戈壁","aimag":"Увс","cym":"Өмнөговь"},{"站点":"乌布苏省 萨吉勒","aimag":"Увс","cym":"Сагил"},{"站点":"乌布苏省 图尔根","aimag":"Увс","cym":"Түргэн"},{"站点":"乌布苏省 西图伦","aimag":"Увс","cym":"Баруунтуруун"},{"站点":"乌布苏省 扎布汗","aimag":"Увс","cym":"Завхан"},{"站点":"乌布苏省 东杭爱","aimag":"Увс","cym":"Зүүнхангай"},{"站点":"乌布苏省 温都尔杭爱","aimag":"Увс","cym":"Өндөрхангай"},{"站点":"扎布汗省 巴彦海尔汗","aimag":"Завхан","cym":"Баянхайрхан"},{"站点":"扎布汗省 大乌拉","aimag":"Завхан","cym":"Их-Уул"},{"站点":"扎布汗省 讷木勒格","aimag":"Завхан","cym":"Нөмрөг"},{"站点":"扎布汗省 桑特马尔噶茨","aimag":"Завхан","cym":"Сантмаргац"},{"站点":"扎布汗省 图德夫泰","aimag":"Завхан","cym":"Түдэвтэй"},{"站点":"扎布汗省 乌尔嘎马勒","aimag":"Завхан","cym":"Ургамал"},{"站点":"扎布汗省 亚鲁","aimag":"Завхан","cym":"Яруу"},{"站点":"扎布汗省 伊德尔","aimag":"Завхан","cym":"Идэр"},{"站点":"扎布汗省 扎布汗曼达勒","aimag":"Завхан","cym":"Завханмандал"},{"站点":"巴彦乌列盖省 Сагсай","aimag":"Баян-Өлгий","cym":"Сагсай"},{"站点":"巴彦乌列盖省 阿尔泰","aimag":"Баян-Өлгий","cym":"Алтай"},{"站点":"巴彦乌列盖省 布尔干","aimag":"Баян-Өлгий","cym":"Булган"},{"站点":"后杭爱省 温都尔乌兰","aimag":"Архангай","cym":"Өндөр-Улаан"},{"站点":"后杭爱省 杭爱","aimag":"Архангай","cym":"Хангай"},{"站点":"后杭爱省 额勒济特","aimag":"Архангай","cym":"Өлзийт"},{"站点":"后杭爱省 楚鲁特","aimag":"Архангай","cym":"Чулуут"},{"站点":"后杭爱省 塔里亚特","aimag":"Архангай","cym":"Тариат"},{"站点":"后杭爱省 Цахир","aimag":"Архангай","cym":"Цахир"},{"站点":"前杭爱省 巴彦温都尔","aimag":"Өвөрхангай","cym":"Баян-Өндөр"},{"站点":"前杭爱省 Уянга","aimag":"Өвөрхангай","cym":"Уянга"},{"站点":"中央省 蒙根莫里特","aimag":"Төв","cym":"Мөнгөнморьт"},{"站点":"肯特省 巴特希雷特","aimag":"Хэнтий","cym":"Батширээт"},{"站点":"肯特省 臣赫尔曼达勒","aimag":"Хэнтий","cym":"Цэнхэрмандал"}];

    let resultArr=[];
    for(let i=0;i<arrOfStations.length;i++){
        let tempStationData={'index':i,'ifRecorded':false,'dataObj':{}};
        resultArr.push(tempStationData);
        for(let j=0;j<arrOfObj.length;j++){
            // Trim and Compare
            if(arrOfObj[j]['Аймаг нэр'] && arrOfObj[j]['Сумын нэр'] &&
               arrOfObj[j]['Аймаг нэр'].trim()===arrOfStations[i]['aimag'].trim() && 
               arrOfObj[j]['Сумын нэр'].trim()===arrOfStations[i]['cym'].trim()){
                
                resultArr[i]['dataObj']['min']=arrOfObj[j]['Хамгийн бага температур'];
                resultArr[i]['dataObj']['max']=arrOfObj[j]['Хамгийн их температур'];
                resultArr[i]['ifRecorded']=true
            }
        }
    }
    
    let resultStr='';
    for(let i=0;i<resultArr.length;i++){
        const rowKey = stationKey(arrOfStations[i]['aimag'], arrOfStations[i]['cym']);
        const rowAvg = (avgMap && typeof avgMap.get === 'function' && avgMap.get(rowKey)) ? avgMap.get(rowKey) : '';

        if(i<resultArr.length-1){
            if(resultArr[i]['ifRecorded']){
                resultStr+=resultArr[i]['dataObj']['min']+'\t'+resultArr[i]['dataObj']['max']+'\t'+rowAvg+'\n'
            }else{
                resultStr+='无\t无\t'+rowAvg+'\n'
            }
        }else{
            if(resultArr[i]['ifRecorded']){
                resultStr+=resultArr[i]['dataObj']['min']+'\t'+resultArr[i]['dataObj']['max']+'\t'+rowAvg
            }else{
                resultStr+='无\t无\t'+rowAvg
            }
        }
    }
    // console.log(resultStr);
    return resultStr;
}

// ---------------------------------------------------------
// PASTE YOUR EXTRACTING JAVASCRIPT FUNCTION HERE
// ---------------------------------------------------------
function yourCustomExtractionLogic() {
    // IMPORTANT: 
    // Your code must output headers like: "Аймаг нэр \t Сумын нэр \t Хамгийн бага температур \t Хамгийн их температур"
    // And data rows separated by tabs (\t) for the parser to work correctly.
    
    // --- PASTE YOUR CODE BELOW THIS LINE ---
    //标题
    let thsOfTitle = document.getElementsByClassName('ant-table-thead')[0].getElementsByTagName('th');
    let arrOfTitles = []; //标题数组
    for(let i=0; i<thsOfTitle.length; i++){
        let tempH;
        if(i>0 && thsOfTitle[i-1].innerText.trim() === thsOfTitle[i].innerText.trim()){ //系统实况日高低温标题有重名，迫不得已加这个判断
            tempH = thsOfTitle[i-1].innerText.trim() + '_重名标题';
        }else{
            tempH = thsOfTitle[i].innerText.trim();
        }
        arrOfTitles.push(tempH);
    }
    //数据
    let trsOfDataRow = document.getElementsByClassName('ant-table-tbody')[0].getElementsByTagName('tr');
    let arrOfDataRows = []; //结果数组
    for(let i=0; i<trsOfDataRow.length; i++){
        let tdsOfCurrentTr = trsOfDataRow[i].getElementsByTagName('td');
        let tempObj = {};
        for(let j=0; j<tdsOfCurrentTr.length; j++){
            let tempContent = tdsOfCurrentTr[j].innerText.trim();
            if(tempContent.toString().length > 0){
                tempObj[arrOfTitles[j]] = tempContent;
            }else{
                tempObj[arrOfTitles[j]] = '列<' + (j+1).toString() + '>';
            }
        }
        arrOfDataRows.push(tempObj);
    }
    //打印结果(\t间隔)
    //console.table(arrOfDataRows);
    let resultStr = '';
    //填入标题行
    for(let i=0; i<arrOfTitles.length; i++){
        if(i < arrOfTitles.length - 1){
            resultStr += arrOfTitles[i] + '\t';
        }else{
            resultStr += arrOfTitles[i] + '\n';
        }
    }
    //填入数据
    for(let i=0; i<arrOfDataRows.length; i++){
        let keys = Object.keys(arrOfDataRows[i]);
        let values = Object.values(arrOfDataRows[i]);
        for(let j=0; j<keys.length; j++){
            if(j < keys.length - 1){
                resultStr += values[j] + '\t';
            }else{
                resultStr += values[j];
            }
        }
        if(i < arrOfDataRows.length - 1){
            resultStr += '\n';
        }
    }
    //console.log(arrOfDataRows);
    console.log(resultStr);

    // Example Test Code (Remove when you paste real code):
    // console.log("Аймаг нэр\tСумын нэр\tХамгийн бага температур\tХамгийн их температур");
    // console.log("Увс\tТэс\t-20\t-10");
    // console.log("Завхан\tТэс\t-25\t-15");

    // --- PASTE YOUR CODE ABOVE THIS LINE ---
}