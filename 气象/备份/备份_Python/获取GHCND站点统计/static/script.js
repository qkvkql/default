let debounceTimer;
let currentSortBy = 'DATE';
let currentSortDir = 'desc';

document.addEventListener('DOMContentLoaded', () => {
    const hiddenId = document.getElementById('stationId');
    const visualInput = document.getElementById('stationInput');
    if(hiddenId && hiddenId.value && !visualInput.value) {
        visualInput.value = hiddenId.value; 
    }
});

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

function triggerServerSort(columnName) {
    if (currentSortBy === columnName) {
        currentSortDir = (currentSortDir === 'asc') ? 'desc' : 'asc';
    } else {
        currentSortBy = columnName;
        currentSortDir = 'desc';
    }
    fetchData();
}

async function fetchData() {
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('errorMsg');
    const recordsTbody = document.querySelector('#recordsTable tbody');
    const periodTbody = document.querySelector('#periodStatsTable tbody');
    
    recordsTbody.innerHTML = '';
    periodTbody.innerHTML = '';
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

        // 1. Global Stats
        updateStatRow('tmin', result.stats.TMIN);
        updateStatRow('tavg', result.stats.TAVG);
        updateStatRow('tmax', result.stats.TMAX);

        // 2. Period Summary (Updated with Counts)
        const updateSummaryCell = (id, data) => {
            const el = document.getElementById(id);
            if (data.val === '-') {
                el.innerHTML = '-';
            } else {
                // Display: Value (Used/Total)
                el.innerHTML = `${data.val} <span class="stat-subtext">(${data.used}/${data.total})</span>`;
            }
        };

        updateSummaryCell('sum-avg-min-tmin', result.period_summary.avg_min_tmin);
        updateSummaryCell('sum-avg-min-tmax', result.period_summary.avg_min_tmax);
        updateSummaryCell('sum-avg-max-tmin', result.period_summary.avg_max_tmin);
        updateSummaryCell('sum-avg-max-tmax', result.period_summary.avg_max_tmax);

        // 3. Period List
        if(result.period_stats.length === 0) {
            periodTbody.innerHTML = '<tr><td colspan="8">No period data available.</td></tr>';
        } else {
            result.period_stats.forEach(p => {
                const tr = document.createElement('tr');
                
                const renderWithTooltip = (obj) => {
                    if (obj.val === '-' || !obj.dates || obj.dates.length === 0) {
                        return obj.val;
                    }
                    const dateText = obj.dates.length > 20 
                        ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more`
                        : obj.dates.join('\n');
                    
                    return `<div class="tooltip-container">
                                ${obj.val}
                                <span class="tooltip-note">${dateText}</span>
                            </div>`;
                };

                tr.innerHTML = `
                    <td>${p.range}</td>
                    <td>${renderWithTooltip(p.min_tmin)}</td>
                    <td>${renderWithTooltip(p.max_tmin)}</td>
                    <td>${renderWithTooltip(p.min_tmax)}</td>
                    <td>${renderWithTooltip(p.max_tmax)}</td>
                    <td>${p.cnt_tmin}</td>
                    <td>${p.cnt_tavg}</td>
                    <td>${p.cnt_tmax}</td>
                `;
                periodTbody.appendChild(tr);
            });
        }

        // 4. Record List
        if (result.records.length === 0) {
            recordsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No records found.</td></tr>';
        } else {
            result.records.forEach(row => {
                const tr = document.createElement('tr');
                tr.dataset.element = row.ELEMENT; 
                tr.innerHTML = `<td>${row.ID}</td><td>${row.DATE}</td><td>${row.ELEMENT}</td><td>${row.DATA_VALUE}</td>`;
                recordsTbody.appendChild(tr);
            });
        }
        applyElementFilter();

    } catch (err) {
        errorMsg.textContent = "Network Error: " + err;
    } finally {
        loading.classList.add('hidden');
    }
}

function updateStatRow(prefix, data) {
    const renderCell = (obj) => {
        if (!obj || obj.val === '-') return '-';
        if (!obj.dates || obj.dates.length === 0) return obj.val;

        const dateText = obj.dates.length > 20 
            ? obj.dates.slice(0, 20).join('\n') + `\n...and ${obj.dates.length - 20} more`
            : obj.dates.join('\n');

        return `<div class="tooltip-container">
                    ${obj.val}
                    <span class="tooltip-note">${dateText}</span>
                </div>`;
    };

    document.getElementById(`stat-${prefix}-min`).innerHTML = renderCell(data.min);
    document.getElementById(`stat-${prefix}-max`).innerHTML = renderCell(data.max);
    document.getElementById(`stat-${prefix}-avg`).textContent = data.avg;
    document.getElementById(`stat-${prefix}-count`).textContent = data.count_match;
}

function toggleElementFilter(event) {
    if(event) event.stopPropagation();
    const dropdown = document.getElementById('elementFilterDropdown');
    dropdown.classList.toggle('hidden');
}

function applyElementFilter() {
    const checkboxes = document.querySelectorAll('#elementFilterDropdown input[type="checkbox"]');
    const checkedValues = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const tbody = document.querySelector('#recordsTable tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const rowType = row.dataset.element;
        row.style.display = checkedValues.includes(rowType) ? '' : 'none';
    });
}

document.addEventListener('click', function(event) {
    const header = document.querySelector('.filter-header');
    const dropdown = document.getElementById('elementFilterDropdown');
    if (header && !header.contains(event.target) && dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
    }
});