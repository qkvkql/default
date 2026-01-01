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

// Helper function to convert season+hemisphere to internal period mode
function getPeriodModeFromSeason(seasonMode, hemisphere) {
    // North + Winter = p1, North + Summer = p2, South + Winter = p2, South + Summer = p1
    return ((hemisphere === 'north' && seasonMode === 'winter') || (hemisphere === 'south' && seasonMode === 'summer')) ? 'p1' : 'p2';
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('active');
    }
}

function toggleMenu() {
    const popup = document.getElementById('popupMenu');
    const overlay = document.getElementById('menuOverlay');
    if (popup) popup.classList.toggle('hidden');
    if (overlay) overlay.classList.toggle('hidden');
}

function closeMenu() {
    const popup = document.getElementById('popupMenu');
    const overlay = document.getElementById('menuOverlay');
    if (popup) popup.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
}

function getElementValueSafe(id, defaultVal) {
    const el = document.getElementById(id);
    return el ? el.value : defaultVal;
}

function openDateDetails(type, value, specificStationId = null) {
    const stationId = specificStationId || document.getElementById('stationId').value;
    const source = document.getElementById('dataSource').value;
    const seasonMode = document.querySelector('input[name="season"]:checked').value;
    const hemisphere = document.querySelector('input[name="hemisphere"]:checked').value;
    const periodMode = getPeriodModeFromSeason(seasonMode, hemisphere);

    // Get Thresholds
    const tminVal = document.getElementById('tminVal').value;
    const tminDir = document.getElementById('tminDir').value;
    const tavgVal = document.getElementById('tavgVal').value;
    const tavgDir = document.getElementById('tavgDir').value;
    const tmaxVal = document.getElementById('tmaxVal').value;
    const tmaxDir = document.getElementById('tmaxDir').value;

    // Construct URL with query params
    const params = new URLSearchParams({
        station_id: stationId,
        source: source,
        type: type,
        value: value,
        period_mode: periodMode,
        tmin_val: tminVal, tmin_dir: tminDir,
        tavg_val: tavgVal, tavg_dir: tavgDir,
        tmax_val: tmaxVal, tmax_dir: tmaxDir
    });

    const url = `/date_details?${params.toString()}`;
    window.open(url, '_blank');
}

function showPeriodModal(ranges, specificStationId = null) {
    const modal = document.getElementById('periodModal');
    const listDiv = document.getElementById('periodList');
    listDiv.innerHTML = '';

    ranges.forEach(range => {
        const div = document.createElement('div');
        div.className = 'period-item';
        div.textContent = range;
        div.onclick = () => {
            openDateDetails('period', range, specificStationId);
            // Optional: close modal after click? User might want to open multiple. Let's keep it open.
        };
        listDiv.appendChild(div);
    });

    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const hiddenId = document.getElementById('stationId');
    const visualInput = document.getElementById('stationInput');
    if (hiddenId && hiddenId.value && !visualInput.value) {
        visualInput.value = hiddenId.value;
    }
    if (visualInput) {
        visualInput.addEventListener('input', handleStationInput);
        if (visualInput.value) fetchDefaultStationDetails(visualInput.value);
    }
    const dataSource = document.getElementById('dataSource');
    if (dataSource) {
        dataSource.addEventListener('change', function () {
            const wbanRow = document.getElementById('wbanRow');
            if (wbanRow) wbanRow.style.display = (this.value === 'GSOD') ? 'flex' : 'none';
        });
    }

    document.querySelectorAll('input[name="hemisphere"], input[name="season"]').forEach(radio => {
        radio.addEventListener('change', syncPeriodColumns);
    });

    syncPeriodColumns();
    updateDayDropdown(); // Initialize day dropdown on page load
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

function updateDayDropdown() {
    const monthFilter = document.getElementById('monthFilter');
    const dayFilter = document.getElementById('dayFilter');
    if (!monthFilter || !dayFilter) return;

    const selectedMonth = monthFilter.value;

    // Show day dropdown only for single month selections (1-12)
    if (selectedMonth && selectedMonth !== '0' && selectedMonth !== 'winter_3' && selectedMonth !== 'summer_3') {
        dayFilter.style.display = '';

        // Get max days for the selected month
        const monthNum = parseInt(selectedMonth);
        let maxDays = 31;
        if (monthNum === 2) {
            maxDays = 29; // February: account for leap years
        } else if ([4, 6, 9, 11].includes(monthNum)) {
            maxDays = 30; // April, June, September, November
        }

        // Populate day options - preserve the "All Days" option text from template
        const allDaysOption = dayFilter.querySelector('option[value="0"]');
        const allDaysText = allDaysOption ? allDaysOption.textContent : 'All Days';
        dayFilter.innerHTML = `<option value="0">${allDaysText}</option>`;
        for (let day = 1; day <= maxDays; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            dayFilter.appendChild(option);
        }

        // Reset to "All Days" when month changes
        dayFilter.value = '0';
    } else {
        dayFilter.style.display = 'none';
        dayFilter.value = '0';
    }
}

function toggleCenterLocMode() {
    const mode = document.getElementById('centerMode').value;
    const area = document.getElementById('coordsInputArea');
    if (area) area.style.display = (mode === 'coords') ? 'grid' : 'none';
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
        infoDiv.innerHTML = `
            <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">${STATION_INFO_TITLE}</div>
            <div class="copyable" title="Copy Name" style="margin-bottom: 3px;">${data.name}</div>
            <div class="copyable" title="Copy Coordinates" style="margin-bottom: 3px;">${data.lat}\t${data.lon}</div>
            <div class="copyable" title="Copy Elevation">${data.elev}m</div>
        `;
    } else { infoDiv.style.display = 'none'; }
}

document.addEventListener('click', function (e) {
    // 1. Explicit Copyable Elements
    const target = e.target.closest('.copyable');
    if (target) {
        const text = target.innerText.trim();
        if (text && text !== '-') {
            navigator.clipboard.writeText(text).then(() => { showToast(`Copied: ${text}`); })
                .catch(err => { console.error('Failed to copy: ', err); });
        }
        return;
    }

    // 2. Global Table Cell Copy
    // Target .copy-cell which we explicitly add to valid non-empty cells
    const targetCell = e.target.closest('.copy-cell');
    // Ensure we are not clicking an interactive element inside the cell (like a link)
    // Links have stopPropagation, so they shouldn't bubble here anyway, but safety check.
    if (targetCell && !e.target.closest('button') && !e.target.closest('a') && !e.target.closest('input') && !e.target.closest('select')) {
        if (window.getSelection().toString().length > 0) return;
        const text = targetCell.innerText.trim();
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
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}

function updateRecordsList() {
    document.getElementById('sortingLoading').classList.remove('hidden');
    const limitVal = document.getElementById('recordLimitSelect').value;
    const limitLabel = document.getElementById('limitLabel');
    if (limitLabel) limitLabel.textContent = limitVal;
    fetchData(true); // true means KEEP manual sort
}

function copyRecordsTable() {
    const table = document.getElementById('recordsTable');
    if (!table) return;
    let tsv = [];
    // Headers: remove arrow symbols if present
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.replace(' \u21c5', '').trim());
    tsv.push(headers.join('\t'));
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        tsv.push(cells.join('\t'));
    });
    const textToCopy = tsv.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => { showToast('Records table copied to clipboard!'); });
}

function copyGlobalStatsTable() {
    // We need to add ID 'globalStatsTable' to the table in index.html first! 
    // Wait, I did that in previous step replacement.
    const table = document.getElementById('globalStatsTable');
    if (!table) return;
    let tsv = [];
    // The structure often has th in tbody for row headers in global stats? No, it has thead.
    // Let's check logic: rows 398-403 have td headers? 
    // "<td><strong>...</strong></td>" is used as label.
    // Let's just grab all rows.

    // Header
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
    if (headers.length > 0) tsv.push(headers.join('\t'));

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        tsv.push(cells.join('\t'));
    });
    const text = tsv.join('\n');
    navigator.clipboard.writeText(text).then(() => { showToast('Global Stats copied!'); });
}

function copyPeriodAvgTable() {
    const table = document.getElementById('periodAvgTable');
    if (!table) return;
    let tsv = [];
    // Complex headers in Period Avg?
    // Just grab text content of rows including headers?
    // The table might have multiple header rows?
    // Let's just grab all TRs from thead and tbody.

    const allRows = table.querySelectorAll('tr');
    allRows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(el => el.innerText.replace(/\n/g, ' ').trim());
        tsv.push(cells.join('\t'));
    });
    navigator.clipboard.writeText(tsv.join('\n')).then(() => { showToast('Period Averages copied!'); });
}

function copyPeriodDetailsTable() {
    const table = document.getElementById('periodStatsTable'); // ID added in prev step
    if (!table) return;
    let tsv = [];
    const keywords = ['Period', 'Total Records', 'Expected', 'Min', 'Avg', 'Max']; // Just raw text dump is usually best for "Copy Table" unless structured.
    // Simple TSV dump of all visible rows
    const allRows = table.querySelectorAll('tr');
    allRows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(el => el.innerText.replace(/\n/g, ' ').trim());
        tsv.push(cells.join('\t'));
    });
    navigator.clipboard.writeText(tsv.join('\n')).then(() => { showToast('Period Details copied!'); });
}

function updateMultiStations() {
    const loader = document.getElementById('multiStationLoading');
    if (loader) loader.classList.remove('hidden');
    const limitVal = document.getElementById('multiLimitSelect').value;
    const limitLabel = document.getElementById('multiLimitLabel');
    if (limitLabel) limitLabel.textContent = limitVal;
    fetchData();
}

function copyMultiTable() {
    const table = document.getElementById('multiStationTable');
    if (!table) return;
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
    if (!table) return;
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
    else { multiStatSortCol = column; multiStatSortDir = (column === 'val' || column === 'dist' || column === 'lat' || column === 'lon' || column === 'elev') ? 'desc' : 'asc'; }
    renderMultiStatTable();
}

function renderMultiStatTable() {
    const tbody = document.querySelector('#multiStatResultTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (rawMultiStatsResults.length === 0) { tbody.innerHTML = `<tr><td colspan="5">No stats available.</td></tr>`; return; }
    rawMultiStatsResults.sort((a, b) => {
        let valA = a[multiStatSortCol];
        let valB = b[multiStatSortCol];

        const isEmpty = (v) => v === '-' || v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
        let isEmptyA = isEmpty(valA);
        let isEmptyB = isEmpty(valB);

        if (isEmptyA && isEmptyB) return 0;
        if (isEmptyA) return 1; // A is empty -> always bottom
        if (isEmptyB) return -1; // B is empty -> always bottom

        // Both not empty, proceed with normal sort
        if (['val', 'dist', 'lat', 'lon', 'elev'].includes(multiStatSortCol)) {
            valA = parseFloat(valA || 0);
            valB = parseFloat(valB || 0);
        }

        if (valA < valB) return multiStatSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return multiStatSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    rawMultiStatsResults.forEach(row => {
        const tr = document.createElement('tr');
        let datesCell = '';

        if (row.dates && row.dates.length > 0) {
            // Check if dates are period ranges (YYYY-YYYY)
            // Heuristic: check if the first item contains a hyphen and looks like a year-year
            const isPeriodLike = row.dates[0].match(/^\d{4}-\d{4}$/);
            const isMonthName = row.dates[0].match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/);

            if (isPeriodLike && row.dates.length > 1) {
                // Multiple periods -> Show Modal Trigger
                const label = `${row.dates.length} Periods Found`;
                // Pass row.id as specificStationId
                datesCell = `<span class="clickable-date" onclick="event.stopPropagation(); showPeriodModal('${row.dates.join(',').replace(/'/g, "\\'")}'.split(','), '${row.id}')" title="Click to Select Period">${label}</span>`;
            } else if (isPeriodLike && row.dates.length === 1) {
                // Single period -> Direct Link
                datesCell = `<span class="clickable-date" onclick="event.stopPropagation(); openDateDetails('period', '${row.dates[0]}', '${row.id}')" title="View Details">${row.dates[0]}</span>`;
            } else if (isMonthName) {
                // Month names -> Plain Text
                datesCell = row.dates.join(', ');
            } else {
                // Regular dates list (global stats or single dates) -> Direct Link (Type=List)
                datesCell = `<span class="clickable-date" onclick="event.stopPropagation(); openDateDetails('list', '${row.dates.join(',')}', '${row.id}')" title="View Details">${row.dates.join(', ')}</span>`;
            }
        }

        // Helper to add 'copy-cell' if val is valid
        const cls = (val) => (val && val !== '-' && val !== 'None') ? ' class="copy-cell"' : '';

        // ID is index 0 (excluded), Name (1), Lat (2), Lon (3), Elev (4), Dist (5), Val (6)
        // datesCell (7) is interactive
        tr.innerHTML = `<td>${row.id}</td><td${cls(row.name)}>${row.name}</td><td${cls(row.lat)}>${row.lat}</td><td${cls(row.lon)}>${row.lon}</td><td${cls(row.elev)}>${row.elev}</td><td${cls(row.dist)}>${row.dist}</td><td${cls(row.val)}>${row.val}</td><td>${datesCell}</td>`;
        tbody.appendChild(tr);
    });
}

async function calcMultiStats() {
    const loading = document.getElementById('multiStatLoading');
    const tbody = document.querySelector('#multiStatResultTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const timerResultArea = document.getElementById('multiStatTimerResult');
    if (timerResultArea) timerResultArea.innerText = '';
    rawMultiStatsResults = [];
    if (currentMultiStations.length === 0) { alert("No stations in list. Update Part 4 first."); return; }
    loading.classList.remove('hidden');

    const timerSpan = document.getElementById('multiStatTimer');
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        timerSpan.innerText = `(${elapsed}s)`;
    }, 100);

    const distMap = {};
    currentMultiStations.forEach(s => distMap[s.id] = s.dist);

    const seasonMode = document.querySelector('input[name="season"]:checked').value;
    const hemisphere = document.querySelector('input[name="hemisphere"]:checked').value;
    const periodMode = getPeriodModeFromSeason(seasonMode, hemisphere);

    const payload = {
        station_ids: currentMultiStations.map(s => s.id),
        source: document.getElementById('dataSource').value,
        metric: document.getElementById('multiStatSelect').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        month_filter: document.getElementById('monthFilter').value,
        day_filter: document.getElementById('dayFilter').value || '0',
        period: periodMode,
        tmin_val: document.getElementById('tminVal').value,
        tmin_dir: document.getElementById('tminDir').value,
        tavg_val: document.getElementById('tavgVal').value,
        tavg_dir: document.getElementById('tavgDir').value,
        tmax_val: document.getElementById('tmaxVal').value,
        tmax_dir: document.getElementById('tmaxDir').value,
    };

    try {
        const response = await fetch('/get_multi_stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        if (response.status === 401) { window.location.href = "/login"; return; }
        const result = await response.json();
        if (result.status === 'success') {
            result.results.forEach(row => { row.dist = distMap[row.id]; rawMultiStatsResults.push(row); });
            renderMultiStatTable();
        } else { tbody.innerHTML = `<tr><td colspan="5">Error: ${result.message}</td></tr>`; }
    } catch (err) { tbody.innerHTML = `<tr><td colspan="5">Network Error</td></tr>`; }
    finally {
        clearInterval(timerInterval);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        // Use the translation if possible, or just build the string
        // We can't easily call t() from JS, so we'll use a data attribute or similar if we wanted to be perfect
        // But the user requested a timer inside the area, and we added a span next to the loading text.
        // Let's refine the script.js to use the translation provided in the window object if we add it.
        loading.classList.add('hidden');
        timerSpan.innerText = ''; // Clear the intermediate timer

        // Show final time in the table header or near it.
        // For now, let's just stick it in a dedicated spot or log it.
        // Actually, let's update the UI to show the final time even after loading finishes.
        const timerResultArea = document.getElementById('multiStatTimerResult');
        if (timerResultArea) {
            const timerMsg = TIMER_LABEL_JS.replace('{time}', elapsed);
            timerResultArea.innerText = timerMsg;
        }
    }
}

function triggerServerSort(columnName) {
    document.getElementById('sortingLoading').classList.remove('hidden');
    if (currentSortBy === columnName) { currentSortDir = (currentSortDir === 'asc') ? 'desc' : 'asc'; }
    else { currentSortBy = columnName; currentSortDir = 'desc'; }
    fetchData(true);
}
function triggerMultiSort(columnName) {
    const loader = document.getElementById('multiStationLoading');
    if (loader) loader.classList.remove('hidden');
    if (multiSortBy === columnName) { multiSortDir = (multiSortDir === 'asc') ? 'desc' : 'asc'; }
    else { multiSortBy = columnName; multiSortDir = 'asc'; }
    fetchData(true);
}
function sortPeriodTable(column) {
    if (periodSortCol === column) { periodSortDir = (periodSortDir === 'asc') ? 'desc' : 'asc'; }
    else { periodSortCol = column; periodSortDir = 'desc'; }
    renderPeriodTable();
}

function syncPeriodColumns() {
    const hemi = document.querySelector('input[name="hemisphere"]:checked').value;
    const season = document.querySelector('input[name="season"]:checked').value;
    const peri = getPeriodModeFromSeason(season, hemi);

    if ((hemi === 'north' && peri === 'p1') || (hemi === 'south' && peri === 'p2')) {
        periodColVisibility.min_tmin = true;
        periodColVisibility.min_tmax = true;
        periodColVisibility.max_tmin = false;
        periodColVisibility.max_tmax = false;
    } else {
        periodColVisibility.min_tmin = false;
        periodColVisibility.min_tmax = false;
        periodColVisibility.max_tmin = true;
        periodColVisibility.max_tmax = true;
    }
    renderPeriodTable();
}
function renderPeriodTable() {
    const tbody = document.querySelector('#periodStatsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const setHeaderDisplay = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? '' : 'none';
    };
    setHeaderDisplay('th_min_tmin', periodColVisibility.min_tmin);
    setHeaderDisplay('th_min_tmax', periodColVisibility.min_tmax);
    setHeaderDisplay('th_max_tmin', periodColVisibility.max_tmin);
    setHeaderDisplay('th_max_tmax', periodColVisibility.max_tmax);

    if (rawPeriodStats.length === 0) {
        let colCount = 5;
        if (periodColVisibility.min_tmin) colCount++;
        if (periodColVisibility.max_tmin) colCount++;
        if (periodColVisibility.min_tmax) colCount++;
        if (periodColVisibility.max_tmax) colCount++;
        tbody.innerHTML = `<tr><td colspan="${colCount}">No period data available.</td></tr>`;
        return;
    }
    rawPeriodStats.sort((a, b) => {
        let valA, valB;
        if (['range'].includes(periodSortCol)) {
            return periodSortDir === 'asc' ? a[periodSortCol].localeCompare(b[periodSortCol]) : b[periodSortCol].localeCompare(a[periodSortCol]);
        }

        // Extract value function
        const getVal = (obj) => {
            if (['cnt_tmin', 'cnt_tavg', 'cnt_tmax', 'count_actual'].includes(periodSortCol)) return obj[periodSortCol];
            return (obj[periodSortCol] && obj[periodSortCol].val) ? obj[periodSortCol].val : '-';
        };

        valA = getVal(a);
        valB = getVal(b);

        const isEmpty = (v) => v === '-' || v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
        let isEmptyA = isEmpty(valA);
        let isEmptyB = isEmpty(valB);

        if (isEmptyA && isEmptyB) return 0;
        if (isEmptyA) return 1;
        if (isEmptyB) return -1;

        // Numeric sort
        valA = parseFloat(valA);
        valB = parseFloat(valB);

        if (valA < valB) return periodSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return periodSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    rawPeriodStats.forEach(p => {
        const tr = document.createElement('tr');
        const renderWithTooltip = (obj) => {
            if (obj.val === '-' || !obj.dates || obj.dates.length === 0) { return obj.val; }
            const dateText = obj.dates.length > 20 ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more` : obj.dates.join('\n');
            return `<div class="tooltip-container">
                        <span>${obj.val}</span>
                        <span class="tooltip-note clickable-date" onclick="event.stopPropagation(); openDateDetails('list', '${obj.dates.join(',')}')" title="Click to view details">${dateText}</span>
                    </div>`;
        };
        const getStyle = (key) => periodColVisibility[key] ? '' : 'display: none;';
        const getCls = (obj) => (obj && obj.val !== '-') ? ' class="copy-cell"' : '';

        tr.innerHTML = `
            <td><span class="clickable-date" onclick="event.stopPropagation(); openDateDetails('period', '${p.range}')" title="View Period Details">${p.range}</span></td>
            <td class="copy-cell" title="Click to copy">${p.count_actual} / ${p.count_expected}</td>
            <td style="${getStyle('min_tmin')}"${getCls(p.min_tmin)}>${renderWithTooltip(p.min_tmin)}</td>
            <td style="${getStyle('min_tmax')}"${getCls(p.min_tmax)}>${renderWithTooltip(p.min_tmax)}</td>
            <td style="${getStyle('max_tmin')}"${getCls(p.max_tmin)}>${renderWithTooltip(p.max_tmin)}</td>
            <td style="${getStyle('max_tmax')}"${getCls(p.max_tmax)}>${renderWithTooltip(p.max_tmax)}</td>
            <td class="copy-cell"><span title="Click to copy">${p.cnt_tmin}</span></td>
            <td class="copy-cell"><span title="Click to copy">${p.cnt_tavg}</span></td>
            <td class="copy-cell"><span title="Click to copy">${p.cnt_tmax}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MAIN FETCH ---
async function fetchData(keepSort = false) {
    const loading = document.getElementById('loading');
    const sortingLoading = document.getElementById('sortingLoading');
    const multiStationLoading = document.getElementById('multiStationLoading');
    const errorMsg = document.getElementById('errorMsg');
    const recordsTbody = document.querySelector('#recordsTable tbody');
    const multiTbody = document.querySelector('#multiStationTable tbody');

    const recordLimit = document.getElementById('recordLimitSelect').value;
    const source = document.getElementById('dataSource').value;

    // SAFE GET for Multi Params (might not exist for basic users)
    const multiLimitSelect = document.getElementById('multiLimitSelect');
    const multiLimit = multiLimitSelect ? multiLimitSelect.value : 15;

    recordsTbody.innerHTML = '';
    if (multiTbody) {
        multiTbody.innerHTML = '';
        const countEl = document.getElementById('multiStationCount');
        if (countEl) countEl.innerText = '0';
    }
    rawPeriodStats = [];
    renderPeriodTable();
    currentMultiStations = [];

    errorMsg.textContent = '';

    syncPeriodColumns();
    if ((!sortingLoading || sortingLoading.classList.contains('hidden')) &&
        (!multiStationLoading || multiStationLoading.classList.contains('hidden'))) {
        loading.classList.remove('hidden');
    }

    const finalStationId = document.getElementById('stationId').value || document.getElementById('stationInput').value;

    const seasonMode = document.querySelector('input[name="season"]:checked').value;
    const hemisphere = document.querySelector('input[name="hemisphere"]:checked').value;
    const periodMode = getPeriodModeFromSeason(seasonMode, hemisphere);

    // Dynamic Default Sort Logic
    if (!keepSort) {
        if (seasonMode === 'winter') {
            currentSortBy = 'TMIN';
            currentSortDir = 'asc';
        } else {
            currentSortBy = 'TMAX';
            currentSortDir = 'desc';
        }
    }

    const payload = {
        station_id: finalStationId,
        source: source,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        month_filter: document.getElementById('monthFilter').value,
        day_filter: document.getElementById('dayFilter') ? (document.getElementById('dayFilter').value || '0') : '0',
        period: periodMode,
        hemisphere: hemisphere,
        sort_by: currentSortBy,
        sort_dir: currentSortDir,
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
        include_opposite_lat: document.getElementById('includeOppositeLat') ? document.getElementById('includeOppositeLat').checked : false,
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
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            errorMsg.textContent = "Authentication required. Please login first.";
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            errorMsg.textContent = `Server error: ${response.status} ${response.statusText} `;
            return;
        }

        const result = await response.json();
        if (result.status === 'error') {
            errorMsg.textContent = result.message;
            return;
        }

        updateStatRow('tmin', result.stats.TMIN);
        updateStatRow('tavg', result.stats.TAVG);
        updateStatRow('tmax', result.stats.TMAX);

        const updateSummaryCell = (id, data) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (data.val === '-' || data.val === undefined || data.val === null) {
                el.innerHTML = '-';
                el.classList.remove('copy-cell');
            } else {
                el.innerHTML = `<span>${data.val}</span><span class="stat-subtext">(${data.used}/${data.total})</span>`;
                el.classList.add('copy-cell');
            }
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
                const tmin = (row.TMIN === null || row.TMIN === undefined || Number.isNaN(row.TMIN)) ? '-' : row.TMIN;
                const tavg = (row.TAVG === null || row.TAVG === undefined || Number.isNaN(row.TAVG)) ? '-' : row.TAVG;
                const tmax = (row.TMAX === null || row.TMAX === undefined || Number.isNaN(row.TMAX)) ? '-' : row.TMAX;

                const cls = (val) => (val !== '-') ? ' class="copy-cell"' : '';
                tr.innerHTML = `<td>${row.DATE}</td><td${cls(tmin)}>${tmin}</td><td${cls(tavg)}>${tavg}</td><td${cls(tmax)}>${tmax}</td>`;
                recordsTbody.appendChild(tr);
            });
        }

        if (multiTbody) {
            if (result.multi_stations && result.multi_stations.length > 0) {
                currentMultiStations = result.multi_stations;
                const countEl = document.getElementById('multiStationCount');
                if (countEl) countEl.innerText = result.multi_stations.length;
                result.multi_stations.forEach(st => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="copy-cell">${st.id}</td>
                        <td class="copy-cell">${st.name}</td>
                        <td class="copy-cell">${st.lat}</td>
                        <td class="copy-cell">${st.lon}</td>
                        <td class="copy-cell">${st.elev}</td>
                        <td class="copy-cell">${st.dist}</td>
                        <td class="copy-cell">${st.country}</td>
        `;
                    multiTbody.appendChild(tr);
                });
            } else {
                multiTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching stations found.</td></tr>';
                const countEl = document.getElementById('multiStationCount');
                if (countEl) countEl.innerText = '0';
            }
        }

    } catch (err) {
        errorMsg.textContent = `Error fetching data: ${err.message}. Please check your connection and try again.`;
        console.error('Fetch error:', err);
    } finally {
        loading.classList.add('hidden');
        if (sortingLoading) sortingLoading.classList.add('hidden');
        if (multiStationLoading) multiStationLoading.classList.add('hidden');
    }
}

// ... (Rest of UI Helpers: updateStatRow, toggleElementFilter, applyElementFilter, click listener) ...
function updateStatRow(prefix, data) {
    const renderCell = (elId, obj) => {
        const el = document.getElementById(elId);
        if (!obj || obj.val === '-' || obj.val === undefined || obj.val === null) {
            el.innerHTML = '-';
            el.classList.remove('copy-cell');
            return;
        }
        el.classList.add('copy-cell');
        if (!obj.dates || obj.dates.length === 0) {
            el.innerHTML = `<span>${obj.val}</span>`;
        } else {
            const dateText = obj.dates.length > 20 ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more` : obj.dates.join('\n');
            el.innerHTML = `<div class="tooltip-container">
                        <span>${obj.val}</span>
                        <span class="tooltip-note clickable-date" onclick="event.stopPropagation(); openDateDetails('list', '${obj.dates.join(',')}')" title="Click to view details">${dateText}</span>
                    </div>`;
        }
    };
    renderCell(`stat-${prefix}-min`, data.min);
    renderCell(`stat-${prefix}-max`, data.max);

    const setSimpleCell = (elId, val) => {
        const el = document.getElementById(elId);
        if (val === '-' || val === undefined || val === null) {
            el.innerHTML = '-';
            el.classList.remove('copy-cell');
        } else {
            el.innerHTML = `<span>${val}</span>`;
            el.classList.add('copy-cell');
        }
    };
    setSimpleCell(`stat-${prefix}-avg`, data.avg);
    setSimpleCell(`stat-${prefix}-power`, data.explosive_power);
    setSimpleCell(`stat-${prefix}-count`, data.count_match);
    setSimpleCell(`stat-${prefix}-total`, data.total);
}

// Removed unused element filter functions