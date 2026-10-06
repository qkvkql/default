let eventSource = null;
const consoleDiv = document.getElementById('console-output');
const statusDiv = document.getElementById('status-indicator');
let latestAverageValues = null;
let consoleStations = [];

function renderConsoleStations() {
    const stationInput = document.getElementById('average-station-input');
    const optionsList = document.getElementById('average-station-options');
    const searchText = stationInput.value.trim().toLowerCase();
    const filteredStations = consoleStations.filter(station =>
        station.name.toLowerCase().includes(searchText) || station.id.toLowerCase().includes(searchText)
    );

    optionsList.replaceChildren();
    filteredStations.forEach(station => {
        optionsList.appendChild(new Option(`${station.name} (${station.id})`));
    });
}

async function loadConsoleStations() {
    const stationInput = document.getElementById('average-station-input');
    if (!stationInput) return;
    try {
        const response = await fetch('/console_stations');
        const stations = await response.json();
        if (!response.ok) throw new Error(stations.error || 'Could not load stations.');
        if (!stations.length) {
            stationInput.placeholder = 'No RP5 stations found';
            return;
        }
        consoleStations = stations;
        renderConsoleStations();
    } catch (error) {
        stationInput.placeholder = 'Station list unavailable';
        log(`System: ${error.message}`, 'system');
    }
}

async function calculateStationAverage() {
    const button = document.getElementById('btn-average');
    const copyButton = document.getElementById('btn-copy-average');
    const date = document.getElementById('average-date').value;
    const source = document.getElementById('average-source').value;
    const stationLabel = document.getElementById('average-station-input').value.trim();
    const selectedStation = consoleStations.find(item => `${item.name} (${item.id})` === stationLabel);
    const station = selectedStation?.id;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        log('System: Enter the target date as YYYY-MM-DD.', 'system');
        return;
    }
    if (!station) {
        log('System: Select a station first.', 'system');
        return;
    }
    button.disabled = true;
    copyButton.disabled = true;
    latestAverageValues = null;
    log(`System: Calculating ${source} average for station ${station} on ${date}...`, 'system');
    setStatus('Calculating...', '#2196F3');
    try {
        const response = await fetch('/calculate_average', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, source, station })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Calculation failed.');
        const result = data.result || {};
        latestAverageValues = [result.min, result.max, result.avg];
        copyButton.disabled = false;
        log(`${data.station} | ${data.source} | ${data.date} | min: ${result.min}°C, max: ${result.max}°C, avg: ${result.avg}°C`);
        setStatus('Finished', '#4CAF50');
    } catch (error) {
        log(`System: ${error.message}`, 'system');
        setStatus('Error', '#ff4d4d');
    } finally {
        button.disabled = false;
    }
}

async function copyStationAverage() {
    if (!latestAverageValues) return;
    const copyButton = document.getElementById('btn-copy-average');
    try {
        await navigator.clipboard.writeText(latestAverageValues.join('\t'));
        log('System: min, max, and avg copied as tab-separated values.', 'system');
    } catch (error) {
        log(`System: Could not copy to clipboard: ${error.message}`, 'system');
    }
}

document.getElementById('average-station-input')?.addEventListener('input', renderConsoleStations);

loadConsoleStations();

function log(message, type='normal') {
    const p = document.createElement('div');
    p.classList.add('log-line');
    if (type === 'system') p.classList.add('log-sys');
    p.textContent = message;
    consoleDiv.appendChild(p);
    // Auto scroll to bottom
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function setStatus(msg, color='#666') {
    statusDiv.textContent = msg;
    statusDiv.style.color = color;
}

function runScript(scriptName) {
    if (eventSource) {
        log("System: A script is already running. Please stop it first.", 'system');
        return;
    }

    log(`System: Starting ${scriptName}...`, 'system');
    setStatus("Running...", "#2196F3");

    // Use EventSource for real-time streaming
    eventSource = new EventSource(`/run_script/${scriptName}`);

    /***************************************** 这一段只为解决“必须刷新一次页面才能成功导出.js数据”的问题 END *****************************************/
    // 1. Add this to close connection if user closes/refreshes tab
    window.addEventListener('beforeunload', () => {
        if (eventSource) {
            eventSource.close();
        }
    });

    // 2. Ensure you close the connection in your runScript function
    eventSource.onmessage = function(e) {
        if (e.data === "[PROCESS FINISHED]") {
            eventSource.close(); // <--- CRITICAL: Free up the socket!
            eventSource = null;  // <--- Reset variable
            log("System: Process finished.", 'system');
            setStatus("Finished", "#4CAF50");
        } else {
            log(e.data);
        }
    };

    // 3. Add an error handler that closes the connection
    eventSource.onerror = function(e) {
        // If server dies, close the connection so it doesn't zombie-retry forever
        eventSource.close();
        eventSource = null;
        log("System: Connection lost.", 'system');
    };
    /***************************************** 这一段只为解决“必须刷新一次页面才能成功导出.js数据”的问题 END *****************************************/

    eventSource.onmessage = function(e) {
        if (e.data === "[PROCESS FINISHED]") {
            closeConnection();
            log("System: Process finished.", 'system');
            setStatus("Finished", "#4CAF50");
        } else {
            log(e.data);
        }
    };

    eventSource.onerror = function(e) {
        // Often fires when connection closes normally, but we handle that in onmessage
        // closeConnection();
    };
}

function stopScript() {
    fetch('/stop_script', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            log(`System: ${data.status}`, 'system');
            closeConnection();
            setStatus("Stopped", "#ff4d4d");
        })
        .catch(err => log("System: Error stopping script", 'system'));
}

function closeConnection() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}

function clearConsole() {
    consoleDiv.innerHTML = '';
    log("System: Console cleared.", 'system');
    setStatus("Idle", "#666");
}

function openVisualization() {
    // Opens the original existing html file in a new tab
    window.open('/view_image', '_blank');
}
