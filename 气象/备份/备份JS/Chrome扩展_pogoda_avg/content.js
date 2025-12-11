// Ensure we run 1 second after window load
window.addEventListener('load', () => {
    setTimeout(() => {
        initExtension();
    }, 1000);
});

function initExtension() {
    createUI();
    
    // Automatically run once with defaults (1991, 30)
    runUserLogic(1991, 30);
}

// -----------------------------------------------------------
// YOUR CUSTOM LOGIC GOES HERE
// -----------------------------------------------------------

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
            data_arr[i-1][columns[j+1]] = Number(tds_row[j].innerText.trim());
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
        tempO['avg'] = Number(getAvg(v1));
        tempO['avg_climate'] = Number(getAvg(v2));
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
        if(Number(v) > 70 || Number(v) < -110){
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
        return arr.length === 0 ? 'undefined' : (sum/arr.length).toFixed(2);
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

    displayOutput(stat_obj, 'log');
    displayOutput(summary_arr, 'table');
    let tempR = '\n极端冷月平均气温: ' + stat_obj['YM']['min'].toString() + ' ( ' + getYMAT(stat_obj['YM']['min_YM']) +' )\n\n极端热月平均气温: '
        + stat_obj['YM']['max'].toString() + ' ( ' + getYMAT(stat_obj['YM']['max_YM']) + ' )\n\n极端冷年平均: '
        + stat_obj[columns[columns.length - 1]]['min'].toString() + ' ( ' + getArrText(stat_obj[columns[columns.length - 1]]['min_years'])
        + ' )\n\n极端热年平均: ' + stat_obj[columns[columns.length - 1]]['max'].toString() + ' ( '
        + getArrText(stat_obj[columns[columns.length - 1]]['max_years']) + ' )\n\n';
    displayOutput(tempR, 'log');
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

const REGEX_TEMP = /(-?\d{1,2}\.?(\d{1,2})?)|\d{4}/g;
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
                td.innerHTML = processTextForCopying(String(row[key]));
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

    // Copy Click Listener
    root.addEventListener('click', (e) => {
        if (e.target.classList.contains('temp-value')) {
            copyText(e.target.innerText);
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