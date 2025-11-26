import { array_of_stations_by_different_filters } from './stations_data.js';

const myDesiredColumns = ["cn_name", "min", "max", "avg", "latitude", "elev"];

// DOM Elements
const sourceSelect = document.getElementById('data-source');
const btnLoad = document.getElementById('btn-load');
const tableBody = document.getElementById('table-body');
const headerRow = document.getElementById('column-headers');
const titleCell = document.getElementById('title-cell');
const dateCell = document.getElementById('date-cell');

// --- 1. INITIALIZE DROPDOWN ---
Object.keys(array_of_stations_by_different_filters).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.innerText = key;
    sourceSelect.appendChild(option);
});

// Load the first dataset by default on startup
window.onload = () => {
    loadDataToTable(sourceSelect.value);
};

// --- 2. LOAD DATA LOGIC ---
btnLoad.addEventListener('click', () => {
    loadDataToTable(sourceSelect.value);
});

function loadDataToTable(sourceKey) {
    const data = selectColumns(array_of_stations_by_different_filters[sourceKey], myDesiredColumns);
    
    // Clear existing content
    headerRow.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No Data</td></tr>';
        return;
    }

    // Set Date
    dateCell.innerText = `Date: ${new Date().toLocaleDateString()} (${sourceKey})`;

    // Get Columns from first row
    const columns = Object.keys(data[0]);

    // Adjust Title Row colspan to span the whole table minus the date cells
    titleCell.colSpan = Math.max(1, columns.length - 2);

    // --- RENDER HEADERS ---
    // We calculate an explicit pixel width so the browser doesn't fight the JS resizing
    const initialWidth = Math.floor(2400 / columns.length);

    columns.forEach(colName => {
        const th = document.createElement('th');
        th.innerText = colName;
        th.style.width = `${initialWidth}px`; // Explicit width is key for resizing
        
        // Add Resizer Handle
        const resizer = document.createElement('div');
        resizer.classList.add('resizer');
        th.appendChild(resizer);
        
        // Add Resize Logic
        attachResizeEvent(th, resizer);

        headerRow.appendChild(th);
    });

    // --- RENDER ROWS ---
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.innerText = row[col];
            // Add class for styling (optional, but requested)
            td.classList.add(`col-${col}`); 
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// --- 3. RESIZE FUNCTION (Improved) ---
function attachResizeEvent(th, resizer) {
    // Variables to track state
    let startX = 0;
    let startWidth = 0;

    const onMouseDown = (e) => {
        e.preventDefault(); // Prevent text selection
        resizer.classList.add('resizing');
        
        startX = e.pageX;
        startWidth = th.offsetWidth;

        // Attach listeners to DOCUMENT, not the element.
        // This ensures dragging continues even if mouse leaves the header area.
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        // Calculate movement
        const currentX = e.pageX;
        const diffX = currentX - startX;
        
        // Apply new width
        // We use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            th.style.width = `${startWidth + diffX}px`;
        });
    };

    const onMouseUp = () => {
        resizer.classList.remove('resizing');
        // Clean up listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);
}

// --- 4. EXPORT IMAGE LOGIC ---
document.getElementById('btn-export').addEventListener('click', () => {
    const tableEl = document.getElementById('data-table');
    
    // Calculate full scroll width to ensure we capture hidden parts
    const fullWidth = tableEl.scrollWidth;
    const fullHeight = tableEl.scrollHeight;

    html2canvas(tableEl, {
        scale: 2, // High resolution
        backgroundColor: "#000000",
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth // Hint to browser to render full width
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Report_${sourceSelect.value}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
});

/**
 * Creates a new array containing only the specified columns.
 * @param {Array} data - The original list of dictionary objects.
 * @param {Array} columnsToKeep - An array of strings representing keys to keep.
 * @returns {Array} - The new filtered list.
 */
function selectColumns(data, columnsToKeep) {
    return data.map(record => {
        // Create a new empty object for this row
        const newRecord = {};

        // Loop through the columns we want to keep
        columnsToKeep.forEach(colName => {
            // Check if the original record actually has this column to avoid errors
            if (colName in record) {
                newRecord[colName] = record[colName];
            }
        });

        return newRecord;
    });
}