(() => {
    const form = document.getElementById('nearbyForm');
    const fileInput = document.getElementById('nearbyFile');
    const latitudeSelect = document.getElementById('latitudeColumn');
    const longitudeSelect = document.getElementById('longitudeColumn');
    const nameSelect = document.getElementById('nameColumns');
    const submitButton = document.getElementById('nearbySubmit');
    const status = document.getElementById('nearbyStatus');
    const resultsSection = document.getElementById('nearbyResultsSection');
    const resultsRoot = document.getElementById('nearbyResults');
    let results = [];
    let sortColumn = 'distance_km';
    let sortAscending = true;
    let resultColumns = [];

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function guessCoordinateColumn(columns, kind) {
        const aliases = kind === 'latitude'
            ? ['latitude', 'lat', '纬度', 'y']
            : ['longitude', 'lon', 'long', '经度', 'x'];
        let best = null;
        columns.forEach((column, index) => {
            const header = String(column).normalize('NFKC').trim().toLowerCase();
            const normalized = header.replace(/[\s_\-/()（）\[\]【】.,:：°º]+/g, '');
            let score = 0;
            aliases.forEach((alias, aliasIndex) => {
                if (normalized === alias) score = Math.max(score, 100 - aliasIndex);
                // Accept common decorated headers such as "latitude (degrees)" or "lat_dd".
                const suffix = header.slice(alias.length);
                const latinPrefix = /^[a-z]+$/.test(alias) &&
                    (header === alias || /^[\s_\-/([（]/.test(suffix));
                if (latinPrefix) score = Math.max(score, 70 - aliasIndex);
                // Chinese headers are often qualified, e.g. "站点纬度" or "经度（度）".
                if (/^[\u3400-\u9fff]+$/.test(alias) && header.includes(alias)) {
                    score = Math.max(score, header === alias ? 100 - aliasIndex : 70 - aliasIndex);
                }
            });
            if (score && (!best || score > best.score)) best = { column, index, score };
        });
        return best ? columns[best.index] : '';
    }

    fileInput.addEventListener('change', async () => {
        resultsSection.hidden = true;
        submitButton.disabled = true;
        for (const select of [latitudeSelect, longitudeSelect, nameSelect]) {
            select.replaceChildren();
            select.disabled = true;
        }
        const file = fileInput.files[0];
        if (!file) return;
        setStatus('Reading columns…');
        const data = new FormData();
        data.append('file', file);
        data.append('csrf_token', form.elements.csrf_token.value);
        try {
            const response = await fetch('/api/nearby-places/columns', { method: 'POST', body: data });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Could not read the file.');
            const columns = payload.columns;
            for (const select of [latitudeSelect, longitudeSelect, nameSelect]) {
                columns.forEach((column, index) => {
                    const option = document.createElement('option');
                    option.value = column;
                    option.textContent = column || `Column ${index + 1}`;
                    select.append(option);
                });
                select.disabled = false;
            }
            const latGuess = guessCoordinateColumn(columns, 'latitude');
            const lonGuess = guessCoordinateColumn(columns, 'longitude');
            if (latGuess) latitudeSelect.value = latGuess;
            if (lonGuess) longitudeSelect.value = lonGuess;
            submitButton.disabled = !columns.length;
            setStatus(columns.length ? '' : 'The file has no columns.');
        } catch (error) {
            setStatus(error.message, true);
        }
    });

    function renderTable() {
        const sorted = [...results].sort((a, b) => {
            const left = a[sortColumn];
            const right = b[sortColumn];
            const compare = typeof left === 'number' && typeof right === 'number'
                ? left - right
                : String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
            return sortAscending ? compare : -compare;
        });
        const table = document.createElement('table');
        const head = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const column of resultColumns) {
            const th = document.createElement('th');
            th.textContent = `${column.label}${sortColumn === column.key ? (sortAscending ? ' ↑' : ' ↓') : ' ↕'}`;
            th.tabIndex = 0;
            th.setAttribute('aria-sort', sortColumn === column.key ? (sortAscending ? 'ascending' : 'descending') : 'none');
            const changeSort = () => {
                if (sortColumn === column.key) sortAscending = !sortAscending;
                else { sortColumn = column.key; sortAscending = true; }
                renderTable();
            };
            th.addEventListener('click', changeSort);
            th.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); changeSort(); }
            });
            headerRow.append(th);
        }
        head.append(headerRow);
        const body = document.createElement('tbody');
        for (const row of sorted) {
            const tr = document.createElement('tr');
            for (const column of resultColumns) {
                const td = document.createElement('td');
                td.textContent = column.key === 'distance_km'
                    ? Number(row[column.key]).toFixed(3)
                    : String(row[column.key] ?? '');
                tr.append(td);
            }
            body.append(tr);
        }
        table.append(head, body);
        resultsRoot.replaceChildren(table);
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const coordinates = document.getElementById('targetCoordinates').value.trim().split(/[\s,;]+/).filter(Boolean);
        if (coordinates.length !== 2 || coordinates.some(value => !Number.isFinite(Number(value)))) {
            setStatus('Enter latitude and longitude separated by a tab (or a space).', true);
            return;
        }
        const [latitude, longitude] = coordinates.map(Number);
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            setStatus('Latitude must be −90 to 90 and longitude −180 to 180.', true);
            return;
        }
        const file = fileInput.files[0];
        if (!file) { setStatus('Choose a .xlsx or .csv file.', true); return; }
        if (!nameSelect.selectedOptions.length) { setStatus('Select at least one place name column.', true); return; }
        const data = new FormData();
        data.append('csrf_token', form.elements.csrf_token.value);
        data.append('file', file);
        data.append('target_latitude', String(latitude));
        data.append('target_longitude', String(longitude));
        data.append('latitude_column', latitudeSelect.value);
        data.append('longitude_column', longitudeSelect.value);
        data.append('name_columns', JSON.stringify([...nameSelect.selectedOptions].map(option => option.value)));
        data.append('max_distance', document.getElementById('maxDistance').value);
        submitButton.disabled = true;
        setStatus('Searching…');
        try {
            const response = await fetch('/api/nearby-places', { method: 'POST', body: data });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Search failed.');
            results = payload.results;
            resultColumns = [
                ...payload.name_columns.map((name, index) => ({ key: `name_${index}`, label: name })),
                { key: 'latitude', label: 'Latitude' },
                { key: 'longitude', label: 'Longitude' },
                { key: 'distance_km', label: 'Distance (km)' },
            ];
            for (const [index] of payload.name_columns.entries()) {
                results.forEach(row => { row[`name_${index}`] = row.names[index] ?? ''; });
            }
            sortColumn = 'distance_km';
            sortAscending = true;
            document.getElementById('nearbyResultCount').textContent = `(${payload.matched_count})`;
            renderTable();
            resultsSection.hidden = false;
            setStatus('');
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            submitButton.disabled = false;
        }
    });
})();
