let debounceTimer;
let currentSortBy = 'DATE';
let currentSortDir = 'desc';

// --- PERIOD SORT & VISIBILITY STATE ---
let rawPeriodStats = [];
let periodSortCol = 'range';
let periodSortDir = 'desc';

let periodColVisibility = {
    min_tmin: true,
    max_tmin: true,
    min_tmax: true,
    max_tmax: true
};

document.addEventListener('DOMContentLoaded', () => {
    const hiddenId = document.getElementById('stationId');
    const visualInput = document.getElementById('stationInput');
    if(hiddenId && hiddenId.value && !visualInput.value) {
        visualInput.value = hiddenId.value; 
    }
});

// --- COPY FUNCTION ---
document.addEventListener('click', function(e) {
    const target = e.target.closest('.copyable');
    if (target) {
        const text = target.innerText.trim();
        if (text && text !== '-') {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Copied: ${text}`);
            }).catch(err => { console.error('Failed to copy: ', err); });
        }
    }
});

function showToast(message) {
    const toast = document.getElementById("copyToast");
    toast.textContent = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

// --- SEARCH ---
async function searchStations() {
    const input = document.getElementById('stationInput');
    const dataList = document.getElementById('stationOptions');
    const hiddenId = document.getElementById('stationId');
    const query = input.value;

    if (query.includes(' - ')) {
        hiddenId.value = query.split(' - ')[0];
        return;
    } else {
        hiddenId.value = query; 
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (query.length < 3) return;
        try {
            const response = await fetch(`/search_stations?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            dataList.innerHTML = '';
            results.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value; 
                dataList.appendChild(option);
            });
        } catch (err) { console.error(err); }
    }, 300);
}

// --- RECORD LIST SERVER SORT ---
function triggerServerSort(columnName) {
    if (currentSortBy === columnName) {
        currentSortDir = (currentSortDir === 'asc') ? 'desc' : 'asc';
    } else {
        currentSortBy = columnName;
        currentSortDir = 'desc';
    }
    fetchData();
}

// --- PERIOD TABLE FUNCTIONS ---
function sortPeriodTable(column) {
    if (periodSortCol === column) {
        periodSortDir = (periodSortDir === 'asc') ? 'desc' : 'asc';
    } else {
        periodSortCol = column;
        periodSortDir = 'desc'; 
    }
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

    const setHeaderDisplay = (id, visible) => {
        document.getElementById(id).style.display = visible ? '' : 'none';
    };
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
        if (['range'].includes(periodSortCol)) {
            valA = a[periodSortCol]; valB = b[periodSortCol];
        } else if (['cnt_tmin', 'cnt_tavg', 'cnt_tmax'].includes(periodSortCol)) {
            valA = a[periodSortCol]; valB = b[periodSortCol];
        } else {
            valA = (a[periodSortCol].val === '-') ? -9999 : a[periodSortCol].val;
            valB = (b[periodSortCol].val === '-') ? -9999 : b[periodSortCol].val;
        }
        if (valA < valB) return periodSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return periodSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    rawPeriodStats.forEach(p => {
        const tr = document.createElement('tr');
        
        const renderWithTooltip = (obj) => {
            if (obj.val === '-' || !obj.dates || obj.dates.length === 0) {
                return obj.val;
            }
            const dateText = obj.dates.length > 20 
                ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more`
                : obj.dates.join('\n');
            
            return `<div class="tooltip-container">
                        <span class="copyable" title="Click to copy">${obj.val}</span>
                        <span class="tooltip-note">${dateText}</span>
                    </div>`;
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
    const errorMsg = document.getElementById('errorMsg');
    const recordsTbody = document.querySelector('#recordsTable tbody');
    
    // Get checked elements for filtering
    const checkboxes = document.querySelectorAll('#elementFilterDropdown input[type="checkbox"]');
    const selectedElements = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

    recordsTbody.innerHTML = '';
    rawPeriodStats = [];
    renderPeriodTable();

    errorMsg.textContent = '';
    loading.classList.remove('hidden');

    const finalStationId = document.getElementById('stationId').value || document.getElementById('stationInput').value;

    const payload = {
        station_id: finalStationId,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        month_filter: document.getElementById('monthFilter').value,
        period: document.querySelector('input[name="period"]:checked').value,
        hemisphere: document.querySelector('input[name="hemisphere"]:checked').value,
        sort_by: currentSortBy,
        sort_dir: currentSortDir,
        // Send selected elements for Record List filtering
        selected_elements: selectedElements,
        tmin_val: document.getElementById('tminVal').value,
        tmin_dir: document.getElementById('tminDir').value,
        tavg_val: document.getElementById('tavgVal').value,
        tavg_dir: document.getElementById('tavgDir').value,
        tmax_val: document.getElementById('tmaxVal').value,
        tmax_dir: document.getElementById('tmaxDir').value,
    };

    try {
        const response = await fetch('/get_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === 'error') {
            errorMsg.textContent = "Error: " + result.message;
            return;
        }

        updateStatRow('tmin', result.stats.TMIN);
        updateStatRow('tavg', result.stats.TAVG);
        updateStatRow('tmax', result.stats.TMAX);

        const updateSummaryCell = (id, data) => {
            const el = document.getElementById(id);
            if (data.val === '-') {
                el.innerHTML = '-';
            } else {
                el.innerHTML = `<span class="copyable" title="Click to copy">${data.val}</span> <span class="stat-subtext">(${data.used}/${data.total})</span>`;
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
                tr.dataset.element = row.ELEMENT; 
                tr.innerHTML = `
                    <td><span class="copyable" title="Click to copy">${row.ID}</span></td>
                    <td><span class="copyable" title="Click to copy">${row.DATE}</span></td>
                    <td>${row.ELEMENT}</td>
                    <td><span class="copyable" title="Click to copy">${row.DATA_VALUE}</span></td>
                `;
                recordsTbody.appendChild(tr);
            });
        }
        // Note: applyElementFilter is no longer strictly needed for hiding since server filters,
        // but we keep the visual check sync.
        
    } catch (err) {
        errorMsg.textContent = "Network Error: " + err;
    } finally {
        loading.classList.add('hidden');
    }
}

function updateStatRow(prefix, data) {
    const renderCell = (obj) => {
        if (!obj || obj.val === '-') return '-';
        if (!obj.dates || obj.dates.length === 0) return `<span class="copyable" title="Click to copy">${obj.val}</span>`;

        const dateText = obj.dates.length > 20 
            ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more`
            : obj.dates.join('\n');

        return `<div class="tooltip-container">
                    <span class="copyable" title="Click to copy">${obj.val}</span>
                    <span class="tooltip-note">${dateText}</span>
                </div>`;
    };

    document.getElementById(`stat-${prefix}-min`).innerHTML = renderCell(data.min);
    document.getElementById(`stat-${prefix}-max`).innerHTML = renderCell(data.max);
    
    document.getElementById(`stat-${prefix}-avg`).innerHTML = `<span class="copyable" title="Click to copy">${data.avg}</span>`;
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