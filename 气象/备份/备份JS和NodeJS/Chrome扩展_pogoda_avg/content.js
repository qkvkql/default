// Ensure we run 1 second after window load
window.addEventListener('load', () => {
    setTimeout(() => {
        initExtension();
    }, 1000);
});

let latestAverageValues = [];
let currentDataArr = [];
let currentStartYear = 1991;
let currentYearsContinue = 30;
let currentHemisphere = 'north';
let seasonalStatsCache = null;

function detectDefaultHemisphere() {
    const coords = extractCoordinates();
    if (coords && typeof coords.lat === 'number') {
        return coords.lat < 0 ? 'south' : 'north';
    }
    return 'north';
}

function initExtension() {
    createUI();
    currentHemisphere = detectDefaultHemisphere();
    // Automatically run once with defaults (1991, 30)
    runUserLogic(1991, 30);
}

// -----------------------------------------------------------
// YOUR CUSTOM LOGIC GOES HERE
// -----------------------------------------------------------

function extractCoordinates() {
    // Look inside .chronicle-info for lat/lon text
    const infoEl = document.querySelector('.chronicle-info');
    if (!infoEl) return null;
    const text = infoEl.innerText || infoEl.textContent || '';

    // PRIMARY: Russian station info format
    // "широта 53.0749 долгота 132.9506 высота над уровнем моря 540 м."
    // широта = latitude, долгота = longitude
    const ruMatch = text.match(/широта\s+([+-]?\d+(?:[.,]\d+)?)\s+долгота\s+([+-]?\d+(?:[.,]\d+)?)/i);
    if (ruMatch) {
        const lat = parseFloat(ruMatch[1].replace(',', '.'));
        const lon = parseFloat(ruMatch[2].replace(',', '.'));
        return { lat, lon };
    }

    // FALLBACK 1: degree notation  44.8678°N  110.117°E
    const latMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*°?\s*([NS])/i);
    const lonMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*°?\s*([EW])/i);
    if (latMatch && lonMatch) {
        let lat = parseFloat(latMatch[1]);
        let lon = parseFloat(lonMatch[1]);
        if (/S/i.test(latMatch[2])) lat = -lat;
        if (/W/i.test(lonMatch[2])) lon = -lon;
        return { lat, lon };
    }

    // FALLBACK 2: two plain decimals separated by comma/space
    const plain = text.match(/([+-]?\d{1,3}\.\d+)[\s,]+([+-]?\d{1,3}\.\d+)/);
    if (plain) return { lat: parseFloat(plain[1]), lon: parseFloat(plain[2]) };

    return null;
}

function extractStationMeta() {
    // Station name: last <li> text inside .bread-crumbs ul
    let stationName = null;
    const breadcrumbUl = document.querySelector('.bread-crumbs ul');
    if (breadcrumbUl) {
        const lis = breadcrumbUl.querySelectorAll('li');
        if (lis.length > 0) {
            stationName = lis[lis.length - 1].innerText.trim();
        }
    }

    // Elevation: "высота над уровнем моря NNN м"
    let elevation = null;
    const infoEl = document.querySelector('.chronicle-info');
    if (infoEl) {
        const text = infoEl.innerText || infoEl.textContent || '';
        const elevMatch = text.match(/высота\s+над\s+уровнем\s+моря\s+([\d.]+)/i);
        if (elevMatch) {
            elevation = elevMatch[1];
        }
    }

    return { stationName, elevation };
}

function showCoordinateBar() {
    // Remove any existing bar
    const existing = document.getElementById('coord-bar');
    if (existing) existing.remove();

    const coords = extractCoordinates();
    const meta = extractStationMeta();
    const container = document.getElementById('weather-content-area');

    const bar = document.createElement('div');
    bar.id = 'coord-bar';

    if (!coords) {
        bar.className = 'coord-bar coord-bar--missing';
        bar.innerHTML = `<span class="coord-label">📍 Coordinates not found in chronicle-info</span>`;
    } else {
        const latStr = coords.lat.toString();
        const lonStr = coords.lon.toString();
        const copyValue = `${latStr}\t${lonStr}`;

        const nameHtml = meta.stationName
            ? `<span class="coord-station-name">${meta.stationName}</span>`
            : '';
        const elevHtml = meta.elevation
            ? `<span class="coord-elevation" title="Elevation (m)">▲ ${meta.elevation} м</span>`
            : '';

        bar.className = 'coord-bar';
        bar.innerHTML = `
            <span class="coord-label">📍</span>
            ${nameHtml}
            <button class="coord-copy-btn" id="coord-copy-btn" title="Copy as lat TAB lon" data-copy="${copyValue}">
                📋 Copy lat⇥lon
            </button>
            ${elevHtml}
            <span class="coord-chip">
                <span class="coord-part coord-lat" title="Latitude">${latStr}</span>
                <span class="coord-sep">⇥</span>
                <span class="coord-part coord-lon" title="Longitude">${lonStr}</span>
            </span>
        `;
    }
    // Insert as first child of content area
    container.insertBefore(bar, container.firstChild);

    if (coords) {
        document.getElementById('coord-copy-btn').addEventListener('click', (e) => {
            const val = e.currentTarget.dataset.copy;
            copyText(val);
        });
    }
}

function runUserLogic(startYear, years_continue) {
    // 1. CLEAR previous results
    document.getElementById('weather-content-area').innerHTML = '';
    displayOutput(`Running analysis with: StartYear=${startYear}, Threshold=${years_continue}`, 'log');

    // !!! PASTE YOUR JAVASCRIPT CODE BELOW THIS LINE !!!
    // Use the variables 'startYear' and 'years_continue' in your logic.
    // Use displayOutput(text, 'log') for console.log
    // Use displayOutput(array, 'table') for console.table
    const start = startYear;
    const year_continue = years_continue;
    const columns = ['年份', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月', '全年'];
    let data_arr = [];
    let stat_obj = {};
    stat_obj['YM'] = {};
    let summary_arr = [];

    let trs_left = document.getElementsByClassName("chronicle-table-left-column")[0].getElementsByTagName('tr');
    for(let i=1; i<trs_left.length; i++){ //添加年份记录
        let tempObj = {};
        tempObj[columns[0]] = trs_left[i].getElementsByTagName('td')[0].innerText.trim();
        data_arr.push(tempObj);
    }

    let trs_right = document.getElementsByClassName("chronicle-table")[0].getElementsByTagName('tr');
    for(let i=1; i<trs_right.length; i++){
        let tds_row = trs_right[i].getElementsByTagName('td');
        for(let j=0; j<tds_row.length; j++){
            const cellText = tds_row[j].innerText.trim();
            data_arr[i-1][columns[j+1]] = cellText === '' ? NaN : Number(cellText);
        }
    }

    for(let i=0; i<columns.length - 1; i++){
        stat_obj[columns[i+1]] = {};
        stat_obj[columns[i+1]]['obj'] = {};
        stat_obj[columns[i+1]]['obj_climate'] = {};
    }

    for(let i=0; i<data_arr.length; i++){
        let row = data_arr[i];
        for(let j=1; j<columns.length; j++){
            let tempV = row[columns[j]];
            if(isValidValue(tempV)){
                stat_obj[columns[j]]['obj'][row[columns[0]]] = tempV;
                if(row[columns[0]] >= start && row[columns[0]] < start + year_continue){
                    stat_obj[columns[j]]['obj_climate'][row[columns[0]]] = tempV;
                }
            }
        }
    }

    for(let i=1; i<columns.length; i++){
        //each month case
        let tempO = stat_obj[columns[i]];
        k1 = Object.keys(tempO['obj']);
        v1 = Object.values(tempO['obj']);
        k2 = Object.keys(tempO['obj_climate']);
        v2 = Object.values(tempO['obj_climate']);
        tempO['total'] = v1.length;
        tempO['total_climate'] = v2.length;
        tempO['min'] = Math.min(...v1);
        tempO['min_climate'] = Math.min(...v2);
        tempO['max'] = Math.max(...v1);
        tempO['max_climate'] = Math.max(...v2);
        tempO['avg'] = getAvg(v1);
        tempO['avg_climate'] = getAvg(v2);
        tempO['min_years'] = getYearV(tempO['obj'], k1, tempO['min']);
        tempO['min_climate_years'] = getYearV(tempO['obj_climate'], k2, tempO['min_climate']);
        tempO['max_years'] = getYearV(tempO['obj'], k1, tempO['max']);
        tempO['max_climate_years'] = getYearV(tempO['obj_climate'], k2, tempO['max_climate']);
    }

    function get_YM_stat(obj){
        let tempn = 999;
        let tempx = -999;
        let tempn_c = 999;
        let tempx_c = -999;
        let an = [];
        let ax = [];
        let an_c = [];
        let ax_c = [];
        for(let i = 1; i < columns.length - 1; i++){
            let tempO = obj[columns[i]];
            if(tempO['min'] < tempn){
                tempn = tempO['min'];
            }
            if(tempO['max'] > tempx){
                tempx = tempO['max'];
            }
            if(tempO['min_climate'] < tempn_c){
                tempn_c = tempO['min_climate'];
            }
            if(tempO['max_climate'] > tempx_c){
                tempx_c = tempO['max_climate'];
            }
        }
        for(let i=1; i<columns.length - 1; i++){
            let tempO = obj[columns[i]];
            if(tempO['min'] === tempn){
                let tempA = tempO['min_years'];
                let newA = [];
                for(let j=0; j<tempA.length; j++){
                    newA.push({'Y': tempA[j], 'M': columns[i]});
                }
                an = an.concat(newA);
            }
            if(tempO['max'] === tempx){
                let tempA = tempO['max_years'];
                let newA = [];
                for(let j=0; j<tempA.length; j++){
                    newA.push({'Y': tempA[j], 'M': columns[i]});
                }
                ax = ax.concat(newA);
            }
            if(tempO['min_climate'] === tempn_c){
                let tempA = tempO['min_climate_years'];
                let newA = [];
                for(let j=0; j<tempA.length; j++){
                    newA.push({'Y': tempA[j], 'M': columns[i]});
                }
                an_c = an_c.concat(newA);
            }
            if(tempO['max_climate'] === tempx_c){
                let tempA = tempO['max_climate_years'];
                let newA = [];
                for(let j=0; j<tempA.length; j++){
                    newA.push({'Y': tempA[j], 'M': columns[i]});
                }
                ax_c = ax_c.concat(newA);
            }
        }

        return {
            'min': tempn,
            'min_YM': an,
            'max': tempx,
            'max_YM': ax,
            'min_climate': tempn_c,
            'min_climate_YM': an_c,
            'max_climate': tempx_c,
            'max_climate_YM': ax_c
        }
    }
    stat_obj['YM'] = get_YM_stat(stat_obj);

    function isValidValue(v){
        if(v === '' || v === null || v === undefined) return false;
        const n = Number(v);
        if(isNaN(n) || n > 70 || n < -110){
            return false;
        }else{
            return true;
        }
    }
    function getAvg(arr){
        let sum = 0;
        for(let i=0; i<arr.length; i++){
            sum += arr[i];
        }
        return arr.length === 0 ? 'undefined' : (sum/arr.length).toFixed(5);
    }
    function getYearV(o, ka, v){
        let ra = [];
        for(let i=0; i<ka.length; i++){
            if(o[ka[i]] === v){
                ra.push(ka[i]);
            }
        }
        return ra;
    }
    function getYMAT(arr){
        let str = '';
        for(let i=0; i<arr.length; i++){
            if(i < arr.length - 1){
                str += arr[i]['Y'] + '年' + arr[i]['M'] + ', ';
            }else{
                str += arr[i]['Y'] + '年' + arr[i]['M'];
            }
        }
        return str;
    }
    function getArrText(arr){
        let str = '';
        for(let i=0; i<arr.length; i++){
            if(i < arr.length - 1){
                str += arr[i].toString() + ', ';
            }else{
                str += arr[i].toString();
            }
        }
        return str;
    }

    for(let i=1; i<columns.length; i++){
        let tempO = {};
        tempO['月份'] = columns[i];
        tempO[start.toString() + '~' + (start+year_continue-1).toString() + '均温'] = stat_obj[columns[i]]['avg_climate'];
        tempO['样本/总体'] = stat_obj[columns[i]]['total_climate'] + '/' + year_continue.toString();
        summary_arr.push(tempO);
    }
    latestAverageValues = summary_arr.map(row => {
        const avgKey = Object.keys(row).find(key => key.includes('均温'));
        return avgKey ? row[avgKey] : '';
    });

    showCoordinateBar();
    displayOutput(stat_obj, 'log');
    displayOutput(summary_arr, 'table');
    let tempR = '\n极端冷月平均气温: ' + stat_obj['YM']['min'].toString() + ' ( ' + getYMAT(stat_obj['YM']['min_YM']) +' )\n\n极端热月平均气温: '
        + stat_obj['YM']['max'].toString() + ' ( ' + getYMAT(stat_obj['YM']['max_YM']) + ' )\n\n极端冷年平均: '
        + stat_obj[columns[columns.length - 1]]['min'].toString() + ' ( ' + getArrText(stat_obj[columns[columns.length - 1]]['min_years'])
        + ' )\n\n极端热年平均: ' + stat_obj[columns[columns.length - 1]]['max'].toString() + ' ( '
        + getArrText(stat_obj[columns[columns.length - 1]]['max_years']) + ' )\n\n';
    displayOutput(tempR, 'log');

    // Render in-period (climate baseline) extreme stats
    let tempR_c = '\n【' + start.toString() + '~' + (start + year_continue - 1).toString() + ' 周期内极端统计】\n\n'
        + '极端冷月平均气温: ' + stat_obj['YM']['min_climate'].toString() + ' ( ' + getYMAT(stat_obj['YM']['min_climate_YM']) + ' )\n\n极端热月平均气温: '
        + stat_obj['YM']['max_climate'].toString() + ' ( ' + getYMAT(stat_obj['YM']['max_climate_YM']) + ' )\n\n极端冷年平均: '
        + stat_obj[columns[columns.length - 1]]['min_climate'].toString() + ' ( ' + getArrText(stat_obj[columns[columns.length - 1]]['min_climate_years'])
        + ' )\n\n极端热年平均: ' + stat_obj[columns[columns.length - 1]]['max_climate'].toString() + ' ( '
        + getArrText(stat_obj[columns[columns.length - 1]]['max_climate_years']) + ' )\n\n';
    displayOutput(tempR_c, 'log');

    // Calculate and render seasonal 3-month winter and summer average temperatures at the end of the panel
    renderSeasonalSection(data_arr, startYear, years_continue);

    // Render sortable copy version of the monthly and annual average chronicle table at the end of the panel
    renderSortableMonthlySection(data_arr);
    /*
    console.log(stat_obj);
    console.table(summary_arr);
    console.log(
        '\n极端冷月平均气温: ' + stat_obj['YM']['min'].toString() + ' ( ' + getYMAT(stat_obj['YM']['min_YM']) +' )\n\n极端热月平均气温: '
        + stat_obj['YM']['max'].toString() + ' ( ' + getYMAT(stat_obj['YM']['max_YM']) + ' )\n\n极端冷年平均: '
        + stat_obj[columns[columns.length - 1]]['min'].toString() + ' ( ' + getArrText(stat_obj[columns[columns.length - 1]]['min_years'])
        + ' )\n\n极端热年平均: ' + stat_obj[columns[columns.length - 1]]['max'].toString() + ' ( '
        + getArrText(stat_obj[columns[columns.length - 1]]['max_years']) + ' )\n\n'
    );
    */
}

// -----------------------------------------------------------
// UI & HELPER FUNCTIONS
// -----------------------------------------------------------

const REGEX_TEMP = /\d{4}|-?\d{1,3}(?:\.\d{1,5})?/g;
//const REGEX_TEMP = /-?\d{1,2}(\.\d{1,2})?/g;
//const REGEX_TEMP = /-?\d{1,2}\.?\d{1,2}/g; //错误的regexp

function displayOutput(data, type) {
    const container = document.getElementById('weather-content-area');
    
    if (type === 'log') {
        const div = document.createElement('div');
        div.className = 'weather-log';
        div.innerHTML = processTextForCopying(String(data));
        container.appendChild(div);
    } 
    else if (type === 'table' && Array.isArray(data) && data.length > 0) {
        const table = document.createElement('table');
        table.className = 'weather-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const keys = Object.keys(data[0]);
        keys.forEach(key => {
            const th = document.createElement('th');
            th.innerText = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            keys.forEach(key => {
                const td = document.createElement('td');
                const isAverageColumn = key.includes('均温') || key.includes('鍧囨俯');
                td.innerHTML = isAverageColumn ? formatAverageForCopying(row[key]) : processTextForCopying(String(row[key]));
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }
}

function processTextForCopying(text) {
    return text.replace(REGEX_TEMP, (match) => {
        return `<span class="temp-value" title="Click to copy">${match}</span>`;
    });
}

function formatAverageForCopying(value) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return `<span class="temp-missing">-</span>`;
    }
    const text = String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    const parts = text.split('.');
    const intPart = parts[0];
    const fracPart = parts[1] || '';
    const dotClass = fracPart ? 'avg-dot' : 'avg-dot avg-dot-hidden';

    return `<span class="temp-value temp-average" title="Click to copy" data-copy-value="${text}"><span class="avg-int">${intPart}</span><span class="${dotClass}">.</span><span class="avg-frac">${fracPart}</span></span>`;
}

// -----------------------------------------------------------
// SEASONAL (WINTER & SUMMER) 3-MONTH AVERAGE LOGIC
// -----------------------------------------------------------

function isSeasonValidValue(v) {
    if (v === '' || v === null || v === undefined) return false;
    const n = Number(v);
    if (isNaN(n) || n > 70 || n < -110) {
        return false;
    }
    return true;
}

function calculateSeasonalStats(data_arr, startYear, years_continue, hemisphere = 'north') {
    const yearMap = new Map();
    data_arr.forEach(row => {
        const y = parseInt(row['年份'], 10);
        if (!isNaN(y)) {
            yearMap.set(y, row);
        }
    });

    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
    const results = [];
    const isNorth = hemisphere === 'north';

    sortedYears.forEach(y => {
        const currRow = yearMap.get(y);
        const prevRow = yearMap.get(y - 1);

        // 12 of prev year, 1 and 2 of curr year
        const dec12 = prevRow ? prevRow['十二月'] : undefined;
        const jan1 = currRow ? currRow['一月'] : undefined;
        const feb2 = currRow ? currRow['二月'] : undefined;

        // 6, 7, 8 of curr year
        const jun6 = currRow ? currRow['六月'] : undefined;
        const jul7 = currRow ? currRow['七月'] : undefined;
        const aug8 = currRow ? currRow['八月'] : undefined;

        // Period 1 (12, 1, 2): Winter in North, Summer in South
        const p1Valid = isSeasonValidValue(dec12) && isSeasonValidValue(jan1) && isSeasonValidValue(feb2);
        const p1Avg = p1Valid ? ((dec12 + jan1 + feb2) / 3) : null;
        const p1Period = `${y - 1}-${y}`;
        const p1Detail = {
            m12: isSeasonValidValue(dec12) ? dec12 : null,
            m1: isSeasonValidValue(jan1) ? jan1 : null,
            m2: isSeasonValidValue(feb2) ? feb2 : null
        };

        // Period 2 (6, 7, 8): Summer in North, Winter in South
        const p2Valid = isSeasonValidValue(jun6) && isSeasonValidValue(jul7) && isSeasonValidValue(aug8);
        const p2Avg = p2Valid ? ((jun6 + jul7 + aug8) / 3) : null;
        const p2Period = `${y}`;
        const p2Detail = {
            m6: isSeasonValidValue(jun6) ? jun6 : null,
            m7: isSeasonValidValue(jul7) ? jul7 : null,
            m8: isSeasonValidValue(aug8) ? aug8 : null
        };

        const winterPeriod = isNorth ? p1Period : p2Period;
        const winterAvg = isNorth ? p1Avg : p2Avg;
        const winterDetail = isNorth ? p1Detail : p2Detail;

        const summerPeriod = isNorth ? p2Period : p1Period;
        const summerAvg = isNorth ? p2Avg : p1Avg;
        const summerDetail = isNorth ? p2Detail : p1Detail;

        results.push({
            year: y,
            winterPeriod,
            winterAvg: winterAvg !== null ? Number(winterAvg.toFixed(2)) : null,
            winterAvgRaw: winterAvg,
            winterDetail,
            summerPeriod,
            summerAvg: summerAvg !== null ? Number(summerAvg.toFixed(2)) : null,
            summerAvgRaw: summerAvg,
            summerDetail
        });
    });

    const validWinters = results.filter(r => r.winterAvg !== null);
    const validSummers = results.filter(r => r.summerAvg !== null);

    let minWinter = null;
    let maxWinter = null;
    if (validWinters.length > 0) {
        const minWVal = Math.min(...validWinters.map(r => r.winterAvg));
        const maxWVal = Math.max(...validWinters.map(r => r.winterAvg));
        minWinter = {
            value: minWVal,
            records: validWinters.filter(r => r.winterAvg === minWVal)
        };
        maxWinter = {
            value: maxWVal,
            records: validWinters.filter(r => r.winterAvg === maxWVal)
        };
    }

    let minSummer = null;
    let maxSummer = null;
    if (validSummers.length > 0) {
        const minSVal = Math.min(...validSummers.map(r => r.summerAvg));
        const maxSVal = Math.max(...validSummers.map(r => r.summerAvg));
        minSummer = {
            value: minSVal,
            records: validSummers.filter(r => r.summerAvg === minSVal)
        };
        maxSummer = {
            value: maxSVal,
            records: validSummers.filter(r => r.summerAvg === maxSVal)
        };
    }

    const endYear = startYear + years_continue - 1;
    const climateWinters = validWinters.filter(r => r.year >= startYear && r.year <= endYear);
    const climateSummers = validSummers.filter(r => r.year >= startYear && r.year <= endYear);

    const climateWinterAvg = climateWinters.length > 0
        ? Number((climateWinters.reduce((acc, r) => acc + r.winterAvgRaw, 0) / climateWinters.length).toFixed(2))
        : null;
    const climateSummerAvg = climateSummers.length > 0
        ? Number((climateSummers.reduce((acc, r) => acc + r.summerAvgRaw, 0) / climateSummers.length).toFixed(2))
        : null;

    let minClimateWinter = null;
    let maxClimateWinter = null;
    if (climateWinters.length > 0) {
        const minCWVal = Math.min(...climateWinters.map(r => r.winterAvg));
        const maxCWVal = Math.max(...climateWinters.map(r => r.winterAvg));
        minClimateWinter = { value: minCWVal, records: climateWinters.filter(r => r.winterAvg === minCWVal) };
        maxClimateWinter = { value: maxCWVal, records: climateWinters.filter(r => r.winterAvg === maxCWVal) };
    }

    let minClimateSummer = null;
    let maxClimateSummer = null;
    if (climateSummers.length > 0) {
        const minCSVal = Math.min(...climateSummers.map(r => r.summerAvg));
        const maxCSVal = Math.max(...climateSummers.map(r => r.summerAvg));
        minClimateSummer = { value: minCSVal, records: climateSummers.filter(r => r.summerAvg === minCSVal) };
        maxClimateSummer = { value: maxCSVal, records: climateSummers.filter(r => r.summerAvg === maxCSVal) };
    }

    return {
        hemisphere,
        results,
        stats: {
            totalYears: results.length,
            validWinterCount: validWinters.length,
            validSummerCount: validSummers.length,
            minWinter,
            maxWinter,
            minSummer,
            maxSummer,
            baseline: {
                startYear,
                endYear,
                winterCount: climateWinters.length,
                summerCount: climateSummers.length,
                winterAvg: climateWinterAvg,
                summerAvg: climateSummerAvg,
                minWinter: minClimateWinter,
                maxWinter: maxClimateWinter,
                minSummer: minClimateSummer,
                maxSummer: maxClimateSummer
            }
        }
    };
}

function renderSeasonalSection(data_arr, startYear, years_continue) {
    const container = document.getElementById('weather-content-area');
    if (!container) return;

    // Remove existing seasonal section if present
    const oldSection = document.getElementById('weather-seasonal-section');
    if (oldSection) oldSection.remove();

    currentDataArr = data_arr;
    currentStartYear = startYear;
    currentYearsContinue = years_continue;

    const seasonalData = calculateSeasonalStats(data_arr, startYear, years_continue, currentHemisphere);
    seasonalStatsCache = seasonalData;

    const { hemisphere, results, stats } = seasonalData;
    const isNorth = hemisphere === 'north';

    const section = document.createElement('div');
    section.id = 'weather-seasonal-section';
    section.className = 'weather-seasonal-section';

    function formatExtremeHtml(extremeObj, periodProp) {
        if (!extremeObj) return '<span class="temp-missing">-</span>';
        const yearsStr = extremeObj.records.map(r => r[periodProp] || r.year).join(', ');
        return `${formatAverageForCopying(extremeObj.value)} <span class="stat-sub">(${yearsStr})</span>`;
    }

    const minWinterHtml = formatExtremeHtml(stats.minWinter, 'winterPeriod');
    const maxWinterHtml = formatExtremeHtml(stats.maxWinter, 'winterPeriod');
    const minSummerHtml = formatExtremeHtml(stats.minSummer, 'summerPeriod');
    const maxSummerHtml = formatExtremeHtml(stats.maxSummer, 'summerPeriod');

    section.innerHTML = `
        <div class="seasonal-header">
            <div class="seasonal-title-wrap">
                <h3 class="seasonal-title">❄️ 冬季与 ☀️ 夏季三月均温统计 (Seasonal Averages)</h3>
                <span class="seasonal-subtitle">各年连续3个月均温统计 (以 ${isNorth ? '北半球' : '南半球'} 季节定义: 冬季 ${isNorth ? '跨年 12-2月' : '6-8月'}，夏季 ${isNorth ? '6-8月' : '跨年 12-2月'})</span>
            </div>

            <div class="seasonal-toolbar">
                <div class="seasonal-hemi-group" title="根据台站纬度自动识别，可点击手动切换">
                    <span class="seasonal-bar-label">半球定义:</span>
                    <button type="button" class="seasonal-pill-btn ${isNorth ? 'active' : ''}" id="seasonal-btn-north">
                        北半球
                    </button>
                    <button type="button" class="seasonal-pill-btn ${!isNorth ? 'active' : ''}" id="seasonal-btn-south">
                        南半球
                    </button>
                </div>

                <div class="seasonal-actions">
                    <button class="seasonal-action-btn" id="btn-copy-winter-avg" title="复制: 年份 TAB 冬季跨年 TAB 冬季均温">
                        📋 复制冬季均温
                    </button>
                    <button class="seasonal-action-btn" id="btn-copy-summer-avg" title="复制: 年份 TAB 夏季时段 TAB 夏季均温">
                        📋 复制夏季均温
                    </button>
                    <button class="seasonal-action-btn" id="btn-copy-seasonal-tsv" title="复制完整季节表格数据为 TSV 格式">
                        📋 复制完整表格(TSV)
                    </button>
                </div>
            </div>
        </div>

        <div class="seasonal-summary-grid">
            <div class="seasonal-card seasonal-card-winter">
                <div class="seasonal-card-header">
                    <span class="seasonal-card-icon">❄️</span>
                    <span class="seasonal-card-title">冬季概况 (${isNorth ? '跨年 12-2月' : '6-8月'})</span>
                    <span class="seasonal-card-count">${stats.validWinterCount} / ${stats.totalYears} 个有效冬季</span>
                </div>
                <div class="seasonal-card-body">
                    <div class="seasonal-stat-row">
                        <span class="stat-label">基准期均温 (${stats.baseline.startYear}~${stats.baseline.endYear}):</span>
                        <span class="stat-value winter-text">${stats.baseline.winterAvg !== null ? formatAverageForCopying(stats.baseline.winterAvg) : '-'}</span>
                        <span class="stat-sub">(${stats.baseline.winterCount}/${years_continue} 年样本)</span>
                    </div>
                    <div class="seasonal-stat-row">
                        <span class="stat-label">历史最冷冬季:</span>
                        <span class="stat-value winter-text">${minWinterHtml}</span>
                    </div>
                    <div class="seasonal-stat-row">
                        <span class="stat-label">历史最暖冬季:</span>
                        <span class="stat-value winter-text">${maxWinterHtml}</span>
                    </div>
                </div>
            </div>

            <div class="seasonal-card seasonal-card-summer">
                <div class="seasonal-card-header">
                    <span class="seasonal-card-icon">☀️</span>
                    <span class="seasonal-card-title">夏季概况 (${isNorth ? '6-8月' : '跨年 12-2月'})</span>
                    <span class="seasonal-card-count">${stats.validSummerCount} / ${stats.totalYears} 个有效夏季</span>
                </div>
                <div class="seasonal-card-body">
                    <div class="seasonal-stat-row">
                        <span class="stat-label">基准期均温 (${stats.baseline.startYear}~${stats.baseline.endYear}):</span>
                        <span class="stat-value summer-text">${stats.baseline.summerAvg !== null ? formatAverageForCopying(stats.baseline.summerAvg) : '-'}</span>
                        <span class="stat-sub">(${stats.baseline.summerCount}/${years_continue} 年样本)</span>
                    </div>
                    <div class="seasonal-stat-row">
                        <span class="stat-label">历史最热夏季:</span>
                        <span class="stat-value summer-text">${maxSummerHtml}</span>
                    </div>
                    <div class="seasonal-stat-row">
                        <span class="stat-label">历史最凉夏季:</span>
                        <span class="stat-value summer-text">${minSummerHtml}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="seasonal-summary-grid seasonal-summary-grid--climate">
            <div class="seasonal-card seasonal-card-winter">
                <div class="seasonal-card-header">
                    <span class="seasonal-card-icon">❄️</span>
                    <span class="seasonal-card-title">周期内冬季概况 (${isNorth ? '跨年 12-2月' : '6-8月'})</span>
                    <span class="seasonal-card-count">${stats.baseline.winterCount} / ${years_continue} 年有效样本</span>
                </div>
                <div class="seasonal-card-body">
                    <div class="seasonal-stat-row">
                        <span class="stat-label">周期内最冷冬季:</span>
                        <span class="stat-value winter-text">${formatExtremeHtml(stats.baseline.minWinter, 'winterPeriod')}</span>
                    </div>
                    <div class="seasonal-stat-row">
                        <span class="stat-label">周期内最暖冬季:</span>
                        <span class="stat-value winter-text">${formatExtremeHtml(stats.baseline.maxWinter, 'winterPeriod')}</span>
                    </div>
                </div>
            </div>

            <div class="seasonal-card seasonal-card-summer">
                <div class="seasonal-card-header">
                    <span class="seasonal-card-icon">☀️</span>
                    <span class="seasonal-card-title">周期内夏季概况 (${isNorth ? '6-8月' : '跨年 12-2月'})</span>
                    <span class="seasonal-card-count">${stats.baseline.summerCount} / ${years_continue} 年有效样本</span>
                </div>
                <div class="seasonal-card-body">
                    <div class="seasonal-stat-row">
                        <span class="stat-label">周期内最热夏季:</span>
                        <span class="stat-value summer-text">${formatExtremeHtml(stats.baseline.maxSummer, 'summerPeriod')}</span>
                    </div>
                    <div class="seasonal-stat-row">
                        <span class="stat-label">周期内最凉夏季:</span>
                        <span class="stat-value summer-text">${formatExtremeHtml(stats.baseline.minSummer, 'summerPeriod')}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="seasonal-table-filter">
            <label for="seasonal-year-filter">🔍 快速筛选年份:</label>
            <input type="text" id="seasonal-year-filter" placeholder="输入年份，如 1969..." />
            <span class="seasonal-row-count" id="seasonal-row-count">共 ${results.length} 年记录</span>
        </div>

        <div class="seasonal-table-wrapper">
            <table class="weather-table seasonal-table" id="seasonal-data-table">
                <thead>
                    <tr>
                        <th class="sortable-th active-sort-th" data-sort="year" style="width: 80px;" title="点击按年份升序/降序排序">
                            年份 <span class="sort-indicator" id="seasonal-sort-year">▲</span>
                        </th>
                        <th style="width: 110px;">冬季跨年</th>
                        <th class="sortable-th" data-sort="winterAvg" style="width: 120px;" title="点击按冬季均温升序/降序排序">
                            冬季均温 <span class="sort-indicator" id="seasonal-sort-winterAvg">⇅</span>
                        </th>
                        <th>冬季各月明细</th>
                        <th style="width: 90px;">夏季时段</th>
                        <th class="sortable-th" data-sort="summerAvg" style="width: 120px;" title="点击按夏季均温升序/降序排序">
                            夏季均温 <span class="sort-indicator" id="seasonal-sort-summerAvg">⇅</span>
                        </th>
                        <th>夏季各月明细</th>
                    </tr>
                </thead>
                <tbody id="seasonal-table-body">
                </tbody>
            </table>
        </div>
    `;

    container.appendChild(section);

    function formatMonthVal(label, val) {
        if (val === null || val === undefined) {
            return `<span>${label}: <span class="temp-missing">欠测</span></span>`;
        }
        return `<span>${label}: <span class="temp-value" title="点击复制数值" data-copy-value="${val}">${val}</span></span>`;
    }

    function formatMonthText(label, val) {
        if (val === null || val === undefined) {
            return `${label} 欠测`;
        }
        return `${label} ${val}`;
    }

    function renderDetailCell(monthList) {
        const spansHtml = monthList.map(m => formatMonthVal(m.label, m.val)).join(' ');
        const textToCopy = monthList.map(m => formatMonthText(m.label, m.val)).join(';  ');
        return `<div class="season-detail-cell" title="双击可复制整行明细" data-detail-text="${textToCopy}"><div class="season-month-detail">${spansHtml}</div><button type="button" class="season-cell-copy-btn" title="点击复制此单元格明细: ${textToCopy}" data-copy-text="${textToCopy}" aria-label="复制各月明细"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div>`;
    }

    let seasonalSortField = 'year';
    let seasonalSortOrder = 'asc';

    function sortSeasonalResults(records, field, order) {
        return [...records].sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;
            if (valA === valB) return a.year - b.year;
            return order === 'asc' ? valA - valB : valB - valA;
        });
    }

    function updateSeasonalHeaderUI() {
        ['year', 'winterAvg', 'summerAvg'].forEach(f => {
            const th = section.querySelector(`th[data-sort="${f}"]`);
            const ind = section.querySelector(`#seasonal-sort-${f}`);
            if (!th || !ind) return;
            if (seasonalSortField === f) {
                th.classList.add('active-sort-th');
                ind.innerText = seasonalSortOrder === 'asc' ? '▲' : '▼';
            } else {
                th.classList.remove('active-sort-th');
                ind.innerText = '⇅';
            }
        });
    }

    function renderTableRows(filterText = '') {
        const tbody = document.getElementById('seasonal-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const filter = filterText.trim();
        let filtered = filter
            ? results.filter(r => String(r.year).includes(filter) || String(r.winterPeriod).includes(filter) || String(r.summerPeriod).includes(filter))
            : results;

        filtered = sortSeasonalResults(filtered, seasonalSortField, seasonalSortOrder);

        const countEl = document.getElementById('seasonal-row-count');
        if (countEl) {
            countEl.innerText = filter ? `匹配 ${filtered.length} / 共 ${results.length} 年记录` : `共 ${results.length} 年记录`;
        }

        filtered.forEach(r => {
            const tr = document.createElement('tr');

            let winterDetailHtml = '';
            let summerDetailHtml = '';

            if (isNorth) {
                winterDetailHtml = renderDetailCell([
                    { label: '12月', val: r.winterDetail.m12 },
                    { label: '1月', val: r.winterDetail.m1 },
                    { label: '2月', val: r.winterDetail.m2 }
                ]);
                summerDetailHtml = renderDetailCell([
                    { label: '6月', val: r.summerDetail.m6 },
                    { label: '7月', val: r.summerDetail.m7 },
                    { label: '8月', val: r.summerDetail.m8 }
                ]);
            } else {
                winterDetailHtml = renderDetailCell([
                    { label: '6月', val: r.winterDetail.m6 },
                    { label: '7月', val: r.winterDetail.m7 },
                    { label: '8月', val: r.winterDetail.m8 }
                ]);
                summerDetailHtml = renderDetailCell([
                    { label: '12月', val: r.summerDetail.m12 },
                    { label: '1月', val: r.summerDetail.m1 },
                    { label: '2月', val: r.summerDetail.m2 }
                ]);
            }

            const isYearSorted = seasonalSortField === 'year' ? 'sorted-cell' : '';
            const isWinterSorted = seasonalSortField === 'winterAvg' ? 'sorted-cell' : '';
            const isSummerSorted = seasonalSortField === 'summerAvg' ? 'sorted-cell' : '';

            tr.innerHTML = `
                <td class="${isYearSorted}"><strong>${r.year}</strong></td>
                <td><span class="coord-part">${r.winterPeriod}</span></td>
                <td class="${isWinterSorted}">${formatAverageForCopying(r.winterAvg)}</td>
                <td class="seasonal-detail-td">${winterDetailHtml}</td>
                <td><span class="coord-part">${r.summerPeriod}</span></td>
                <td class="${isSummerSorted}">${formatAverageForCopying(r.summerAvg)}</td>
                <td class="seasonal-detail-td">${summerDetailHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderTableRows();

    // Table Header Click Sorting for Seasonal Table
    section.querySelectorAll('#seasonal-data-table th.sortable-th').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (seasonalSortField === field) {
                seasonalSortOrder = seasonalSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                seasonalSortField = field;
                seasonalSortOrder = field === 'year' ? 'asc' : 'desc';
            }
            updateSeasonalHeaderUI();
            const currentFilter = document.getElementById('seasonal-year-filter') ? document.getElementById('seasonal-year-filter').value : '';
            renderTableRows(currentFilter);
        });
    });

    // Event Listeners for controls
    document.getElementById('seasonal-btn-north').addEventListener('click', () => {
        if (currentHemisphere !== 'north') {
            currentHemisphere = 'north';
            renderSeasonalSection(currentDataArr, currentStartYear, currentYearsContinue);
        }
    });

    document.getElementById('seasonal-btn-south').addEventListener('click', () => {
        if (currentHemisphere !== 'south') {
            currentHemisphere = 'south';
            renderSeasonalSection(currentDataArr, currentStartYear, currentYearsContinue);
        }
    });

    const filterInput = document.getElementById('seasonal-year-filter');
    if (filterInput) {
        filterInput.addEventListener('input', (e) => {
            renderTableRows(e.target.value);
        });
    }

    // Copy Handlers (Exporting current filtered and sorted rows)
    document.getElementById('btn-copy-winter-avg').addEventListener('click', () => {
        const currentFilter = document.getElementById('seasonal-year-filter') ? document.getElementById('seasonal-year-filter').value : '';
        let rows = currentFilter
            ? results.filter(r => String(r.year).includes(currentFilter.trim()) || String(r.winterPeriod).includes(currentFilter.trim()))
            : results;
        rows = sortSeasonalResults(rows, seasonalSortField, seasonalSortOrder).filter(r => r.winterAvg !== null);
        if (rows.length === 0) {
            showToast('没有有效冬季均温数据');
            return;
        }
        const text = ['年份\t冬季跨年\t冬季均温'].concat(
            rows.map(r => `${r.year}\t${r.winterPeriod}\t${r.winterAvg}`)
        ).join('\n');
        copyText(text);
    });

    document.getElementById('btn-copy-summer-avg').addEventListener('click', () => {
        const currentFilter = document.getElementById('seasonal-year-filter') ? document.getElementById('seasonal-year-filter').value : '';
        let rows = currentFilter
            ? results.filter(r => String(r.year).includes(currentFilter.trim()) || String(r.summerPeriod).includes(currentFilter.trim()))
            : results;
        rows = sortSeasonalResults(rows, seasonalSortField, seasonalSortOrder).filter(r => r.summerAvg !== null);
        if (rows.length === 0) {
            showToast('没有有效夏季均温数据');
            return;
        }
        const text = ['年份\t夏季时段\t夏季均温'].concat(
            rows.map(r => `${r.year}\t${r.summerPeriod}\t${r.summerAvg}`)
        ).join('\n');
        copyText(text);
    });

    document.getElementById('btn-copy-seasonal-tsv').addEventListener('click', () => {
        const currentFilter = document.getElementById('seasonal-year-filter') ? document.getElementById('seasonal-year-filter').value : '';
        let rows = currentFilter
            ? results.filter(r => String(r.year).includes(currentFilter.trim()) || String(r.winterPeriod).includes(currentFilter.trim()) || String(r.summerPeriod).includes(currentFilter.trim()))
            : results;
        rows = sortSeasonalResults(rows, seasonalSortField, seasonalSortOrder);
        const text = ['年份\t冬季跨年\t冬季均温\t夏季时段\t夏季均温'].concat(
            rows.map(r => `${r.year}\t${r.winterPeriod}\t${r.winterAvg !== null ? r.winterAvg : ''}\t${r.summerPeriod}\t${r.summerAvg !== null ? r.summerAvg : ''}`)
        ).join('\n');
        copyText(text);
    });
}

// -----------------------------------------------------------
// SORTABLE MONTHLY & ANNUAL HISTORY TABLE
// -----------------------------------------------------------

let monthlySortField = '年份';
let monthlySortOrder = 'asc';

function renderSortableMonthlySection(data_arr) {
    const container = document.getElementById('weather-content-area');
    if (!container) return;

    // Remove existing monthly section if present
    const oldSec = document.getElementById('weather-monthly-history-section');
    if (oldSec) oldSec.remove();

    const section = document.createElement('div');
    section.id = 'weather-monthly-history-section';
    section.className = 'weather-monthly-history-section';

    const monthCols = ['年份', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月', '全年'];

    section.innerHTML = `
        <div class="monthly-history-header">
            <div class="seasonal-title-wrap">
                <h3 class="seasonal-title">📊 站点全历史各月及年均温统计表 (可点击表头排序)</h3>
                <span class="seasonal-subtitle">包含站点建站以来的全部月份与年平均气温，点击任意列标题（1~12月、全年、年份）可按气温升序/降序排序</span>
            </div>

            <div class="monthly-history-toolbar">
                <span class="active-sort-badge" id="monthly-active-sort-badge">当前排序: 年份 (升序 ▲)</span>
                <button class="seasonal-action-btn" id="btn-copy-monthly-all-tsv" title="复制全站月均温表格 (TSV 格式，可直接粘贴进 Excel)">
                    📋 复制全站月均温表(TSV)
                </button>
                <button class="seasonal-action-btn" id="btn-copy-monthly-col-tsv" title="仅复制当前排序列的气温数据 (年份 TAB 该列气温)">
                    📋 复制当前排序列(TSV)
                </button>
                <button class="seasonal-action-btn" id="btn-reset-monthly-sort" title="恢复默认按年份自然先后顺序排序">
                    🔄 恢复年份排序
                </button>
            </div>
        </div>

        <div class="seasonal-table-filter">
            <label for="monthly-year-filter">🔍 快速筛选年份:</label>
            <input type="text" id="monthly-year-filter" placeholder="例如: 1969 或 20..." />
            <span class="seasonal-row-count" id="monthly-row-count">共 ${data_arr.length} 年记录</span>
        </div>

        <div class="monthly-table-wrapper">
            <table class="weather-table monthly-history-table" id="monthly-history-table">
                <thead>
                    <tr>
                        ${monthCols.map(col => {
                            const isSorted = monthlySortField === col;
                            const indicator = isSorted ? (monthlySortOrder === 'asc' ? '▲' : '▼') : '⇅';
                            const activeClass = isSorted ? 'active-sort-th' : '';
                            return `<th class="sortable-th ${activeClass}" data-col="${col}" title="点击按【${col}】排序">
                                ${col} <span class="sort-indicator" id="monthly-sort-ind-${col}">${indicator}</span>
                            </th>`;
                        }).join('')}
                    </tr>
                </thead>
                <tbody id="monthly-history-table-body">
                </tbody>
            </table>
        </div>
    `;

    container.appendChild(section);

    function sortMonthlyRecords(records, col, order) {
        return [...records].sort((a, b) => {
            if (col === '年份') {
                const yA = parseInt(a['年份'], 10) || 0;
                const yB = parseInt(b['年份'], 10) || 0;
                return order === 'asc' ? yA - yB : yB - yA;
            }
            const valA = a[col];
            const valB = b[col];
            const validA = isSeasonValidValue(valA);
            const validB = isSeasonValidValue(valB);

            if (!validA && !validB) return 0;
            if (!validA) return 1; // invalid/missing at bottom
            if (!validB) return -1;

            const numA = Number(valA);
            const numB = Number(valB);
            if (numA === numB) {
                return (parseInt(a['年份'], 10) || 0) - (parseInt(b['年份'], 10) || 0);
            }
            return order === 'asc' ? numA - numB : numB - numA;
        });
    }

    function updateMonthlyHeaderUI() {
        const badge = document.getElementById('monthly-active-sort-badge');
        if (badge) {
            badge.innerText = `当前排序: ${monthlySortField} (${monthlySortOrder === 'asc' ? '升序 ▲' : '降序 ▼'})`;
        }

        monthCols.forEach(col => {
            const th = section.querySelector(`th[data-col="${col}"]`);
            const ind = section.querySelector(`#monthly-sort-ind-${col}`);
            if (!th || !ind) return;
            if (monthlySortField === col) {
                th.classList.add('active-sort-th');
                ind.innerText = monthlySortOrder === 'asc' ? '▲' : '▼';
            } else {
                th.classList.remove('active-sort-th');
                ind.innerText = '⇅';
            }
        });
    }

    function renderMonthlyRows(filterText = '') {
        const tbody = document.getElementById('monthly-history-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const filter = filterText.trim();
        let filtered = filter
            ? data_arr.filter(r => String(r['年份']).includes(filter))
            : data_arr;

        filtered = sortMonthlyRecords(filtered, monthlySortField, monthlySortOrder);

        const countEl = document.getElementById('monthly-row-count');
        if (countEl) {
            countEl.innerText = filter ? `匹配 ${filtered.length} / 共 ${data_arr.length} 年记录` : `共 ${data_arr.length} 年记录`;
        }

        filtered.forEach(row => {
            const tr = document.createElement('tr');
            let trHtml = '';

            monthCols.forEach(col => {
                const isSortedCol = monthlySortField === col ? 'sorted-cell' : '';
                if (col === '年份') {
                    trHtml += `<td class="${isSortedCol}"><strong>${row['年份']}</strong></td>`;
                } else {
                    const val = row[col];
                    if (isSeasonValidValue(val)) {
                        trHtml += `<td class="${isSortedCol}">${formatAverageForCopying(val)}</td>`;
                    } else {
                        trHtml += `<td class="${isSortedCol}"><span class="temp-missing">-</span></td>`;
                    }
                }
            });

            tr.innerHTML = trHtml;
            tbody.appendChild(tr);
        });
    }

    renderMonthlyRows();

    // Header click sorting for all monthly table columns
    section.querySelectorAll('#monthly-history-table th.sortable-th').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (monthlySortField === col) {
                monthlySortOrder = monthlySortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                monthlySortField = col;
                monthlySortOrder = col === '年份' ? 'asc' : 'desc';
            }
            updateMonthlyHeaderUI();
            const currentFilter = document.getElementById('monthly-year-filter') ? document.getElementById('monthly-year-filter').value : '';
            renderMonthlyRows(currentFilter);
        });
    });

    // Year filter listener
    const filterInput = document.getElementById('monthly-year-filter');
    if (filterInput) {
        filterInput.addEventListener('input', (e) => {
            renderMonthlyRows(e.target.value);
        });
    }

    // Reset sort button
    const resetBtn = document.getElementById('btn-reset-monthly-sort');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            monthlySortField = '年份';
            monthlySortOrder = 'asc';
            updateMonthlyHeaderUI();
            const currentFilter = document.getElementById('monthly-year-filter') ? document.getElementById('monthly-year-filter').value : '';
            renderMonthlyRows(currentFilter);
        });
    }

    // Copy All Table TSV
    const copyAllBtn = document.getElementById('btn-copy-monthly-all-tsv');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
            const currentFilter = document.getElementById('monthly-year-filter') ? document.getElementById('monthly-year-filter').value : '';
            let rowsToCopy = currentFilter
                ? data_arr.filter(r => String(r['年份']).includes(currentFilter.trim()))
                : data_arr;
            rowsToCopy = sortMonthlyRecords(rowsToCopy, monthlySortField, monthlySortOrder);

            const headerLine = monthCols.join('\t');
            const dataLines = rowsToCopy.map(r => {
                return monthCols.map(c => {
                    const val = r[c];
                    return isSeasonValidValue(val) ? val : (c === '年份' ? val : '');
                }).join('\t');
            });
            copyText([headerLine, ...dataLines].join('\n'));
        });
    }

    // Copy Current Sorted Column TSV
    const copyColBtn = document.getElementById('btn-copy-monthly-col-tsv');
    if (copyColBtn) {
        copyColBtn.addEventListener('click', () => {
            const currentFilter = document.getElementById('monthly-year-filter') ? document.getElementById('monthly-year-filter').value : '';
            let rowsToCopy = currentFilter
                ? data_arr.filter(r => String(r['年份']).includes(currentFilter.trim()))
                : data_arr;
            rowsToCopy = sortMonthlyRecords(rowsToCopy, monthlySortField, monthlySortOrder);

            const headerLine = monthlySortField === '年份' ? '年份' : `年份\t${monthlySortField}`;
            const dataLines = rowsToCopy.map(r => {
                if (monthlySortField === '年份') {
                    return `${r['年份']}`;
                }
                const val = r[monthlySortField];
                return `${r['年份']}\t${isSeasonValidValue(val) ? val : ''}`;
            });
            copyText([headerLine, ...dataLines].join('\n'));
        });
    }
}

// ROBUST COPY FUNCTION (Works on HTTP)
function copyText(text) {
    // 1. Try modern API (works on HTTPS / Localhost)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast(text))
        .catch(err => fallbackCopy(text));
    } else {
        // 2. Fallback for HTTP
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) showToast(text);
        else console.error('Fallback copy failed.');
    } catch (err) {
        console.error('Fallback copy error', err);
    }
    
    document.body.removeChild(textArea);
}

function createUI() {
    if (document.getElementById('weather-extension-root')) return;

    const root = document.createElement('div');
    root.id = 'weather-extension-root';
    
    root.innerHTML = `
        <div id="weather-extension-header">
            <h2>Weather Analysis</h2>
            <button id="weather-close-btn">Close</button>
        </div>
        
        <div id="weather-controls">
            <div class="weather-input-group">
                <label>Start Year:</label>
                <input type="number" id="inp-year" value="1991">
            </div>
            <div class="weather-input-group">
                <label>Threshold:</label>
                <input type="number" id="inp-limit" value="30">
            </div>
            <button id="weather-run-btn">Run Analysis</button>
            <button id="weather-copy-avg-btn">Copy 13 Averages</button>
            <button id="weather-jump-seasonal-btn">Seasonal Averages ↓</button>
            <button id="weather-jump-monthly-btn">Monthly History ↓</button>
        </div>

        <div id="weather-content-area"></div>
        <div id="copy-toast">Copied!</div>
    `;
    
    document.body.appendChild(root);
    
    // Close Logic
    document.getElementById('weather-close-btn').addEventListener('click', () => {
        root.remove();
    });

    // Run Button Logic
    document.getElementById('weather-run-btn').addEventListener('click', () => {
        const y = parseInt(document.getElementById('inp-year').value);
        const l = parseInt(document.getElementById('inp-limit').value);
        runUserLogic(y, l);
    });

    document.getElementById('weather-copy-avg-btn').addEventListener('click', () => {
        if (latestAverageValues.length === 0) {
            showToast('No averages yet');
            return;
        }
        copyText(latestAverageValues.join('\t'));
    });

    document.getElementById('weather-jump-seasonal-btn').addEventListener('click', () => {
        const el = document.getElementById('weather-seasonal-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.getElementById('weather-jump-monthly-btn').addEventListener('click', () => {
        const el = document.getElementById('weather-monthly-history-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Copy Click & Action Listeners
    root.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.season-cell-copy-btn');
        if (copyBtn) {
            e.stopPropagation();
            const textToCopy = copyBtn.dataset.copyText;
            if (textToCopy) {
                copyText(textToCopy);
                copyBtn.classList.add('copied');
                const origSvg = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#81c784" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = origSvg;
                }, 1500);
            }
            return;
        }

        const tempValue = e.target.closest('.temp-value');
        if (tempValue) {
            copyText(tempValue.dataset.copyValue || tempValue.innerText);
        }
    });

    root.addEventListener('dblclick', (e) => {
        const cell = e.target.closest('.season-detail-cell');
        if (cell && !e.target.closest('.season-cell-copy-btn')) {
            const textToCopy = cell.dataset.detailText;
            if (textToCopy) {
                copyText(textToCopy);
                const copyBtn = cell.querySelector('.season-cell-copy-btn');
                if (copyBtn) {
                    copyBtn.classList.add('copied');
                    const origSvg = copyBtn.innerHTML;
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#81c784" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = origSvg;
                    }, 1500);
                }
            }
        }
    });
}

function showToast(val) {
    const toast = document.getElementById('copy-toast');
    if(toast) {
        toast.innerText = `Copied: ${val}`;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }
}
