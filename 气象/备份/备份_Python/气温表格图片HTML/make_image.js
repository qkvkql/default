import { array_of_stations_by_different_filters } from './stations_data.js';

const myDesiredColumns = ["cn_name", "min", "max", "avg", "latitude", "elev"];
const base_title = '冷极大PK';
const myDesiredCN_names = ['地点', '最低气温', '最高气温', '平均气温', '纬度', '海拔']
const defaultNameColor = '#7785ac';
const countryColors = [{'country':'蒙古','hexCode':'#4cc9f0'},{'country':'俄罗斯','hexCode':'#aaf683'},{'country':'中国','hexCode':'#ffffff'}]
const temperatureRange = [-110, 60];
const extremeColors = {'dark': '#0000cc', 'bright': '#ffff00'};
const th_ev = [-55, 0, 35]; //给极值数值上色时，对应的颜色亮暗分界气温

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
    const mySortBys = [
        { key: 'east_asia',   order: 'desc' },  // 先判断是否是东亚站点
        { key: 'settlement', order: 'desc' }, // 再判断是否是定居点
    ];
    let whichSource = multiAttributeSortSafe(array_of_stations_by_different_filters[sourceKey], mySortBys); //sort一定要在data前面，先排序，再保留固定列，后面whichsource还有用
    const data = replaceAttributeNames( selectColumns(my_toFixed(whichSource), myDesiredColumns), myDesiredCN_names );
    
    // Clear existing content
    headerRow.innerHTML = '';
    tableBody.innerHTML = '';
    
    // --- NEW CODE START: FIX COLUMN WIDTHS ---
    const colGroup = document.getElementById('table-colgroup');
    colGroup.innerHTML = ''; // Clear previous widths

    // Define your desired widths here. 
    // You have 6 columns. Total should be 100%.
    // Based on your CSS, you wanted cols 2,3,4 to be 20%.
    const columnWidths = [
        "26%", // 1. Name
        "17%", // 2. Min (User CSS wanted 20%)
        "17%", // 3. Max (User CSS wanted 20%)
        "17%", // 4. Avg (User CSS wanted 20%)
        "11%", // 5. Lat
        "12%"  // 6. Elev
    ];

    columnWidths.forEach(width => {
        const col = document.createElement('col');
        col.style.width = width;
        colGroup.appendChild(col);
    });
    // --- NEW CODE END ---

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No Data</td></tr>';
        return;
    }

    // Set Date 北京时间
    dateCell.innerText = getCurrentDateByOffset(8);

    // Get Columns from first row
    const columns = Object.keys(data[0]);

    // Adjust Title Row colspan to span the whole table minus the date cells
    titleCell.colSpan = Math.max(1, columns.length - 2);
    titleCell.innerHTML = `${base_title}<span style="color: #e0aaff">(${sourceKey})</span>`;

    // --- RENDER HEADERS ---
    columns.forEach(colName => {
        const th = document.createElement('th');
        if( colName === myDesiredCN_names[1] || colName === myDesiredCN_names[2] || colName === myDesiredCN_names[3] ){
            th.innerText = colName + '℃';
        }else{
            th.innerText = colName;
        }
        headerRow.appendChild(th);
    });

    // --- 数值填色 ---
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.innerText = row[col];
            // Add class for styling (optional, but requested)
            if(col === myDesiredCN_names[1] || col === myDesiredCN_names[2] || col === myDesiredCN_names[3]){
                if(row[col] != "" && Number(row[col]) > temperatureRange[0] && Number(row[col]) < temperatureRange[1]){
                    setTemperatureStyle(td, row[col]);
                }
            }

            td.classList.add(`col-${col}`);
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });

    //地名填色,文字替换
    let tbody = document.querySelector('#table-body').querySelectorAll('tr');
    for(let i=0; i<tbody.length; i++){
        let tempE = tbody[i].querySelectorAll('td')[0];
        let tempE_Coor = tbody[i].querySelectorAll('td')[4];
        let tempE_elev = tbody[i].querySelectorAll('td')[5];
        tempE.innerHTML = wrapIcons(whichSource[i]['icon1']) + tempE.innerText + wrapIcons(whichSource[i]['icon2']);
        tempE_Coor.innerText = transformCoor(tempE_Coor.innerText);
        tempE_elev.innerText = tempE_elev.innerText + 'm';
    }
    for(let i=0; i<tbody.length; i++){
        let tempE = tbody[i].querySelectorAll('td')[0];

        if(whichSource[i]['country'] == countryColors[0]['country']){tempE.style.color = countryColors[0]['hexCode'];}
        else if(whichSource[i]['country'] == countryColors[1]['country']){tempE.style.color = countryColors[1]['hexCode'];}
        else if(whichSource[i]['country'] == countryColors[2]['country']){tempE.style.color = countryColors[2]['hexCode'];}
        else{tempE.style.color = defaultNameColor;}
    }

    // --- NEW CODE START: RESIZE FONTS ---
    // We select all TD elements we just created and check their fit
    const allTds = document.querySelectorAll('#table-body td');
    
    allTds.forEach(td => {
        // Only resize if the cell actually has text
        if(td.innerText.trim() !== "") {
            fitTextToCell(td);
        }
    });
    // --- NEW CODE END ---

    let ea1 = [], ea2 = [], ea3 = [], o1 = [], o2 = [], o3 = [];
    whichSource.forEach(o => {
        if(o['min'] !== ''){
            if(o['min'] > temperatureRange[0] && o['min'] < temperatureRange[1]){
                if(o['east_asia'] !== ''){ ea1.push(o['min']) }else{ o1.push(o['min']) }
            }
        }
        if(o['max'] !== ''){
            if(o['max'] > temperatureRange[0] && o['max'] < temperatureRange[1]){
                if(o['east_asia'] !== ''){ ea2.push(o['max']) }else{ o2.push(o['max']) }
            }
        }
        if(o['avg'] !== ''){
            if(o['avg'] > temperatureRange[0] && o['avg'] < temperatureRange[1]){
                if(o['east_asia'] !== ''){ ea3.push(o['avg']) }else{ o3.push(o['avg']) }
            }
        }
    });
    let ea1x = Math.min(...ea1);
    let ea1y = Math.max(...ea1);
    let ea2x = Math.min(...ea2);
    let ea2y = Math.max(...ea2);
    let ea3x = Math.min(...ea3);
    let ea3y = Math.max(...ea3);
    let o1x = Math.min(...o1);
    let o1y = Math.max(...o1);
    let o2x = Math.min(...o2);
    let o2y = Math.max(...o2);
    let o3x = Math.min(...o3);
    let o3y = Math.max(...o3);
    
    for(let i=0; i<tbody.length; i++){
        let td = tbody[i].querySelectorAll('td');
        if(whichSource[i]['east_asia'] !== ''){
            if(td[1].innerText !== ''){ if( Number(td[1].innerText.trim()) === ea1x || Number(td[1].innerText.trim()) === ea1y ){ setExtremeColor(td[1], th_ev); } }
            if(td[2].innerText !== ''){ if( Number(td[2].innerText.trim()) === ea2x || Number(td[2].innerText.trim()) === ea2y ){ setExtremeColor(td[2], th_ev); } }
            if(td[3].innerText !== ''){ if( Number(td[3].innerText.trim()) === ea3x || Number(td[3].innerText.trim()) === ea3y ){ setExtremeColor(td[3], th_ev); } }
        }else{
            if(td[1].innerText !== ''){ if( Number(td[1].innerText.trim()) === o1x || Number(td[1].innerText.trim()) === o1y ){ setExtremeColor(td[1], th_ev); } }
            if(td[2].innerText !== ''){ if( Number(td[2].innerText.trim()) === o2x || Number(td[2].innerText.trim()) === o2y ){ setExtremeColor(td[2], th_ev); } }
            if(td[3].innerText !== ''){ if( Number(td[3].innerText.trim()) === o3x || Number(td[3].innerText.trim()) === o3y ){ setExtremeColor(td[3], th_ev); } }
        }
    }
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

function my_toFixed(arrOfObj){
    arrOfObj.forEach((o) => {
        if(o['min'] !== ''){o['min'] = o['min'].toFixed(1);}
        if(o['max'] !== ''){o['max'] = o['max'].toFixed(1);}
        if(o['avg'] !== ''){o['avg'] = o['avg'].toFixed(2);}
        if(o['latitude'] !== ''){o['latitude'] = o['latitude'].toFixed(2);}
        if(o['elev'] !== ''){o['elev'] = o['elev'].toFixed(0);}
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
    // 1. Get the current font size defined in CSS (e.g., 42px)
    const style = window.getComputedStyle(td);
    const currentSize = parseFloat(style.fontSize);
    
    // 2. Measure widths
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
        td.style.fontSize = Math.max(12, newSize) + "px";
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

function setExtremeColor(ele, arr){
    let v = Number(ele.innerText.trim());
    if( v <= arr[0] || (v > arr[1] && v < arr[2]) ){
        ele.style.color = extremeColors['dark'];
    }
    if( (v > arr[0] && v <= arr[1]) || v >= arr[2] ){
        ele.style.color = extremeColors['bright'];
    }
}

function transformCoor(nStr){
    let p = Number(nStr) >= 0 ? 'N' : 'S';
    return (Math.abs(Number(nStr)).toFixed(2)).toString() + ' °' + p;
}

function wrapIcons(str){
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