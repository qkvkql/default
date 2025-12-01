let eventSource = null;
const consoleDiv = document.getElementById('console-output');
const statusDiv = document.getElementById('status-indicator');

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