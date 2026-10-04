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
    
    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('span');
    title.className = 'panel-title';
    title.innerText = 'Weather Data Tools';
    header.appendChild(title);

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'panel-collapse-btn';
    collapseBtn.type = 'button';
    collapseBtn.title = 'Collapse panel';
    collapseBtn.setAttribute('aria-expanded', 'true');
    collapseBtn.innerText = '▲';
    collapseBtn.addEventListener('click', () => {
        const collapsed = panel.classList.toggle('collapsed');
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));
        collapseBtn.title = collapsed ? 'Expand panel' : 'Collapse panel';
        collapseBtn.innerText = collapsed ? '▼' : '▲';
    });
    header.appendChild(collapseBtn);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'panel-body';

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
    body.appendChild(forcedDateRow);

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
    body.appendChild(layoutTop);

    // --- BOTTOM ROW (New 2 Buttons) ---
    const layoutBottom = document.createElement('div');
    layoutBottom.className = 'control-layout-bottom';

    createButton(layoutBottom, 'Get All Min/Max', 'btn-auto', handleAutoRun);
    createButton(layoutBottom, 'Get Avg', 'btn-daily', handleGetDailyAverage);
    createButton(layoutBottom, 'Get All Avg', 'btn-test', handleTestSelectStation);

    body.appendChild(layoutBottom);

    const layoutCorrected = document.createElement('div');
    layoutCorrected.className = 'control-layout-single';
    createButton(layoutCorrected, 'Get Corrected Min/Max/Avg', 'btn-corrected', handleGetCorrectedMinMaxAvg);
    body.appendChild(layoutCorrected);

    const layoutFullTable = document.createElement('div');
    layoutFullTable.className = 'control-layout-single';
    createButton(layoutFullTable, 'Copy Full Table', 'btn-copy', handleCopyFullTable);
    body.appendChild(layoutFullTable);

    // --- RESULT BOX ---
    const resultBox = document.createElement('div');
    resultBox.id = 'my-weather-result';
    resultBox.innerText = 'Ready...';
    resultBox.title = 'Click to copy raw content';
    
    // Simple click copy for the box (Requirement 2)
    resultBox.addEventListener('click', () => {
        copyToClipboard(resultBox.innerText, resultBox);
    });

    body.appendChild(resultBox);
    panel.appendChild(body);
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

async function handleCopyFullTable(event) {
    const button = event?.currentTarget;
    const box = document.getElementById('my-weather-result');
    if (button?.disabled) return;

    if (button) button.disabled = true;
    try {
        if (box) box.innerText = 'Preparing full table export...';
        await select100RowsPerPage();

        const pageResults = [];
        let pageCount = 0;
        while (true) {
            const currentPage = getCurrentPageNumber();
            const pageText = extractFullTablePage();
            if (!pageText) throw new Error(`No table data found on page ${currentPage}.`);
            pageResults.push(pageText);
            pageCount++;
            if (box) box.innerText = `Captured page ${currentPage} (${pageCount} page${pageCount === 1 ? '' : 's'}).`;

            if (!handleNextPage()) break;
            const pageChanged = await waitForPageChange(currentPage);
            if (!pageChanged) break;
            await wait(250);
        }

        const combinedTsv = combineFullTablePages(pageResults);
        await copyTextSilently(combinedTsv);
        if (box) box.innerText = `Copy Full Table complete. ${pageCount} page(s), ${Math.max(0, combinedTsv.split('\n').length - 1)} data row(s) copied.`;
    } catch (error) {
        if (box) box.innerText = `Copy Full Table failed: ${error.message}`;
    } finally {
        if (button) button.disabled = false;
    }
}

async function select100RowsPerPage() {
    const pageSizeItem = Array.from(document.querySelectorAll('.ant-select-selection-item'))
        .find(item => /\d+\s*\/\s*page/i.test(item.innerText.trim()));
    if (!pageSizeItem) throw new Error('Could not find the table page-size menu.');

    if (pageSizeItem.innerText.trim() !== '100 / page') {
        pageSizeItem.click();
        pageSizeItem.closest('.ant-select-selector')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await wait(250);
        const option = Array.from(document.querySelectorAll('.ant-select-item-option-content'))
            .find(item => item.innerText.trim() === '100 / page');
        if (!option) throw new Error('Could not find the 100 / page option.');
        option.click();
    }

    for (let attempt = 0; attempt < 40; attempt++) {
        const selected = Array.from(document.querySelectorAll('.ant-select-selection-item'))
            .some(item => item.innerText.trim() === '100 / page');
        if (selected) {
            await wait(300);
            return;
        }
        await wait(100);
    }
    throw new Error('The table did not switch to 100 rows per page.');
}

function extractFullTablePage() {
    const header = document.querySelector('.ant-table-thead');
    const body = document.querySelector('.ant-table-tbody');
    if (!header || !body) return '';

    const titleCells = Array.from(header.querySelectorAll('th'));
    const titles = titleCells.map((cell, index) => {
        const title = cell.innerText.trim();
        return index > 0 && titleCells[index - 1].innerText.trim() === title
            ? `${title}_重名标题`
            : title;
    });
    if (!titles.length) return '';

    const rows = Array.from(body.querySelectorAll('tr')).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return titles.map((_, index) => {
            const value = cells[index]?.innerText.trim() ?? '';
            return value || `列<${index + 1}>`;
        }).join('\t');
    });
    return [titles.join('\t'), ...rows].join('\n');
}

function combineFullTablePages(pageResults) {
    if (!pageResults.length) return '';
    const lines = [];
    pageResults.forEach((pageText, index) => {
        const pageLines = pageText.split(/\r?\n/);
        if (index > 0 && pageLines.length) pageLines.shift();
        lines.push(...pageLines);
    });
    return lines.join('\n');
}

async function waitForPageChange(previousPage) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (getCurrentPageNumber() !== previousPage) return true;
        await wait(100);
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
        const targetStations = await fetchStationsList();
        const tsvWithAvg = getFinalResult(arrOfObj, new Map(), targetStations);
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
        const targetStations = await fetchStationsList();
        const finalString = getFinalResult(arrOfObj, avgMap, targetStations);

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

let cachedStations = null;
async function fetchStationsList() {
    if (cachedStations) return cachedStations;
    try {
        const url = chrome.runtime.getURL('stations.json');
        const res = await fetch(url);
        cachedStations = await res.json();
        return cachedStations;
    } catch (e) {
        console.error('Failed to load stations.json:', e);
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
                const base = baseMinMaxMap.get(key) || {};
                correctedMinMap.set(key, originalNumberOrEmpty(base.min));
                correctedMaxMap.set(key, originalNumberOrEmpty(base.max));
                continue;
            }
            await wait(2000);
            const recordsMap = await collectTemperatureAcrossPannedViews(statusBox);
            const latest = getLatestDayAverageOnly(recordsMap);
            avgMap.set(key, latest.hasAll ? latest.averageStr : '');

            const targetDateCheck = checkTargetDateExistsInRecords(recordsMap);
            if (!targetDateCheck.exists) {
                correctedMinMap.set(key, '');
                correctedMaxMap.set(key, '');
                continue;
            }

            const periodValues = getLatestStatisticPeriodValues(recordsMap);
            const base = baseMinMaxMap.get(key) || {};
            const corrected = getCorrectedMinMax(base.min, base.max, periodValues);
            correctedMinMap.set(key, corrected.min);
            correctedMaxMap.set(key, corrected.max);
        } catch (e) {
            console.error(`Correct station failed: ${keyword}`, e);
            avgMap.set(key, '');
            const base = baseMinMaxMap.get(key) || {};
            correctedMinMap.set(key, originalNumberOrEmpty(base.min));
            correctedMaxMap.set(key, originalNumberOrEmpty(base.max));
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
        box.innerText = 'Preparing hourly chart range...';
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
        const targetStations = await fetchStationsList();
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
        const targetStations = await fetchStationsList();
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

function checkTargetDateExistsInRecords(recordsMap) {
    const parsedEntries = [];
    for (const [key, temp] of recordsMap.entries()) {
        const dt = parseMMDDHH(key);
        if (!dt || typeof temp !== 'number' || Number.isNaN(temp)) continue;
        parsedEntries.push({ dt });
    }
    if (!parsedEntries.length) {
        return { exists: false, targetDate: null };
    }

    const targetDate = resolveTargetDateForRecords(parsedEntries);
    const exists = parsedEntries.some(entry =>
        entry.dt.getFullYear() === targetDate.getFullYear() &&
        entry.dt.getMonth() === targetDate.getMonth() &&
        entry.dt.getDate() === targetDate.getDate()
    );

    return { exists, targetDate };
}

function parseNumberMaybe(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value ?? '').trim().replace(/[−–—]/g, '-');
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
}

function originalNumberOrEmpty(value) {
    return parseNumberMaybe(value) === null ? '' : String(value).trim();
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
    const validPeriodValues = Array.isArray(periodValues)
        ? periodValues.filter(v => typeof v === 'number' && Number.isFinite(v))
        : [];
    return {
        min: baseMin === null ? '' : formatNumberLikeOriginal(Math.min(baseMin, ...validPeriodValues)),
        max: baseMax === null ? '' : formatNumberLikeOriginal(Math.max(baseMax, ...validPeriodValues))
    };
}

function buildCorrectedTsv(stations, correctedMinMap, correctedMaxMap, avgMap) {
    const lines = [];
    for (let i = 0; i < stations.length; i++) {
        const s = stations[i];
        const key = stationKey(s.aimag, s.cym);
        const min = correctedMinMap.get(key) ?? '';
        const max = correctedMaxMap.get(key) ?? '';
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

    return sweepHourlyChartTemperature(chartCanvas);
}

async function collectTemperatureAcrossPannedViews(statusBox) {
    const host = getHourlyChartHost();
    if (!host) throw new Error('Hourly chart container not found.');
    const chartCanvas = host.querySelector('canvas') || document.querySelector('.echarts-container canvas');
    if (!chartCanvas) throw new Error('Hourly chart canvas not found.');

    await zoomOutHourlyChartFully();
    if (statusBox) statusBox.innerText = 'Reading hourly chart from left to right...';
    return sweepHourlyChartTemperature(chartCanvas, statusBox);
}

function isResizeCursor(cursor) {
    if (!cursor) return false;
    return ['ew-resize', 'col-resize', 'w-resize', 'e-resize'].includes(cursor.toLowerCase().trim());
}

function getCursorStyle(chartCanvas) {
    return (chartCanvas.parentElement?.style?.cursor || chartCanvas.style?.cursor ||
        chartCanvas.closest('div[_echarts_instance_]')?.style?.cursor || '').trim().toLowerCase();
}

function dispatchChartPoint(chartCanvas, type, clientX, clientY, buttons = 0) {
    const common = {
        bubbles: true, cancelable: true, composed: true, view: window,
        clientX, clientY, screenX: clientX, screenY: clientY,
        pageX: clientX + window.scrollX, pageY: clientY + window.scrollY,
        button: 0, buttons
    };
    if (window.PointerEvent) {
        const pointerType = { mousemove: 'pointermove', mousedown: 'pointerdown', mouseup: 'pointerup' }[type];
        if (pointerType) {
            try {
                const event = new PointerEvent(pointerType, {
                    ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true,
                    width: 1, height: 1, pressure: buttons ? 0.5 : 0
                });
                chartCanvas.dispatchEvent(event);
                chartCanvas.parentElement?.dispatchEvent(event);
            } catch (_) {}
        }
    }
    chartCanvas.dispatchEvent(new MouseEvent(type, common));
    chartCanvas.parentElement?.dispatchEvent(new MouseEvent(type, common));
    const host = chartCanvas.closest('div[_echarts_instance_]');
    if (host && host !== chartCanvas.parentElement) host.dispatchEvent(new MouseEvent(type, common));
}

function dispatchDragPoint(target, type, clientX, clientY, buttons) {
    const common = {
        bubbles: true, cancelable: true, composed: true, view: window,
        clientX, clientY, screenX: clientX, screenY: clientY,
        pageX: clientX + window.scrollX, pageY: clientY + window.scrollY,
        button: 0, buttons, which: buttons ? 1 : (type === 'mouseup' ? 1 : 0)
    };
    if (window.PointerEvent) {
        const pointerType = { mousedown: 'pointerdown', mousemove: 'pointermove', mouseup: 'pointerup' }[type];
        try {
            target.dispatchEvent(new PointerEvent(pointerType, {
                ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true,
                width: 1, height: 1, pressure: buttons ? 0.5 : 0
            }));
        } catch (_) {}
    }
    target.dispatchEvent(new MouseEvent(type, common));
}

function hoverChartPoint(chartCanvas, x, y) {
    dispatchChartPoint(chartCanvas, 'mousemove', x, y, 0);
    if (chartCanvas.parentElement) {
        chartCanvas.parentElement.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: 0
        }));
    }
}

async function findDataZoomHandle(chartCanvas, side, preferredY) {
    const rect = chartCanvas.getBoundingClientRect();
    // Initialize ZRender's pointer state before probing the dataZoom track.
    if (window.PointerEvent) {
        const init = { bubbles: true, cancelable: true, composed: true, view: window,
            clientX: rect.left + 60, clientY: rect.bottom - 18,
            pointerId: 1, pointerType: 'mouse', isPrimary: true };
        try {
            chartCanvas.dispatchEvent(new PointerEvent('pointerenter', init));
            chartCanvas.dispatchEvent(new PointerEvent('pointerover', init));
        } catch (_) {}
    }
    chartCanvas.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true, cancelable: true, clientX: rect.left + 60, clientY: rect.bottom - 18
    }));
    chartCanvas.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true, cancelable: true, clientX: rect.left + 60, clientY: rect.bottom - 18
    }));
    hoverChartPoint(chartCanvas, rect.left + 60, rect.bottom - 18);
    await wait(20);
    const yOffsets = [18, 16, 20, 22, 14, 24, 26, 12, 28, 10, 30, 8, 34, 38];
    const candidateYs = preferredY == null ? [] : [preferredY];
    yOffsets.forEach(offset => {
        const y = rect.bottom - offset;
        if (y > rect.top && !candidateYs.includes(y)) candidateYs.push(y);
    });
    for (const y of candidateYs) {
        const start = side === 'left' ? 50 : Math.max(80, Math.round(rect.width - 35));
        const end = side === 'left' ? Math.max(60, rect.width - 50) : 45;
        const step = side === 'left' ? 2 : -2;
        for (let offset = start; side === 'left' ? offset <= end : offset >= end; offset += step) {
            const x = rect.left + offset;
            hoverChartPoint(chartCanvas, x, y);
            await wait(3);
            if (!isResizeCursor(getCursorStyle(chartCanvas))) continue;

            // Resolve the safe outer edge of this resize handle.
            let edge = x;
            const direction = side === 'left' ? -1 : 1;
            for (let i = 1; i <= 25; i++) {
                const probeX = x + direction * i;
                hoverChartPoint(chartCanvas, probeX, y);
                await wait(2);
                if (!isResizeCursor(getCursorStyle(chartCanvas))) break;
                edge = probeX;
            }
            return { x: side === 'left' ? edge + 2 : edge - 2, y };
        }
    }
    return null;
}

async function dragDataZoomHandle(chartCanvas, handle, side) {
    if (!handle) throw new Error(`Could not locate the ${side} hourly-chart scrollbar handle.`);
    const rect = chartCanvas.getBoundingClientRect();
    const endX = side === 'left' ? Math.max(0, Math.round(rect.left + 50)) : Math.round(rect.right - 45);
    let startX = handle.x;
    const y = handle.y;
    // Anchor the pointer and verify the resize cursor before pressing. If the
    // cursor is not a resize cursor, the chart would pan the whole selection.
    let resizeLocked = false;
    for (let attempt = 0; attempt < 5; attempt++) {
        hoverChartPoint(chartCanvas, startX, y);
        await wait(15);
        if (isResizeCursor(getCursorStyle(chartCanvas))) {
            resizeLocked = true;
            break;
        }
    }
    if (!resizeLocked) {
        for (let step = 0; step < 8; step++) {
            startX += 1;
            hoverChartPoint(chartCanvas, startX, y);
            await wait(15);
            if (isResizeCursor(getCursorStyle(chartCanvas))) {
                resizeLocked = true;
                break;
            }
        }
    }
    if (!resizeLocked) return false;

    dispatchDragPoint(chartCanvas, 'mousedown', startX, y, 1);
    await wait(50);
    const steps = 15;
    for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        dispatchDragPoint(chartCanvas, 'mousemove', x, y, 1);
        dispatchDragPoint(document, 'mousemove', x, y, 1);
        dispatchDragPoint(window, 'mousemove', x, y, 1);
        await wait(12);
    }
    dispatchDragPoint(chartCanvas, 'mouseup', endX, y, 0);
    dispatchDragPoint(document, 'mouseup', endX, y, 0);
    dispatchDragPoint(window, 'mouseup', endX, y, 0);
    await wait(250);
    return true;
}

async function sweepHourlyChartTemperature(chartCanvas, statusBox) {
    chartCanvas.scrollIntoView({ behavior: 'auto', block: 'center' });
    await wait(80);
    const rect = chartCanvas.getBoundingClientRect();
    const startX = Math.round(rect.left + 50);
    const endX = Math.round(rect.right - 40);
    const sweepY = Math.round(rect.top + rect.height * 0.25);
    const recordsMap = new Map();
    hoverChartPoint(chartCanvas, startX, sweepY);
    await wait(40);
    const totalSteps = Math.max(1, Math.floor((endX - startX) / 2));
    for (let step = 0; step <= totalSteps; step++) {
        const x = Math.min(endX, startX + step * 2);
        hoverChartPoint(chartCanvas, x, sweepY);
        const host = chartCanvas.closest('div[_echarts_instance_]') || chartCanvas.parentElement || document.body;
        const tooltipNodes = new Set([
            ...host.querySelectorAll('div[style*="z-index"]'),
            ...document.body.querySelectorAll('div[style*="z-index"]')
        ]);
        for (const node of tooltipNodes) {
            if (node.closest('#my-weather-extension-panel')) continue;
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
            for (const { dateTime, temp } of parseTooltipText(node.innerText || node.textContent || '')) {
                recordsMap.set(dateTime, temp);
            }
        }
        if (step % 12 === 0) {
            if (statusBox) statusBox.innerText = `Reading hourly chart: ${Math.round(step / totalSteps * 100)}% (${recordsMap.size} points)`;
        }
        await wait(8);
    }
    chartCanvas.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return recordsMap;
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
    const dataZoom = chart.getOption?.()?.dataZoom || [];
    if (!dataZoom.length) return false;
    const patchedDataZoom = dataZoom.map(item => ({
        ...item,
        start: 0,
        end: 100,
        startValue: null,
        endValue: null
    }));
    chart.setOption({ dataZoom: patchedDataZoom }, { replaceMerge: ['dataZoom'] });
    chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
    patchedDataZoom.forEach((_, index) => {
        chart.dispatchAction({ type: 'dataZoom', dataZoomIndex: index, start: 0, end: 100 });
    });
    return true;
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

    // Match the subdomain flow: move the left handle to its limit, then the
    // right handle, and verify that ECharts accepted the full range.
    const chart = getEchartsInstanceFromHost(host);
    let leftHandle = null;
    for (let attempt = 0; attempt < 3 && !leftHandle; attempt++) {
        leftHandle = await findDataZoomHandle(chartCanvas, 'left');
        if (!leftHandle) await wait(300);
    }
    let leftDragOk = false;
    if (leftHandle) leftDragOk = await dragDataZoomHandle(chartCanvas, leftHandle, 'left');

    let rightHandle = null;
    for (let attempt = 0; attempt < 3 && !rightHandle; attempt++) {
        rightHandle = await findDataZoomHandle(chartCanvas, 'right', leftHandle?.y);
        if (!rightHandle) await wait(300);
    }
    let rightDragOk = false;
    if (rightHandle) {
        rightDragOk = await dragDataZoomHandle(chartCanvas, rightHandle, 'right');
    }

    if (chart && (!leftDragOk || !rightDragOk || getDataZoomCoveragePercent(chart) < 99.5)) {
        // If the first drag moved the selected window instead of resizing it,
        // or could not lock onto a handle, recover through ECharts.
        for (let attempt = 0; attempt < 3 && getDataZoomCoveragePercent(chart) < 99.5; attempt++) {
            forceDataZoomFullRange(chart);
            await wait(300);
        }
        await wait(250);
    }

    if (chart && getDataZoomCoveragePercent(chart) < 99.5) {
        throw new Error('Hourly chart scrollbar did not reach its full range. Please try again.');
    }
    if (!chart && (!leftDragOk || !rightDragOk)) {
        const missing = !leftDragOk ? 'left' : 'right';
        throw new Error(`Could not safely drag the ${missing} hourly-chart scrollbar handle.`);
    }
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
function getFinalResult(arrOfObj, avgMap, arrOfStations){


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
                tempObj[arrOfTitles[j]] = '';
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
