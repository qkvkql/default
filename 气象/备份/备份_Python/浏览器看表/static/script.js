let globalExcelData = {};
let currentSheetName = "";
let currentTableRows = [];
let currentHeaders = [];
let sortDirection = {};
let activeMode = null;
let activeKey = null;

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

    let html = `
        <div style='padding:10px; font-weight:bold; color:#555;'>
            Found ${currentTableRows.length} rows
        </div>
        <table><thead><tr>`;

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