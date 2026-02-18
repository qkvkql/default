import { array_of_stations_by_different_filters } from './stations_data.js';

const base_title = '冷极大PK';
const defaultNameColor = '#7785ac';
const countryColors = [{ 'country': '蒙古', 'hexCode': '#4cc9f0' }, { 'country': '俄罗斯', 'hexCode': '#aaf683' }, { 'country': '中国', 'hexCode': '#ffffff' }];
const temperatureRange = [-110, 60];
const extremeColors = { 'dark': '#0000cc', 'bright': '#ffff00' };
const th_ev = [-55, 0, 35]; //给极值数值上色时，对应的颜色亮暗分界气温

// --- 1. CONFIGURATIONS ---
const versions = {
    classic: {
        columns: ["icon1", "cn_name", "min", "max", "avg", "latitude", "elev"],
        headers: ['🌏', '地点', '最低气温', '最高气温', '平均气温', '纬度', '海拔'],
        widths: [5, 24, 17, 17, 17, 10, 10]
    },
    stereotype: {
        columns: ["icon1", "cn_name", "min", "max", "avg", "stereotype"],
        headers: ['🌏', '地点', '最低气温', '最高气温', '平均气温', '🪪'],
        widths: [5, 24, 17, 17, 17, 20]
    }
};

let currentVersion = 'stereotype';
let currentWidths = [...versions[currentVersion].widths];

// DOM Elements
const sourceSelect = document.getElementById('data-source');
const btnLoad = document.getElementById('btn-load');
const tableBody = document.getElementById('table-body');
const headerRow = document.getElementById('column-headers');
const titleCell = document.getElementById('title-cell');
const dateCell = document.getElementById('date-cell');
const widthInputsContainer = document.getElementById('width-inputs-container');
const btnSubmitWidths = document.getElementById('btn-submit-widths');
const widthErrorMsg = document.getElementById('width-error-msg');
const versionRadios = document.getElementsByName('table-version');
const dateInput = document.getElementById('date-input');
const controlsWrapper = document.getElementById('controls-wrapper');
const controlsToggle = document.getElementById('controls-toggle');

// --- 2. INITIALIZE DROPDOWN ---
Object.keys(array_of_stations_by_different_filters).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.innerText = key;
    sourceSelect.appendChild(option);
});

// Version Toggle Logic
versionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentVersion = e.target.value;
        currentWidths = [...versions[currentVersion].widths];
        renderWidthInputs();
        loadDataToTable(sourceSelect.value);
    });
});

// Width Submission Logic
btnSubmitWidths.addEventListener('click', () => {
    const inputs = widthInputsContainer.querySelectorAll('input');
    const newWidths = Array.from(inputs).map(input => parseFloat(input.value) || 0);
    const sum = newWidths.reduce((a, b) => a + b, 0);

    if (Math.abs(sum - 100) > 0.01) {
        widthErrorMsg.innerText = `总宽度需为100% (当前: ${sum.toFixed(1)}%)`;
    } else {
        widthErrorMsg.innerText = '';
        currentWidths = newWidths;
        loadDataToTable(sourceSelect.value);
    }
});

function renderWidthInputs() {
    widthInputsContainer.innerHTML = '';
    const config = versions[currentVersion];
    config.headers.forEach((header, index) => {
        const div = document.createElement('div');
        div.className = 'width-input-item';
        div.innerHTML = `
            <span>${header}</span>
            <input type="number" step="0.1" value="${currentWidths[index]}">
        `;
        widthInputsContainer.appendChild(div);
    });
}

// select 标签 value 发生变化时就立刻 加载数据，无需点击确定
sourceSelect.addEventListener('change', () => {
    loadDataToTable(sourceSelect.value);
});

dateInput.addEventListener('change', () => {
    loadDataToTable(sourceSelect.value);
});

// Load the first dataset by default on startup
window.onload = () => {
    dateInput.value = getCurrentDateByOffset(8);
    renderWidthInputs();
    loadDataToTable(sourceSelect.value);
};

// --- 3. LOAD DATA LOGIC ---
btnLoad.addEventListener('click', () => {
    loadDataToTable(sourceSelect.value);
});

// Collapsible Logic
controlsToggle.addEventListener('click', () => {
    controlsWrapper.classList.toggle('collapsed');
    const isCollapsed = controlsWrapper.classList.contains('collapsed');
    controlsToggle.querySelector('.toggle-text').innerText = isCollapsed ? '展开控制面板' : '收起控制面板';
});

function loadDataToTable(sourceKey) {
    const mySortBys = [
        { key: 'east_asia', order: 'desc' },
        { key: 'settlement', order: 'desc' },
    ];

    let originalData = array_of_stations_by_different_filters[sourceKey];
    let deepCopyData = JSON.parse(JSON.stringify(originalData));

    let whichSource = multiAttributeSortSafe(deepCopyData, mySortBys);

    const config = versions[currentVersion];
    const data = replaceAttributeNames(
        selectColumns(my_toFixed(whichSource), config.columns),
        config.headers
    );

    // Clear existing content
    headerRow.innerHTML = '';
    tableBody.innerHTML = '';

    const colGroup = document.getElementById('table-colgroup');
    colGroup.innerHTML = '';

    currentWidths.forEach(width => {
        const col = document.createElement('col');
        col.style.width = width + '%';
        colGroup.appendChild(col);
    });

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${config.columns.length}">No Data</td></tr>`;
        return;
    }

    // Set Date from input
    dateCell.innerText = dateInput.value;

    const columns = Object.keys(data[0]);

    // Adjust Header Row colspans: title spans 5, date spans the rest
    titleCell.colSpan = 5;
    dateCell.colSpan = columns.length - 5;
    titleCell.innerHTML = base_title;

    // --- RENDER HEADERS ---
    columns.forEach(colName => {
        const th = document.createElement('th');
        th.classList.add(`col-${colName}`);
        if (['最低气温', '最高气温', '平均气温'].includes(colName)) {
            th.innerText = colName + '℃';
        } else {
            th.innerText = colName;
        }
        headerRow.appendChild(th);
    });

    // --- 数值填色 ---
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach((col, index) => {
            const td = document.createElement('td');
            td.innerText = row[col];

            if (['最低气温', '最高气温', '平均气温'].includes(col)) {
                if (row[col] != "" && Number(row[col]) > temperatureRange[0] && Number(row[col]) < temperatureRange[1]) {
                    setTemperatureStyle(td, row[col]);
                }
            }

            td.classList.add(`col-${col}`);
            if (index === 1) {
                td.classList.add('data-td');
                if (sourceSelect.value === '明星站') {
                    td.classList.add('star-height');
                    tr.classList.add('star-row');
                }
            }
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });

    // 地名、辅助数据填色及文字替换
    let tbodyRows = tableBody.querySelectorAll('tr');
    for (let i = 0; i < tbodyRows.length; i++) {
        let tds = tbodyRows[i].querySelectorAll('td');
        let iconTd = tds[0];
        let nameTd = tds[1];

        // Icon column
        iconTd.innerHTML = wrapIcons(whichSource[i]['icon1'] || '');
        iconTd.style.textAlign = 'center';
        iconTd.style.padding = '0';

        // Name styling
        const isStar = sourceSelect.value === '明星站';
        const isSummary = sourceSelect.value === '汇总';

        const prefix = whichSource[i]['prefix'];
        const cnName = whichSource[i]['cn_name'];
        // Rule 1: Icon visibility - hide for Star, show otherwise
        const icon2 = isStar ? '' : wrapIcons(whichSource[i]['icon2']);

        // Use a flex container to allow name text wrapping while keeping icons right-aligned
        nameTd.innerHTML = `
            <div class="name-container">
                <span class="name-text">${cnName}</span>
                <span class="name-icons">${icon2}</span>
            </div>
        `;

        if (isStar) {
            nameTd.style.fontSize = '72px';
            nameTd.style.fontFamily = 'stkaiti';
        }

        // Special column handling based on version
        if (currentVersion === 'classic') {
            let latTd = tds[5];
            let elevTd = tds[6];
            latTd.innerText = transformCoor(latTd.innerText);
            elevTd.innerText = elevTd.innerText === '' ? '' : elevTd.innerText + 'm';
        } else {
            // stereotype column
            let stereotypeTd = tds[5];
            stereotypeTd.innerHTML = `
                <div>${whichSource[i]['stereotype']}</div>
            `;
        }

        // Country colors
        const country = whichSource[i]['country'];
        const matchedColor = countryColors.find(c => c.country === country);
        nameTd.style.color = matchedColor ? matchedColor.hexCode : defaultNameColor;
    }

    // Resizing fonts
    const allTds = tableBody.querySelectorAll('td');
    allTds.forEach(td => {
        if (td.innerText.trim() !== "") {
            fitTextToCell(td);
        }
    });

    // Extreme highlighting
    highlightExtremes(whichSource, tbodyRows);
}

function highlightExtremes(whichSource, tbodyRows) {
    let ea = { min: [], max: [], avg: [] };
    let other = { min: [], max: [], avg: [] };

    whichSource.forEach(o => {
        ['min', 'max', 'avg'].forEach(key => {
            if (o[key] !== '' && o[key] > temperatureRange[0] && o[key] < temperatureRange[1]) {
                (o['east_asia'] !== '' ? ea : other)[key].push(o[key]);
            }
        });
    });

    const getExtremes = (arr) => ({ min: Math.min(...arr), max: Math.max(...arr) });
    const eaExt = { min: getExtremes(ea.min), max: getExtremes(ea.max), avg: getExtremes(ea.avg) };
    const oExt = { min: getExtremes(other.min), max: getExtremes(other.max), avg: getExtremes(other.avg) };

    for (let i = 0; i < tbodyRows.length; i++) {
        let tds = tbodyRows[i].querySelectorAll('td');
        const isEA = whichSource[i]['east_asia'] !== '';
        const ext = isEA ? eaExt : oExt;

        [2, 3, 4].forEach(idx => { // Indices for 'min', 'max', 'avg' after 'icon1' and 'cn_name'
            let val = Number(tds[idx].innerText.trim());
            if (!isNaN(val) && tds[idx].innerText !== '') {
                const key = idx === 2 ? 'min' : (idx === 3 ? 'max' : 'avg');
                if (val === ext[key].min || val === ext[key].max) {
                    setExtremeColor(tds[idx], th_ev);
                }
            }
        });
    }
}

// --- 4. EXPORT IMAGE LOGIC ---
/*
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
*/

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

function my_toFixed(arrOfObj) {
    arrOfObj.forEach((o) => {
        if (o['min'] !== '') { o['min'] = o['min'].toFixed(1); }
        if (o['max'] !== '') { o['max'] = o['max'].toFixed(1); }
        if (o['avg'] !== '') { o['avg'] = o['avg'].toFixed(2); }
        if (o['latitude'] !== '') { o['latitude'] = o['latitude'].toFixed(2); }
        if (o['elev'] !== '') { o['elev'] = o['elev'].toFixed(0); }
    });
    return arrOfObj;
}

function replaceAttributeNames(dataArray, newNames) {
    return dataArray.map(obj => {
        const values = Object.values(obj);
        const oldKeys = Object.keys(obj);
        const newObj = {};

        oldKeys.forEach((key, index) => {
            const newKey = newNames[index] || key;
            newObj[newKey] = values[index];
        });

        return newObj;
    });
}

/**
 * Returns the current date in "YYYY-MM-DD" format for a specific timezone offset.
 * @param {number} offset - The timezone offset in hours (e.g., -5 for EST, 1 for CET).
 */
function getCurrentDateByOffset(offset) {
    const now = new Date();
    const targetTime = now.getTime() + (offset * 60 * 60 * 1000);
    const targetDate = new Date(targetTime);
    const year = targetDate.getUTCFullYear();
    const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-11
    const day = String(targetDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Sets the background and font color of a table cell based on temperature.
 * @param {HTMLElement} tdElement - The table cell element (td).
 * @param {number|string} tempValue - The temperature value.
 */
function setTemperatureStyle(tdElement, tempValue) {
    /* 1. Validation: Ignore empty strings or null/undefined
    if (tempValue === "" || tempValue === null || tempValue === undefined) {
      return;
    }
    */

    const val = Number(tempValue);

    /* 2. Validation: Ignore non-numbers
    if (isNaN(val)) {
      return;
    }
    */

    // 3. Validation: Ignore values outside range (-90, 60)
    // (Assuming strict exclusion of -90 and 60 based on prompt phrasing)
    if (val <= -90 || val >= 60) {
        return;
    }

    // --- TASK 1: Set Background Color ---
    let bgColor = "";

    if (val <= -75) {
        bgColor = "#ffffff";
    } else if (val >= 54) {
        bgColor = "#000000";
    } else if (val > 0 && val < 1) {
        // Special gap case defined in prompt
        bgColor = "#6dcfea";
    } else if (val <= 0) {
        // NEGATIVE RANGE & ZERO (> -75 and <= 0)
        // Logic: The prompt follows a pattern where the hex corresponds to the Ceiling of the value.
        // Example: > -75 and <= -74 (Ceil -74) -> Index 0
        // Example: > -1 and <= 0 (Ceil 0) -> Last Index

        const negHexList = [
            "#fff4f9", "#fee9f3", "#fedfed", "#fdd4e7", "#fdc9e1", // -74 to -70
            "#fdbedb", "#fcb3d5", "#fca8ce", "#fb9dc8", "#fb92c2", // -69 to -65
            "#fb87bc", "#fa7cb6", "#fa72b0", "#f967aa", "#f95ca4", // -64 to -60
            "#f9519e", "#f84698", "#f83b91", "#f7308b", "#f72585", // -59 to -55
            "#f02488", "#ea228a", "#e3218d", "#dd1f8f", "#d61e92", // -54 to -50
            "#cf1d94", "#c91b97", "#c21a99", "#bc189c", "#b5179e", // -49 to -45
            "#ae16a1", "#a814a3", "#a113a6", "#9b11a8", "#9410ab", // -44 to -40
            "#8d0fad", "#860db0", "#800cb2", "#790ab5", "#7209b7", // -39 to -35
            "#6c09b5", "#670ab3", "#610ab1", "#5c0baf", "#560bad", // -34 to -30
            "#530bac", "#500bab", "#4e0caa", "#4b0ca9", "#480ca8", // -29 to -25
            "#450ca7", "#420ca6", "#400ca5", "#3d0ca4", "#3a0ca3", // -24 to -20
            "#3b15ab", "#3c1db2", "#3d26ba", "#3e2ec1", "#3f37c9", // -19 to -15
            "#403fd0", "#4148d8", "#4150df", "#4259e7", "#4361ee", // -14 to -10
            "#446bee", "#4576ee", "#4680ef", "#478bef", "#4895ef", // -9  to -5
            "#499fef", "#4aaaef", "#4ab4f0", "#4bbff0", "#4cc9f0"  // -4  to 0
        ];

        // Calculate index: -74 maps to 0. 0 maps to 74.
        const index = Math.ceil(val) + 74;
        // Safety check to ensure we pick a color if valid
        if (index >= 0 && index < negHexList.length) {
            bgColor = negHexList[index];
        }

    } else {
        // POSITIVE RANGE (>= 1 and < 54)
        // Logic: The prompt follows a pattern where the hex corresponds to the Floor of the value.
        // Example: >= 1 and < 2 (Floor 1) -> Index 0

        const posHexList = [
            "#8fd6e4", "#b0dcdd", "#d2e3d7", "#f3e9d1", "#f0e5c8", // 1 to 5
            "#eee0bf", "#ebdcb5", "#e9d7ac", "#e6d3a3", "#e3d39a", // 6 to 10
            "#e0d290", "#ded287", "#dbd17d", "#d8d174", "#d1ce6e", // 11 to 15
            "#cacc67", "#c4c961", "#bdc75a", "#b6c454", "#aebe44", // 16 to 20
            "#a6b834", "#9eb224", "#96ac14", "#8ea604", "#a3aa03", // 21 to 25
            "#b7ae02", "#ccb302", "#e0b701", "#f5bb00", "#efab01", // 26 to 30
            "#e99b01", "#e38a02", "#dd7a02", "#d76a03", "#d25f02", // 31 to 35
            "#cd5302", "#c94801", "#c43c01", "#bf3100", "#ae2b03", // 36 to 40
            "#9d2506", "#8b2008", "#7a1a0b", "#69140e", "#601410", // 41 to 45
            "#571412", "#4e1514", "#451516", "#3c1518", "#301113", // 46 to 50
            "#240d0e", "#18080a", "#0c0405"                        // 51 to 53
        ];

        // Calculate index: 1 maps to 0. 53 maps to 52.
        const index = Math.floor(val) - 1;
        if (index >= 0 && index < posHexList.length) {
            bgColor = posHexList[index];
        }
    }

    // Apply Background
    if (bgColor) tdElement.style.backgroundColor = bgColor;


    // --- TASK 2: Set Font Color ---
    // Condition for Black Text: val <= -55 OR (-5 < val < 35)
    // Condition for White Text: (-55 < val <= -5) OR val >= 35

    let fontColor = "";
    if (val <= -55 || (val > -5 && val < 35)) {
        fontColor = "#000000";
    } else {
        fontColor = "#ffffff";
    }

    // Apply Font Color
    tdElement.style.color = fontColor;
}

/**
 * Auto-shrinks font size to fit text within the cell width.
 * Must be called AFTER the table is rendered in the DOM.
 */
function fitTextToCell(td) {
    const isSummary = sourceSelect.value === '汇总';
    const nameTextSpan = td.querySelector('.name-text');

    // Rule 2: Fitting method - Wrap for Summary, Resize for others (including Star)
    if (td.classList.contains('col-地点') && isSummary) {
        return;
    }

    // Target either the span (for names) or the td (for others)
    const targetElement = nameTextSpan || td;
    const style = window.getComputedStyle(targetElement);
    const currentSize = parseFloat(style.fontSize);

    // scrollWidth = The total length of the text (including hidden overflow)
    // clientWidth = The visible width of the cell
    const contentWidth = td.scrollWidth;
    const visibleWidth = td.clientWidth;

    // 3. If text is wider than the cell, calculate new size
    if (contentWidth > visibleWidth) {
        // Calculate the ratio (e.g., if text is 200px and cell is 100px, ratio is 0.5)
        const ratio = visibleWidth / contentWidth;

        // Multiply: Current Size * Ratio * Buffer (0.9 to leave a little breathing room)
        const newSize = currentSize * ratio * 0.90;

        // Apply new size, but don't let it get smaller than 12px (readability)
        targetElement.style.fontSize = Math.max(12, newSize) + "px";
    }
}

function multiAttributeSortSafe(data, criteria) {
    return [...data].sort((a, b) => {
        for (const { key, order } of criteria) {
            const valA = a[key];
            const valB = b[key];
            const direction = order === 'desc' ? -1 : 1;

            // Handle String Comparison (Case Insensitive)
            if (typeof valA === 'string' && typeof valB === 'string') {
                const compareResult = valA.localeCompare(valB);
                if (compareResult !== 0) {
                    return compareResult * direction;
                }
            }
            // Handle Numbers / Booleans
            else {
                if (valA < valB) return -1 * direction;
                if (valA > valB) return 1 * direction;
            }
        }
        return 0;
    });
}

function setExtremeColor(ele, arr) {
    let v = Number(ele.innerText.trim());
    if (v <= arr[0] || (v > arr[1] && v < arr[2])) {
        ele.style.color = extremeColors['dark'];
    }
    if ((v > arr[0] && v <= arr[1]) || v >= arr[2]) {
        ele.style.color = extremeColors['bright'];
    }
}

function transformCoor(nStr) {
    if (nStr === '') {
        return '';
    }
    let p = Number(nStr) >= 0 ? 'N' : 'S';
    return (Math.abs(Number(nStr)).toFixed(2)).toString() + ' °' + p;
}

function wrapIcons(str) {
    let result = '';
    result = str.replace('💎', '<span class="icon-diamond" style="font-size: 28px">💎</span>')
        .replace('▼', '<span style="color: #f72585; font-size: 24px">▼</span>')
        .replace('▲', '<span style="color: #f72585; font-size: 24px">▲</span>')
        .replace('🧊', '<span class="ice-cube" style="font-size: 16px">🧊</span>')
        .replace('⚡', '<span class="icon-lightning" style="font-size: 20px">⚡</span>')
        .replace('↓', '<span style="color: #f72585; font-size: 20px">↓</span>')
        .replace('❄️', '<span style="font-size: 16px">❄️</span>')
        .replace('♦️', '<span class="icon-lightning" style="font-size: 28px">⚡</span>')
        .replace('🔵', '<span class="ice-cube" style="font-size: 24px">🧊</span>')
    return result;
}