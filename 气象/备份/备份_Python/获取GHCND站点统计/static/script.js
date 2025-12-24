let debounceTimer;
let currentSortBy = 'DATE';
let currentSortDir = 'desc';
let rawPeriodStats = [];
let periodSortCol = 'range';
let periodSortDir = 'desc';
let periodColVisibility = { min_tmin: true, max_tmin: true, min_tmax: true, max_tmax: true };
let multiSortBy = 'dist';
let multiSortDir = 'asc';
let currentMultiStations = []; 
let rawMultiStatsResults = [];
let multiStatSortCol = 'val';
let multiStatSortDir = 'desc';
let stationLookup = {}; 

function getElementValueSafe(id, defaultVal) {
    const el = document.getElementById(id);
    return el ? el.value : defaultVal;
}

document.addEventListener('DOMContentLoaded', () => {
    const hiddenId = document.getElementById('stationId');
    const visualInput = document.getElementById('stationInput');
    if(hiddenId && hiddenId.value && !visualInput.value) {
        visualInput.value = hiddenId.value; 
    }
    if(visualInput) {
        visualInput.addEventListener('input', handleStationInput);
        if (visualInput.value) fetchDefaultStationDetails(visualInput.value);
    }
    const dataSource = document.getElementById('dataSource');
    if(dataSource) {
        dataSource.addEventListener('change', function() {
            const wbanRow = document.getElementById('wbanRow');
            if(wbanRow) wbanRow.style.display = (this.value === 'GSOD') ? 'flex' : 'none';
        });
    }
});

async function fetchDefaultStationDetails(query) {
    try {
        const response = await fetch(`/search_stations?q=${encodeURIComponent(query)}&source=GHCND`);
        if (response.ok) {
            const results = await response.json();
            results.forEach(item => { stationLookup[item.value] = item; stationLookup[item.id] = item; });
            handleStationInput(); 
        }
    } catch (err) { console.error(err); }
}

function applyQuickDateRange() {
    const selector = document.getElementById('quickDateRange');
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    if (selector.value === '1991-2020') { startInput.value = '1991-01-01'; endInput.value = '2020-12-31'; } 
    else if (selector.value === '1961-1990') { startInput.value = '1961-01-01'; endInput.value = '1990-12-31'; } 
    else { startInput.value = '1800-01-01'; endInput.value = '2100-12-31'; }
}

function toggleCenterLocMode() {
    const mode = document.getElementById('centerMode').value;
    const area = document.getElementById('coordsInputArea');
    if(area) area.style.display = (mode === 'coords') ? 'grid' : 'none';
}

async function searchStations() {
    const input = document.getElementById('stationInput');
    const dataList = document.getElementById('stationOptions');
    const query = input.value;
    const source = document.getElementById('dataSource').value;

    if (query.includes(' - ')) {
        document.getElementById('stationId').value = query.split(' - ')[0];
        handleStationInput(); 
        return;
    } else {
        document.getElementById('stationId').value = query; 
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (query.length < 3) return;
        try {
            const response = await fetch(`/search_stations?q=${encodeURIComponent(query)}&source=${source}`);
            if (response.status === 401) { window.location.href = "/login"; return; }
            const results = await response.json();
            dataList.innerHTML = '';
            stationLookup = {}; 
            results.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value; 
                dataList.appendChild(option);
                stationLookup[item.value] = item;
                stationLookup[item.id] = item;
            });
        } catch (err) { console.error(err); }
    }, 300);
}

function handleStationInput() {
    const val = document.getElementById('stationInput').value;
    const infoDiv = document.getElementById('stationInfoDisplay');
    const data = stationLookup[val] || stationLookup[val.trim()];
    if (data) {
        infoDiv.style.display = 'block';
        infoDiv.innerHTML = `<span class="copyable" title="Copy Name">${data.name}</span><span style="margin: 0 15px; color:#ccc;">|</span><span class="copyable" title="Copy Coordinates">${data.lat}\t${data.lon}</span><span style="margin: 0 15px; color:#ccc;">|</span><span class="copyable" title="Copy Elevation">${data.elev}m</span>`;
    } else { infoDiv.style.display = 'none'; }
}

document.addEventListener('click', function(e) {
    const target = e.target.closest('.copyable');
    if (target) {
        const text = target.innerText.trim(); 
        if (text && text !== '-') {
            navigator.clipboard.writeText(text).then(() => { showToast(`Copied: ${text}`); })
            .catch(err => { console.error('Failed to copy: ', err); });
        }
    }
});

function showToast(message) {
    const toast = document.getElementById("copyToast");
    toast.textContent = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

function updateRecordsList() {
    document.getElementById('sortingLoading').classList.remove('hidden');
    const limitVal = document.getElementById('recordLimitSelect').value;
    document.getElementById('limitLabel').textContent = limitVal;
    fetchData();
}

function updateMultiStations() {
    const loader = document.getElementById('multiStationLoading');
    if(loader) loader.classList.remove('hidden');
    const limitVal = document.getElementById('multiLimitSelect').value;
    document.getElementById('multiLimitLabel').textContent = limitVal;
    fetchData();
}

function copyMultiTable() {
    const table = document.getElementById('multiStationTable');
    if(!table) return;
    let tsv = [];
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.replace(' \u21c5', '').trim());
    tsv.push(headers.join('\t'));
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        tsv.push(cells.join('\t'));
    });
    const textToCopy = tsv.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => { showToast('Table copied to clipboard!'); });
}

function copyMultiStatsTable() {
    const table = document.getElementById('multiStatResultTable');
    if(!table) return;
    let tsv = [];
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.replace(' \u21c5', '').trim());
    tsv.push(headers.join('\t'));
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        tsv.push(cells.join('\t'));
    });
    const textToCopy = tsv.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => { showToast('Stats table copied to clipboard!'); });
}

function sortMultiStatTable(column) {
    if (multiStatSortCol === column) { multiStatSortDir = (multiStatSortDir === 'asc') ? 'desc' : 'asc'; } 
    else { multiStatSortCol = column; multiStatSortDir = (column === 'val' || column === 'dist') ? 'desc' : 'asc'; }
    renderMultiStatTable();
}

function renderMultiStatTable() {
    const tbody = document.querySelector('#multiStatResultTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    if (rawMultiStatsResults.length === 0) { tbody.innerHTML = `<tr><td colspan="4">No stats available.</td></tr>`; return; }
    rawMultiStatsResults.sort((a, b) => {
        let valA = a[multiStatSortCol]; let valB = b[multiStatSortCol];
        if (multiStatSortCol === 'val') { valA = (valA === '-') ? -9999 : parseFloat(valA); valB = (valB === '-') ? -9999 : parseFloat(valB); } 
        else if (multiStatSortCol === 'dist') { valA = parseFloat(valA || 0); valB = parseFloat(valB || 0); }
        if (valA < valB) return multiStatSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return multiStatSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    rawMultiStatsResults.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.id}</td><td>${row.name}</td><td>${row.dist}</td><td>${row.val}</td>`;
        tbody.appendChild(tr);
    });
}

async function calcMultiStats() {
    const loading = document.getElementById('multiStatLoading');
    const tbody = document.querySelector('#multiStatResultTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    rawMultiStatsResults = []; 
    if (currentMultiStations.length === 0) { alert("No stations in list. Update Part 4 first."); return; }
    loading.classList.remove('hidden');

    const distMap = {};
    currentMultiStations.forEach(s => distMap[s.id] = s.dist);

    const payload = {
        station_ids: currentMultiStations.map(s => s.id),
        source: document.getElementById('dataSource').value,
        metric: document.getElementById('multiStatSelect').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        month_filter: document.getElementById('monthFilter').value,
        period: document.querySelector('input[name="period"]:checked').value,
        tmin_val: document.getElementById('tminVal').value,
        tmin_dir: document.getElementById('tminDir').value,
        tavg_val: document.getElementById('tavgVal').value,
        tavg_dir: document.getElementById('tavgDir').value,
        tmax_val: document.getElementById('tmaxVal').value,
        tmax_dir: document.getElementById('tmaxDir').value,
    };

    try {
        const response = await fetch('/get_multi_stats', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (response.status === 401) { window.location.href = "/login"; return; }
        const result = await response.json();
        if (result.status === 'success') {
            result.results.forEach(row => { row.dist = distMap[row.id]; rawMultiStatsResults.push(row); });
            renderMultiStatTable();
        } else { tbody.innerHTML = `<tr><td colspan="4">Error: ${result.message}</td></tr>`; }
    } catch (err) { tbody.innerHTML = `<tr><td colspan="4">Network Error</td></tr>`; } 
    finally { loading.classList.add('hidden'); }
}

function triggerServerSort(columnName) {
    document.getElementById('sortingLoading').classList.remove('hidden');
    if (currentSortBy === columnName) { currentSortDir = (currentSortDir === 'asc') ? 'desc' : 'asc'; } 
    else { currentSortBy = columnName; currentSortDir = 'desc'; }
    fetchData();
}
function triggerMultiSort(columnName) {
    const loader = document.getElementById('multiStationLoading');
    if(loader) loader.classList.remove('hidden');
    if (multiSortBy === columnName) { multiSortDir = (multiSortDir === 'asc') ? 'desc' : 'asc'; } 
    else { multiSortBy = columnName; multiSortDir = 'asc'; }
    fetchData();
}

// ... (Period Functions same as before) ...
function sortPeriodTable(column) {
    if (periodSortCol === column) { periodSortDir = (periodSortDir === 'asc') ? 'desc' : 'asc'; } 
    else { periodSortCol = column; periodSortDir = 'desc'; }
    renderPeriodTable();
}
function updatePeriodColumns() {
    periodColVisibility.min_tmin = document.getElementById('chk_min_tmin').checked;
    periodColVisibility.max_tmin = document.getElementById('chk_max_tmin').checked;
    periodColVisibility.min_tmax = document.getElementById('chk_min_tmax').checked;
    periodColVisibility.max_tmax = document.getElementById('chk_max_tmax').checked;
    renderPeriodTable();
}
function renderPeriodTable() {
    const tbody = document.querySelector('#periodStatsTable tbody');
    tbody.innerHTML = '';
    const setHeaderDisplay = (id, visible) => { document.getElementById(id).style.display = visible ? '' : 'none'; };
    setHeaderDisplay('th_min_tmin', periodColVisibility.min_tmin);
    setHeaderDisplay('th_min_tmax', periodColVisibility.min_tmax);
    setHeaderDisplay('th_max_tmin', periodColVisibility.max_tmin);
    setHeaderDisplay('th_max_tmax', periodColVisibility.max_tmax);

    if (rawPeriodStats.length === 0) {
        let colCount = 4;
        if (periodColVisibility.min_tmin) colCount++;
        if (periodColVisibility.max_tmin) colCount++;
        if (periodColVisibility.min_tmax) colCount++;
        if (periodColVisibility.max_tmax) colCount++;
        tbody.innerHTML = `<tr><td colspan="${colCount}">No period data available.</td></tr>`;
        return;
    }
    rawPeriodStats.sort((a, b) => {
        let valA, valB;
        if (['range'].includes(periodSortCol)) { valA = a[periodSortCol]; valB = b[periodSortCol]; } 
        else if (['cnt_tmin', 'cnt_tavg', 'cnt_tmax'].includes(periodSortCol)) { valA = a[periodSortCol]; valB = b[periodSortCol]; } 
        else { valA = (a[periodSortCol].val === '-') ? -9999 : a[periodSortCol].val; valB = (b[periodSortCol].val === '-') ? -9999 : b[periodSortCol].val; }
        if (valA < valB) return periodSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return periodSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    rawPeriodStats.forEach(p => {
        const tr = document.createElement('tr');
        const renderWithTooltip = (obj) => {
            if (obj.val === '-' || !obj.dates || obj.dates.length === 0) { return obj.val; }
            const dateText = obj.dates.length > 20 ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more` : obj.dates.join('\n');
            return `<div class="tooltip-container"><span class="copyable" title="Click to copy">${obj.val}</span><span class="tooltip-note">${dateText}</span></div>`;
        };
        const getStyle = (key) => periodColVisibility[key] ? '' : 'display: none;';
        tr.innerHTML = `
            <td><span class="copyable" title="Click to copy">${p.range}</span></td>
            <td style="${getStyle('min_tmin')}">${renderWithTooltip(p.min_tmin)}</td>
            <td style="${getStyle('min_tmax')}">${renderWithTooltip(p.min_tmax)}</td>
            <td style="${getStyle('max_tmin')}">${renderWithTooltip(p.max_tmin)}</td>
            <td style="${getStyle('max_tmax')}">${renderWithTooltip(p.max_tmax)}</td>
            <td><span class="copyable" title="Click to copy">${p.cnt_tmin}</span></td>
            <td><span class="copyable" title="Click to copy">${p.cnt_tavg}</span></td>
            <td><span class="copyable" title="Click to copy">${p.cnt_tmax}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MAIN FETCH ---
async function fetchData() {
    const loading = document.getElementById('loading');
    const sortingLoading = document.getElementById('sortingLoading');
    const multiStationLoading = document.getElementById('multiStationLoading');
    const errorMsg = document.getElementById('errorMsg');
    const recordsTbody = document.querySelector('#recordsTable tbody');
    const multiTbody = document.querySelector('#multiStationTable tbody'); 

    const checkboxes = document.querySelectorAll('.record-controls input[name="rec_elem"]');
    const selectedElements = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const recordLimit = document.getElementById('recordLimitSelect').value;
    const source = document.getElementById('dataSource').value; 
    
    // SAFE GET for Multi Params (might not exist for basic users)
    const multiLimitSelect = document.getElementById('multiLimitSelect');
    const multiLimit = multiLimitSelect ? multiLimitSelect.value : 15;

    recordsTbody.innerHTML = '';
    if(multiTbody) multiTbody.innerHTML = ''; 
    rawPeriodStats = [];
    renderPeriodTable();
    currentMultiStations = []; 

    errorMsg.textContent = '';
    
    // Only show main loading if others are hidden
    if ((!sortingLoading || sortingLoading.classList.contains('hidden')) && 
        (!multiStationLoading || multiStationLoading.classList.contains('hidden'))) { 
        loading.classList.remove('hidden'); 
    }

    const finalStationId = document.getElementById('stationId').value || document.getElementById('stationInput').value;

    const payload = {
        station_id: finalStationId,
        source: source,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        month_filter: document.getElementById('monthFilter').value,
        period: document.querySelector('input[name="period"]:checked').value,
        hemisphere: document.querySelector('input[name="hemisphere"]:checked').value,
        sort_by: currentSortBy,
        sort_dir: currentSortDir,
        selected_elements: selectedElements,
        limit: recordLimit, 
        
        tmin_val: document.getElementById('tminVal').value,
        tmin_dir: document.getElementById('tminDir').value,
        tavg_val: document.getElementById('tavgVal').value,
        tavg_dir: document.getElementById('tavgDir').value,
        tmax_val: document.getElementById('tmaxVal').value,
        tmax_dir: document.getElementById('tmaxDir').value,

        custom_avg_tmin: document.getElementById('customAvgTmin').value,
        custom_avg_tavg: document.getElementById('customAvgTavg').value,
        custom_avg_tmax: document.getElementById('customAvgTmax').value,

        // Safe getters for advanced params
        center_mode: getElementValueSafe('centerMode', 'station'),
        center_lat: getElementValueSafe('centerLat', ''),
        center_lon: getElementValueSafe('centerLon', ''),
        max_dist: getElementValueSafe('maxDist', 'no_limit'),
        country_limit: getElementValueSafe('countryLimit', ''),
        lat_min: getElementValueSafe('latMin', ''),
        lat_max: getElementValueSafe('latMax', ''),
        lon_min: getElementValueSafe('lonMin', ''),
        lon_max: getElementValueSafe('lonMax', ''),
        elev_min: getElementValueSafe('elevMin', ''),
        elev_max: getElementValueSafe('elevMax', ''),
        wban_limit: document.querySelector('input[name="wbanLimit"]:checked') ? document.querySelector('input[name="wbanLimit"]:checked').value : 'no',
        
        multi_sort_by: multiSortBy,
        multi_sort_dir: multiSortDir,
        multi_limit: multiLimit
    };

    try {
        const response = await fetch('/get_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 401) { window.location.href = "/login"; return; }
        const result = await response.json();
        if (result.status === 'error') { errorMsg.textContent = "Error: " + result.message; return; }

        updateStatRow('tmin', result.stats.TMIN);
        updateStatRow('tavg', result.stats.TAVG);
        updateStatRow('tmax', result.stats.TMAX);

        const updateSummaryCell = (id, data) => {
            const el = document.getElementById(id);
            if (data.val === '-') { el.innerHTML = '-'; } 
            else { el.innerHTML = `<span class="copyable" title="Click to copy">${data.val}</span> <span class="stat-subtext">(${data.used}/${data.total})</span>`; }
        };
        updateSummaryCell('sum-avg-min-tmin', result.period_summary.avg_min_tmin);
        updateSummaryCell('sum-avg-min-tmax', result.period_summary.avg_min_tmax);
        updateSummaryCell('sum-avg-max-tmin', result.period_summary.avg_max_tmin);
        updateSummaryCell('sum-avg-max-tmax', result.period_summary.avg_max_tmax);

        rawPeriodStats = result.period_stats;
        renderPeriodTable(); 

        if (result.records.length === 0) {
            recordsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No records found.</td></tr>';
        } else {
            result.records.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><span class="copyable" title="Click to copy">${row.ID}</span></td><td><span class="copyable" title="Click to copy">${row.DATE}</span></td><td>${row.ELEMENT}</td><td><span class="copyable" title="Click to copy">${row.DATA_VALUE}</span></td>`;
                recordsTbody.appendChild(tr);
            });
        }

        if (multiTbody) {
            if (result.multi_stations && result.multi_stations.length > 0) {
                currentMultiStations = result.multi_stations; 
                result.multi_stations.forEach(st => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="copyable" title="Click to copy">${st.id}</span></td>
                        <td><span class="copyable" title="Click to copy">${st.name}</span></td>
                        <td><span class="copyable" title="Click to copy">${st.lat}</span></td>
                        <td><span class="copyable" title="Click to copy">${st.lon}</span></td>
                        <td><span class="copyable" title="Click to copy">${st.elev}</span></td>
                        <td><span class="copyable" title="Click to copy">${st.dist}</span></td>
                        <td><span class="copyable" title="Click to copy">${st.country}</span></td>
                    `;
                    multiTbody.appendChild(tr);
                });
            } else {
                multiTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching stations found.</td></tr>';
            }
        }
        
    } catch (err) {
        errorMsg.textContent = "Please login first to get data.";
        console.error(err);
    } finally {
        loading.classList.add('hidden');
        if(sortingLoading) sortingLoading.classList.add('hidden');
        if(multiStationLoading) multiStationLoading.classList.add('hidden');
    }
}

// ... (Rest of UI Helpers: updateStatRow, toggleElementFilter, applyElementFilter, click listener) ...
function updateStatRow(prefix, data) {
    const renderCell = (obj) => {
        if (!obj || obj.val === '-') return '-';
        if (!obj.dates || obj.dates.length === 0) return `<span class="copyable" title="Click to copy">${obj.val}</span>`;
        const dateText = obj.dates.length > 20 ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more` : obj.dates.join('\n');
        return `<div class="tooltip-container"><span class="copyable" title="Click to copy">${obj.val}</span><span class="tooltip-note">${dateText}</span></div>`;
    };
    document.getElementById(`stat-${prefix}-min`).innerHTML = renderCell(data.min);
    document.getElementById(`stat-${prefix}-max`).innerHTML = renderCell(data.max);
    document.getElementById(`stat-${prefix}-avg`).innerHTML = `<span class="copyable" title="Click to copy">${data.avg}</span>`;
    document.getElementById(`stat-${prefix}-power`).innerHTML = `<span class="copyable" title="Click to copy">${data.explosive_power}</span>`;
    document.getElementById(`stat-${prefix}-count`).innerHTML = `<span class="copyable" title="Click to copy">${data.count_match}</span>`;
}

function toggleElementFilter(event) {
    if(event) event.stopPropagation();
    const dropdown = document.getElementById('elementFilterDropdown');
    dropdown.classList.toggle('hidden');
}

document.addEventListener('click', function(event) {
    const header = document.querySelector('.filter-header');
    const dropdown = document.getElementById('elementFilterDropdown');
    if (header && !header.contains(event.target) && dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
    }
});