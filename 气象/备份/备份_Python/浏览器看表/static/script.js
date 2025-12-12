let globalExcelData = {}; 
let currentSheetName = "";
let currentTableRows = []; 
let currentHeaders = [];
let sortDirection = {}; 

// 1. Load Predefined File
async function loadPredefined(key) {
    showLoading();
    try {
        const response = await fetch('/get_predefined', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key })
        });
        
        if (!response.ok) throw new Error("Server error (Check Python Terminal for details)");
        
        const data = await response.json();
        handleResponse(data);
    } catch (error) {
        showError(error.message);
    }
}

// 2. Upload Manual File
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return alert("Please select a file.");

    showLoading();
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/upload_file', { method: 'POST', body: formData });
        
        if (!response.ok) throw new Error("Server error (Check Python Terminal for details)");

        const data = await response.json();
        handleResponse(data);
    } catch (error) {
        showError(error.message);
    }
}

// 3. Handle Data & Sheet Logic
function handleResponse(data) {
    if (!data.success) {
        showError(data.error);
        return;
    }

    globalExcelData = data.data;
    const sheetNames = data.sheets;

    const sheetSelect = document.getElementById('sheetSelect');
    const sheetControl = document.getElementById('sheet-control');
    
    // Populate sheet selector
    sheetSelect.innerHTML = ""; 
    sheetNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        sheetSelect.appendChild(option);
    });

    // Handle visibility and default selection
    if (sheetNames.length > 0) {
        if(sheetControl) sheetControl.style.display = "block";
        currentSheetName = sheetNames[0];
        loadSheet(currentSheetName);
    } else {
        if(sheetControl) sheetControl.style.display = "none";
        showError("File contains no readable sheets.");
    }
}

function switchSheet() {
    currentSheetName = document.getElementById('sheetSelect').value;
    loadSheet(currentSheetName);
}

function loadSheet(sheetName) {
    // Reset sort state for new sheet
    sortDirection = {}; 
    const sheetData = globalExcelData[sheetName];
    
    currentHeaders = sheetData.headers;
    // create a fresh copy of rows
    currentTableRows = JSON.parse(JSON.stringify(sheetData.rows)); 
    
    renderTable();
}

// 4. Rendering
function renderTable() {
    const container = document.getElementById('table-container');
    
    if (currentTableRows.length === 0) {
        container.innerHTML = "<p class='placeholder'>Sheet is empty.</p>";
        return;
    }

    let html = '<table><thead><tr>';
    
    currentHeaders.forEach((header, index) => {
        const dir = sortDirection[index] ? sortDirection[index] : '';
        // Add arrow indicators via CSS class
        html += `<th class="${dir}" onclick="sortTable(${index})">${header}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    currentTableRows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// 5. Sorting Logic
function sortTable(columnIndex) {
    const currentDir = sortDirection[columnIndex] === 'asc' ? 'desc' : 'asc';
    sortDirection = {}; // Clear other columns
    sortDirection[columnIndex] = currentDir;

    currentTableRows.sort((a, b) => {
        let valA = a[columnIndex];
        let valB = b[columnIndex];

        // --- Helper: Check for "Empty" ---
        const cleanA = (valA === null || valA === undefined) ? "" : String(valA).trim();
        const cleanB = (valB === null || valB === undefined) ? "" : String(valB).trim();
        const isEmptyA = cleanA === "";
        const isEmptyB = cleanB === "";

        // 1. Empty Always Bottom
        if (isEmptyA && isEmptyB) return 0;
        if (isEmptyA) return 1; 
        if (isEmptyB) return -1;

        // --- Helper: Check for Numbers ---
        // We use parseFloat but check isFinite to avoid strict string issues
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const isNumA = !isNaN(numA) && isFinite(valA) && cleanA !== "";
        const isNumB = !isNaN(numB) && isFinite(valB) && cleanB !== "";

        // 2. Numbers Always Top (Above Text)
        if (isNumA && !isNumB) return -1; 
        if (!isNumA && isNumB) return 1;

        // 3. Standard Comparison
        if (isNumA && isNumB) {
            // Compare as numbers
            return currentDir === 'asc' ? numA - numB : numB - numA;
        } else {
            // Compare as strings (Case insensitive)
            // Note: Dates (YYYY-MM-DD) are strings, so they sort correctly here
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            
            if (strA < strB) return currentDir === 'asc' ? -1 : 1;
            if (strA > strB) return currentDir === 'asc' ? 1 : -1;
            return 0;
        }
    });

    renderTable();
}

// Helper UI functions
function showLoading() {
    document.getElementById('table-container').innerHTML = "<p class='placeholder'>Loading data...</p>";
}

function showError(msg) {
    document.getElementById('table-container').innerHTML = `<p class="error-msg" style="color:red; font-weight:bold;">Error: ${msg}</p>`;
}