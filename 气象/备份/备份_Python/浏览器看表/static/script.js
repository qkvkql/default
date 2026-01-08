let globalExcelData = {};
let currentSheetName = "";
let currentTableRows = [];
let currentHeaders = [];
let sortDirection = {};
let activeMode = null;
let activeKey = null;

// --- STYLE PERSISTENCE REGISTRY ---
let styleRegistry = {
    headers: [], // Rules for <thead> tr
    rows: {},    // Rules for individual <tbody> rows { index: styles }
    allRows: null, // Rule for all <tbody> rows
    cols: {},    // Rules for individual columns { index: styles }
    allCols: null, // Rule for all <tbody> cells
    cells: {},   // Rules for specific cells { "rowIdx-colIdx": styles }
    temps: []    // List of .temp() calls to re-apply
};

// --- UI STATE MANAGEMENT ---

function toggleControls(enable) {
    const searchInput = document.getElementById('searchInput');
    const addFilterBtn = document.getElementById('addFilterBtn');
    const submitSearchBtn = document.getElementById('submitSearchBtn');

    if (enable) {
        searchInput.removeAttribute('disabled');
        addFilterBtn.removeAttribute('disabled');
        submitSearchBtn.removeAttribute('disabled');
    } else {
        searchInput.setAttribute('disabled', 'true');
        addFilterBtn.setAttribute('disabled', 'true');
        submitSearchBtn.setAttribute('disabled', 'true');
    }
}

// NEW: Toggle Copy Button separately
function toggleCopyButton(enable) {
    const btn = document.getElementById('copyTsvBtn');
    if (enable) {
        btn.removeAttribute('disabled');
        btn.style.cursor = "pointer";
        btn.style.opacity = "1";
    } else {
        btn.setAttribute('disabled', 'true');
        btn.style.cursor = "not-allowed";
        btn.style.opacity = "0.6";
    }
}

// --- DYNAMIC FILTER UI (Existing) ---
function addFilterRow() {
    const container = document.getElementById('advanced-filters');
    const div = document.createElement('div');
    div.className = 'filter-row';
    div.style.marginBottom = "15px";
    div.style.padding = "10px";
    div.style.background = "#fff";
    div.style.border = "1px solid #ddd";
    div.style.borderRadius = "4px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "8px";

    // Top row: Column selector and Remove button
    const topRow = document.createElement('div');
    topRow.style.display = "flex";
    topRow.style.gap = "10px";
    topRow.style.alignItems = "center";

    const select = document.createElement('select');
    select.className = 'col-select';
    select.style.padding = "5px";
    select.style.minWidth = "150px";

    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.text = "-- Select Column --";
    select.appendChild(defaultOpt);

    if (currentHeaders.length > 0) {
        currentHeaders.forEach(header => {
            const opt = document.createElement('option');
            opt.value = header;
            opt.text = header;
            select.appendChild(opt);
        });
    }

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = "X";
    removeBtn.style.backgroundColor = "#dc3545";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.padding = "5px 10px";
    removeBtn.style.cursor = "pointer";
    removeBtn.onclick = function () { container.removeChild(div); };

    topRow.appendChild(select);
    topRow.appendChild(removeBtn);

    // Middle row: Type selection (Radio)
    const typeRow = document.createElement('div');
    typeRow.style.display = "flex";
    typeRow.style.gap = "15px";
    typeRow.style.fontSize = "14px";

    const filterId = Date.now() + Math.random(); // Unique ID for radio group

    const stringLabel = document.createElement('label');
    const stringRadio = document.createElement('input');
    stringRadio.type = "radio";
    stringRadio.name = `type-${filterId}`;
    stringRadio.value = "string";
    stringRadio.checked = true;
    stringRadio.className = "filter-type-radio";
    stringLabel.appendChild(stringRadio);
    stringLabel.appendChild(document.createTextNode(" String"));

    const numberLabel = document.createElement('label');
    const numberRadio = document.createElement('input');
    numberRadio.type = "radio";
    numberRadio.name = `type-${filterId}`;
    numberRadio.value = "number";
    numberRadio.className = "filter-type-radio";
    numberLabel.appendChild(numberRadio);
    numberLabel.appendChild(document.createTextNode(" Number Range"));

    typeRow.appendChild(stringLabel);
    typeRow.appendChild(numberLabel);

    // Bottom row: Inputs (conditional)
    const inputRow = document.createElement('div');

    // String input
    const stringInput = document.createElement('input');
    stringInput.type = "text";
    stringInput.className = 'col-value-string short-input';
    stringInput.placeholder = "Filter value...";
    stringInput.style.padding = "5px";
    stringInput.style.display = "block";

    // Number inputs container
    const numberInputs = document.createElement('div');
    numberInputs.className = 'number-inputs-container';
    numberInputs.style.display = "none";
    numberInputs.style.gap = "10px";
    numberInputs.style.alignItems = "center";

    const startInput = document.createElement('input');
    startInput.type = "text";
    startInput.className = 'col-value-start short-input';
    startInput.placeholder = "Start Range";
    startInput.style.padding = "5px";
    startInput.style.width = "100px";

    const stepInput = document.createElement('input');
    stepInput.type = "text";
    stepInput.className = 'col-value-step short-input';
    stepInput.placeholder = "Step Length";
    stepInput.style.padding = "5px";
    stepInput.style.width = "100px";

    numberInputs.appendChild(document.createTextNode("Range: "));
    numberInputs.appendChild(startInput);
    numberInputs.appendChild(document.createTextNode(" + "));
    numberInputs.appendChild(stepInput);

    inputRow.appendChild(stringInput);
    inputRow.appendChild(numberInputs);

    // Toggle logic
    stringRadio.onchange = () => {
        stringInput.style.display = "block";
        numberInputs.style.display = "none";
    };
    numberRadio.onchange = () => {
        stringInput.style.display = "none";
        numberInputs.style.display = "flex";
    };

    div.appendChild(topRow);
    div.appendChild(typeRow);
    div.appendChild(inputRow);
    container.appendChild(div);
}

function gatherColumnFilters() {
    const filters = [];
    const rows = document.querySelectorAll('.filter-row');
    rows.forEach(row => {
        const col = row.querySelector('.col-select').value;
        if (!col) return;

        const type = row.querySelector('.filter-type-radio:checked').value;
        const filterObj = { column: col, type: type };

        if (type === 'string') {
            const val = row.querySelector('.col-value-string').value.trim();
            if (val) {
                filterObj.value = val;
                filters.push(filterObj);
            }
        } else {
            const start = row.querySelector('.col-value-start').value.trim();
            const step = row.querySelector('.col-value-step').value.trim();
            if (start !== "" && step !== "") {
                filterObj.start = start;
                filterObj.step = step;
                filters.push(filterObj);
            }
        }
    });
    return filters;
}

// --- NEW: EXPORT UI LOGIC ---

function renderExportCheckboxes() {
    const container = document.getElementById('checkbox-list');
    const exportSection = document.getElementById('export-container');

    // Show section
    exportSection.style.display = "block";
    container.innerHTML = "";

    // Create a checkbox for each header
    currentHeaders.forEach((header, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.className = "col-checkbox";
        checkbox.value = index; // Store column index
        checkbox.id = `chk-${index}`;
        // Per requirement: unchecked by default
        checkbox.checked = false;

        const label = document.createElement('label');
        label.htmlFor = `chk-${index}`;
        label.textContent = header;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });
}

function copyToClipboard() {
    // 1. Identify which columns are checked
    const checkboxes = document.querySelectorAll('.col-checkbox:checked');
    if (checkboxes.length === 0) {
        alert("Please select at least one column to copy.");
        return;
    }

    // Sort checkboxes by index to ensure order matches table order
    const selectedIndices = Array.from(checkboxes)
        .map(cb => parseInt(cb.value))
        .sort((a, b) => a - b);

    // --- PART A: COPY TO CLIPBOARD (Existing Logic) ---
    let tsvContent = "";

    // Header Row
    const headerRow = selectedIndices.map(idx => currentHeaders[idx]).join("\t");
    tsvContent += headerRow + "\n";

    // Data Rows
    currentTableRows.forEach(row => {
        const rowData = selectedIndices.map(idx => {
            let val = row[idx];
            if (val === null || val === undefined) val = "";
            val = String(val).replace(/\t/g, " ").replace(/\n/g, " ");
            return val;
        }).join("\t");
        tsvContent += rowData + "\n";
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
        const status = document.getElementById('copyStatus');
        status.style.display = "inline";
        setTimeout(() => { status.style.display = "none"; }, 2000);
    }).catch(err => {
        alert("Failed to copy: " + err);
    });

    // --- PART B: UPDATE TABLE DISPLAY (New Logic) ---

    // 1. Create new Headers array containing ONLY selected headers
    const newHeaders = selectedIndices.map(idx => currentHeaders[idx]);

    // 2. Create new Rows array containing ONLY selected cell values
    const newRows = currentTableRows.map(row => {
        return selectedIndices.map(idx => row[idx]);
    });

    // 3. Update Global Variables
    currentHeaders = newHeaders;
    currentTableRows = newRows;

    // 4. Re-render the Table (Now shows only selected columns)
    renderTable();

    // 5. Re-render the Export Checkboxes
    // (Since the visible columns changed, the checkboxes must match the new table)
    renderExportCheckboxes();

    // 6. Reset Sort Direction since the column indices have shifted
    sortDirection = {};
}

function copyColumn(index, btnElement) {
    if (currentTableRows.length === 0) return;

    // Data Rows (excluding header)
    const columnData = currentTableRows.map(row => {
        let val = row[index];
        if (val === null || val === undefined) val = "";
        // Clean TSV sensitive characters
        val = String(val).replace(/\t/g, " ").replace(/\n/g, " ");
        return val;
    }).join("\n");

    navigator.clipboard.writeText(columnData).then(() => {
        // Visual feedback
        const originalText = btnElement.innerText;
        btnElement.innerText = "Copied!";
        btnElement.classList.add('copied');

        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        alert("Failed to copy column: " + err);
    });
}

// --- MAIN LOGIC ---

function setModeAndLoad(mode, key) {
    activeMode = mode;
    activeKey = key;
    executeLoad();
}

function triggerSearch() {
    if (!activeMode) return;
    executeLoad();
}

async function executeLoad() {
    const keyword = document.getElementById('searchInput').value;
    const colFilters = gatherColumnFilters();

    // Reset Copy Button on new search start
    toggleCopyButton(false);
    showLoading();

    try {
        let response;
        if (activeMode === 'predefined') {
            response = await fetch('/get_predefined', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: activeKey,
                    keyword: keyword,
                    column_filters: colFilters
                })
            });
        } else if (activeMode === 'upload') {
            const fileInput = document.getElementById('fileInput');
            if (fileInput.files.length === 0) {
                document.getElementById('table-container').innerHTML = "<p class='placeholder'>No file selected.</p>";
                return;
            }
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('keyword', keyword);
            formData.append('column_filters', JSON.stringify(colFilters));
            response = await fetch('/upload_file', { method: 'POST', body: formData });
        }

        if (!response.ok) throw new Error("Server error.");
        const data = await response.json();
        handleResponse(data);
    } catch (error) {
        showError(error.message);
    }
}

function handleResponse(data) {
    if (!data.success) {
        showError(data.error);
        return;
    }

    globalExcelData = data.data;
    const sheetNames = data.sheets;
    const sheetSelect = document.getElementById('sheetSelect');
    const sheetControl = document.getElementById('sheet-control');

    sheetSelect.innerHTML = "";
    sheetNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        sheetSelect.appendChild(option);
    });

    if (sheetNames.length > 0) {
        if (sheetControl) sheetControl.style.display = "block";
        currentSheetName = sheetNames[0];
        loadSheet(currentSheetName);
    } else {
        if (sheetControl) sheetControl.style.display = "none";
        showError("File contains no readable sheets.");
    }
}

function switchSheet() {
    currentSheetName = document.getElementById('sheetSelect').value;
    // Reset copy button when switching
    toggleCopyButton(false);
    loadSheet(currentSheetName);
}

function loadSheet(sheetName) {
    sortDirection = {};
    const sheetData = globalExcelData[sheetName];

    currentHeaders = sheetData.headers;
    currentTableRows = JSON.parse(JSON.stringify(sheetData.rows));

    // 1. Update Filters Dropdowns
    updateFilterDropdowns();

    // 2. Update Export Checkboxes
    renderExportCheckboxes();

    // 3. Check Size
    if (sheetData.too_large) {
        // WARNING STATE: Button must be DISABLED
        toggleCopyButton(false);

        const msg = `Result has ${sheetData.row_count} rows (Limit: 2000). <br>
                     Data is hidden to prevent browser crash. <br>
                     <strong>Please type keywords or add column filters to reduce result size.</strong>`;
        showWarning(msg);
    } else {
        // TABLE STATE: Button logic handled inside renderTable
        renderTable();
    }

    toggleControls(true);
}

function updateFilterDropdowns() {
    const dropdowns = document.querySelectorAll('.col-select');
    dropdowns.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Select Column --</option>';
        currentHeaders.forEach(header => {
            const opt = document.createElement('option');
            opt.value = header;
            opt.text = header;
            select.appendChild(opt);
        });
        if (currentHeaders.includes(currentVal)) select.value = currentVal;
    });
}

// --- RENDERING ---

function renderTable() {
    const container = document.getElementById('table-container');

    // EMPTY STATE
    if (currentTableRows.length === 0) {
        toggleCopyButton(false); // Disable copy if empty
        container.innerHTML = "<p class='placeholder'>No rows match your filters.</p>";
        return;
    }

    // CONTENT STATE
    toggleCopyButton(true); // Enable copy since we have content

    const totalCols = currentHeaders.length;
    let html = `
        <div style='padding:10px; font-weight:bold; color:#555;'>
            Found ${currentTableRows.length} rows
        </div>
        <div class="copy-buttons-row">
            ${currentHeaders.map((_, idx) => `
                <div class="copy-btn-cell" style="flex: 0 0 auto; padding: 5px; border-right: 1px solid #ddd; display: flex; justify-content: center; align-items: center; box-sizing: border-box;">
                    <button class="copy-col-btn" onclick="copyColumn(${idx}, this)">Copy Col</button>
                </div>
            `).join('')}
        </div>
        <table>
            <thead>
                <tr class="summary-header">
                    <th colspan="${totalCols}" style="text-align: center; background-color: #f8f9fa;">Table Summary</th>
                </tr>
                <tr>`;

    currentHeaders.forEach((header, index) => {
        const dir = sortDirection[index] || '';
        html += `<th class="${dir}" onclick="sortTable(${index})">${header}</th>`;
    });

    html += '</tr></thead><tbody>';
    currentTableRows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => { html += `<td>${cell}</td>`; });
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    // RE-APPLY STYLES FROM REGISTRY
    applyRegistryStyles();

    // Sync button widths with table columns
    setTimeout(syncCopyBtnWidths, 0);
}

function syncCopyBtnWidths() {
    const table = document.querySelector('#table-container table');
    const btnCells = document.querySelectorAll('.copy-btn-cell');
    if (!table || btnCells.length === 0) return;

    const ths = table.querySelectorAll('thead tr:last-child th');
    if (ths.length !== btnCells.length) return;

    ths.forEach((th, idx) => {
        const width = th.getBoundingClientRect().width;
        btnCells[idx].style.width = width + 'px';
        btnCells[idx].style.minWidth = width + 'px';
        btnCells[idx].style.maxWidth = width + 'px';
    });
}

window.addEventListener('resize', syncCopyBtnWidths);

/**
 * Re-applies all styles stored in the registry to the current DOM
 */
function applyRegistryStyles() {
    // 1. All Rows
    if (styleRegistry.allRows) {
        window.setAllRowsStyle(styleRegistry.allRows, false);
    }
    // 2. All Cols
    if (styleRegistry.allCols) {
        window.setAllColumnsStyle(styleRegistry.allCols, false);
    }
    // 3. Individual Rows
    for (let idx in styleRegistry.rows) {
        window.setRowStyle(parseInt(idx), styleRegistry.rows[idx], false);
    }
    // 4. Individual Columns
    for (let idx in styleRegistry.cols) {
        window.setColumnStyle(parseInt(idx), styleRegistry.cols[idx], false);
    }
    // 5. Specific Cells
    for (let key in styleRegistry.cells) {
        const [r, c] = key.split('-').map(Number);
        window.setCellStyle(r, c, styleRegistry.cells[key], false);
    }
    // 6. Headers
    styleRegistry.headers.forEach(rule => {
        window.setHeaderStyle(rule, false);
    });
    // 7. Temps
    styleRegistry.temps.forEach(tempRule => {
        if (tempRule.type === 'allRows') window.setAllRowsStyle.temp(false);
        if (tempRule.type === 'row') window.setRowStyle.temp(tempRule.index, false);
        if (tempRule.type === 'allCols') window.setAllColumnsStyle.temp(false);
        if (tempRule.type === 'col') window.setColumnStyle.temp(tempRule.index, false);
        if (tempRule.type === 'cell') window.setCellStyle.temp(tempRule.rowIndex, tempRule.colIndex, false);
        if (tempRule.type === 'header') window.setHeaderStyle.temp(false);
    });
}

function sortTable(columnIndex) {
    const currentDir = sortDirection[columnIndex] === 'asc' ? 'desc' : 'asc';
    sortDirection = {};
    sortDirection[columnIndex] = currentDir;

    currentTableRows.sort((a, b) => {
        let valA = a[columnIndex];
        let valB = b[columnIndex];

        const cleanA = (valA === null || valA === undefined) ? "" : String(valA).trim();
        const cleanB = (valB === null || valB === undefined) ? "" : String(valB).trim();
        const isEmptyA = cleanA === "";
        const isEmptyB = cleanB === "";

        if (isEmptyA && isEmptyB) return 0;
        if (isEmptyA) return 1;
        if (isEmptyB) return -1;

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const isNumA = !isNaN(numA) && isFinite(valA) && cleanA !== "";
        const isNumB = !isNaN(numB) && isFinite(valB) && cleanB !== "";

        if (isNumA && !isNumB) return -1;
        if (!isNumA && isNumB) return 1;

        if (isNumA && isNumB) {
            return currentDir === 'asc' ? numA - numB : numB - numA;
        } else {
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return currentDir === 'asc' ? -1 : 1;
            if (strA > strB) return currentDir === 'asc' ? 1 : -1;
            return 0;
        }
    });

    renderTable();
}

function showLoading() {
    toggleCopyButton(false); // Disable while loading
    document.getElementById('table-container').innerHTML = "<p class='placeholder'>Processing...</p>";
}

function showError(msg) {
    toggleCopyButton(false); // Disable on error
    document.getElementById('table-container').innerHTML = `<p class="error-msg" style="color:red; font-weight:bold; padding:20px;">${msg}</p>`;
}

function showWarning(msg) {
    toggleCopyButton(false); // Disable on warning (too large)
    document.getElementById('table-container').innerHTML = `<p class="placeholder" style="color:#d9534f; font-size:18px;">${msg}</p>`;
}

// --- STYLING API ---

/**
 * Get color based on temperature value
 */
function getTemperatureColor(val) {
    const v = parseFloat(val);
    if (isNaN(v)) return null;

    if (v <= -75) return '#ffffff';
    if (v <= -74) return '#fff4f9';
    if (v <= -73) return '#fee9f3';
    if (v <= -72) return '#fedfed';
    if (v <= -71) return '#fdd4e7';
    if (v <= -70) return '#fdc9e1';
    if (v <= -69) return '#fdbedb';
    if (v <= -68) return '#fcb3d5';
    if (v <= -67) return '#fca8ce';
    if (v <= -66) return '#fb9dc8';
    if (v <= -65) return '#fb92c2';
    if (v <= -64) return '#fb87bc';
    if (v <= -63) return '#fa7cb6';
    if (v <= -62) return '#fa72b0';
    if (v <= -61) return '#f967aa';
    if (v <= -60) return '#f95ca4';
    if (v <= -59) return '#f9519e';
    if (v <= -58) return '#f84698';
    if (v <= -57) return '#f83b91';
    if (v <= -56) return '#f7308b';
    if (v <= -55) return '#f72585';
    if (v <= -54) return '#f02488';
    if (v <= -53) return '#ea228a';
    if (v <= -52) return '#e3218d';
    if (v <= -51) return '#dd1f8f';
    if (v <= -50) return '#d61e92';
    if (v <= -49) return '#cf1d94';
    if (v <= -48) return '#c91b97';
    if (v <= -47) return '#c21a99';
    if (v <= -46) return '#bc189c';
    if (v <= -45) return '#b5179e';
    if (v <= -44) return '#ae16a1';
    if (v <= -43) return '#a814a3';
    if (v <= -42) return '#a113a6';
    if (v <= -41) return '#9b11a8';
    if (v <= -40) return '#9410ab';
    if (v <= -39) return '#8d0fad';
    if (v <= -38) return '#860db0';
    if (v <= -37) return '#800cb2';
    if (v <= -36) return '#790ab5';
    if (v <= -35) return '#7209b7';
    if (v <= -34) return '#6c09b5';
    if (v <= -33) return '#670ab3';
    if (v <= -32) return '#610ab1';
    if (v <= -31) return '#5c0baf';
    if (v <= -30) return '#560bad';
    if (v <= -29) return '#530bac';
    if (v <= -28) return '#500bab';
    if (v <= -27) return '#4e0caa';
    if (v <= -26) return '#4b0ca9';
    if (v <= -25) return '#480ca8';
    if (v <= -24) return '#450ca7';
    if (v <= -23) return '#420ca6';
    if (v <= -22) return '#400ca5';
    if (v <= -21) return '#3d0ca4';
    if (v <= -20) return '#3a0ca3';
    if (v <= -19) return '#3b15ab';
    if (v <= -18) return '#3c1db2';
    if (v <= -17) return '#3d26ba';
    if (v <= -16) return '#3e2ec1';
    if (v <= -15) return '#3f37c9';
    if (v <= -14) return '#403fd0';
    if (v <= -13) return '#4148d8';
    if (v <= -12) return '#4150df';
    if (v <= -11) return '#4259e7';
    if (v <= -10) return '#4361ee';
    if (v <= -9) return '#446bee';
    if (v <= -8) return '#4576ee';
    if (v <= -7) return '#4680ef';
    if (v <= -6) return '#478bef';
    if (v <= -5) return '#4895ef';
    if (v <= -4) return '#499fef';
    if (v <= -3) return '#4aaaef';
    if (v <= -2) return '#4ab4f0';
    if (v <= -1) return '#4bbff0';
    if (v <= 0) return '#4cc9f0';
    if (v < 1) return '#6dcfea';
    if (v < 2) return '#8fd6e4';
    if (v < 3) return '#b0dcdd';
    if (v < 4) return '#d2e3d7';
    if (v < 5) return '#f3e9d1';
    if (v < 6) return '#f0e5c8';
    if (v < 7) return '#eee0bf';
    if (v < 8) return '#ebdcb5';
    if (v < 9) return '#e9d7ac';
    if (v < 10) return '#e6d3a3';
    if (v < 11) return '#e3d39a';
    if (v < 12) return '#e0d290';
    if (v < 13) return '#ded287';
    if (v < 14) return '#dbd17d';
    if (v < 15) return '#d8d174';
    if (v < 16) return '#d1ce6e';
    if (v < 17) return '#cacc67';
    if (v < 18) return '#c4c961';
    if (v < 19) return '#bdc75a';
    if (v < 20) return '#b6c454';
    if (v < 21) return '#aebe44';
    if (v < 22) return '#a6b834';
    if (v < 23) return '#9eb224';
    if (v < 24) return '#96ac14';
    if (v < 25) return '#8ea604';
    if (v < 26) return '#a3aa03';
    if (v < 27) return '#b7ae02';
    if (v < 28) return '#ccb302';
    if (v < 29) return '#e0b701';
    if (v < 30) return '#f5bb00';
    if (v < 31) return '#efab01';
    if (v < 32) return '#e99b01';
    if (v < 33) return '#e38a02';
    if (v < 34) return '#dd7a02';
    if (v < 35) return '#d76a03';
    if (v < 36) return '#d25f02';
    if (v < 37) return '#cd5302';
    if (v < 38) return '#c94801';
    if (v < 39) return '#c43c01';
    if (v < 40) return '#bf3100';
    if (v < 41) return '#ae2b03';
    if (v < 42) return '#9d2506';
    if (v < 43) return '#8b2008';
    if (v < 44) return '#7a1a0b';
    if (v < 45) return '#69140e';
    if (v < 46) return '#601410';
    if (v < 47) return '#571412';
    if (v < 48) return '#4e1514';
    if (v < 49) return '#451516';
    if (v < 50) return '#3c1518';
    if (v < 51) return '#301113';
    if (v < 52) return '#240d0e';
    if (v < 53) return '#18080a';
    if (v < 54) return '#0c0405';
    return '#000000';
}

/**
 * Get font color based on temperature value for contrast
 */
function getTemperatureFontColor(val) {
    const v = parseFloat(val);
    if (isNaN(v)) return null;

    if (v <= -55 || (v > -5 && v < 35)) {
        return '#000000';
    } else {
        return '#ffffff';
    }
}

/**
 * Helper to apply styles to an element
 */
function applyStylesToElement(el, styles) {
    if (!el || !styles) return;
    if (styles.color) el.style.color = styles.color;
    if (styles.backgroundColor) el.style.backgroundColor = styles.backgroundColor;
    if (styles.borderStyle) el.style.borderStyle = styles.borderStyle;
    if (styles.fontWeight) el.style.fontWeight = styles.fontWeight;
    if (styles.fontSize) el.style.fontSize = styles.fontSize;
    if (styles.textAlign) el.style.textAlign = styles.textAlign;
    if (styles.height) el.style.height = styles.height;
    if (styles.padding) el.style.padding = styles.padding;
    if (styles.margin) el.style.margin = styles.margin;

    // Robust Width Handling
    if (styles.width) {
        el.style.width = styles.width;
        el.style.minWidth = styles.width;
        el.style.maxWidth = styles.width;
        el.style.overflow = "hidden";
        el.style.textOverflow = "ellipsis";
    }

    // Custom White Space (e.g., 'normal' for wrapping)
    if (styles.whiteSpace) {
        el.style.whiteSpace = styles.whiteSpace;
    }
}

function applyTempStyle(cell) {
    if (!cell) return;
    const bgColor = getTemperatureColor(cell.textContent);
    const fontColor = getTemperatureFontColor(cell.textContent);
    if (bgColor) {
        cell.style.backgroundColor = bgColor;
    }
    if (fontColor) {
        cell.style.color = fontColor;
    }
}

/**
 * Set style for all rows in tbody
 */
window.setAllRowsStyle = function (styles, save = true) {
    if (save) styleRegistry.allRows = styles;
    const rows = document.querySelectorAll('#table-container tbody tr');
    rows.forEach(row => applyStylesToElement(row, styles));
};
window.setAllRowsStyle.temp = function (save = true) {
    if (save) styleRegistry.temps.push({ type: 'allRows' });
    const cells = document.querySelectorAll('#table-container tbody td');
    cells.forEach(cell => applyTempStyle(cell));
};

/**
 * Set style for a specific row in tbody (0-indexed)
 */
window.setRowStyle = function (index, styles, save = true) {
    if (save) styleRegistry.rows[index] = styles;
    const rows = document.querySelectorAll('#table-container tbody tr');
    if (rows[index]) {
        applyStylesToElement(rows[index], styles);
    }
};
window.setRowStyle.temp = function (index, save = true) {
    if (save) styleRegistry.temps.push({ type: 'row', index: index });
    const rows = document.querySelectorAll('#table-container tbody tr');
    const row = rows[index];
    if (row) {
        Array.from(row.cells).forEach(cell => applyTempStyle(cell));
    }
};

/**
 * Set style for all cells in all rows in tbody
 */
window.setAllColumnsStyle = function (styles, save = true) {
    if (save) styleRegistry.allCols = styles;
    const cells = document.querySelectorAll('#table-container tbody td');
    cells.forEach(cell => applyStylesToElement(cell, styles));
};
window.setAllColumnsStyle.temp = function (save = true) {
    if (save) styleRegistry.temps.push({ type: 'allCols' });
    window.setAllRowsStyle.temp(false);
};

/**
 * Set style for a specific column in all rows in tbody (0-indexed)
 */
window.setColumnStyle = function (index, styles, save = true) {
    if (save) styleRegistry.cols[index] = styles;
    const rows = document.querySelectorAll('#table-container tbody tr');
    rows.forEach(row => {
        const cell = row.cells[index];
        if (cell) {
            applyStylesToElement(cell, styles);
        }
    });
};
window.setColumnStyle.temp = function (index, save = true) {
    if (save) styleRegistry.temps.push({ type: 'col', index: index });
    const rows = document.querySelectorAll('#table-container tbody tr');
    rows.forEach(row => {
        const cell = row.cells[index];
        if (cell) applyTempStyle(cell);
    });
};

/**
 * Set style for a specific table cell (0-indexed)
 */
window.setCellStyle = function (rowIndex, colIndex, styles, save = true) {
    if (save) styleRegistry.cells[`${rowIndex}-${colIndex}`] = styles;
    const rows = document.querySelectorAll('#table-container tbody tr');
    const row = rows[rowIndex];
    if (row) {
        const cell = row.cells[colIndex];
        if (cell) {
            applyStylesToElement(cell, styles);
        }
    }
};
window.setCellStyle.temp = function (rowIndex, colIndex, save = true) {
    if (save) styleRegistry.temps.push({ type: 'cell', rowIndex: rowIndex, colIndex: colIndex });
    const rows = document.querySelectorAll('#table-container tbody tr');
    const row = rows[rowIndex];
    if (row) {
        const cell = row.cells[colIndex];
        if (cell) applyTempStyle(cell);
    }
};

/**
 * Set style for both header rows
 */
window.setHeaderStyle = function (styles, save = true) {
    if (save) styleRegistry.headers.push(styles);
    const headerRows = document.querySelectorAll('#table-container thead tr');
    headerRows.forEach(row => {
        applyStylesToElement(row, styles);
        // Also apply to cells within the row if needed, as tr styles might not apply to th background
        Array.from(row.cells).forEach(cell => applyStylesToElement(cell, styles));
    });
};
window.setHeaderStyle.temp = function (save = true) {
    if (save) styleRegistry.temps.push({ type: 'header' });
    const cells = document.querySelectorAll('#table-container thead th');
    cells.forEach(cell => applyTempStyle(cell));
};

/**
 * Clear all registered styles and re-render
 */
window.clearStyles = function () {
    styleRegistry = {
        headers: [], rows: {}, allRows: null,
        cols: {}, allCols: null, cells: {}, temps: []
    };
    renderTable();
};