// Get DOM elements
const outputBox = document.getElementById('console-output');
const btnA = document.getElementById('btn-a');
const btnB = document.getElementById('btn-b');
const btnClear = document.getElementById('btn-clear');
const btnStop = document.getElementById('btn-stop'); // Get the element

// Helper function to append text to console
function logToConsole(text) {
    const timestamp = new Date().toLocaleTimeString();
    outputBox.textContent += `[${timestamp}] ${text}\n`;
    // Auto scroll to bottom
    outputBox.scrollTop = outputBox.scrollHeight;
}

// Function to call the backend
async function runScript(endpoint) {
    logToConsole(`>>> Requesting ${endpoint}...`);
    
    try {
        const response = await fetch(endpoint, { method: 'POST' });
        
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        logToConsole(data.output);
        logToConsole(">>> Execution finished.\n");

    } catch (error) {
        logToConsole(`!!! Error: ${error.message}\n`);
    }
}

// Event Listeners
btnA.addEventListener('click', () => runScript('/export_to_html'));
btnB.addEventListener('click', () => runScript('/scrape_wmo'));

// Clear Console Logic
btnClear.addEventListener('click', () => {
    outputBox.textContent = "Console cleared.\n";
});

// Stop Button Logic
btnStop.addEventListener('click', async () => {
    logToConsole(">>> Attempting to STOP script...");
    
    try {
        const response = await fetch('/stop', { method: 'POST' });
        const data = await response.json();
        
        if(data.status === 'success') {
            logToConsole(">>> SYSTEM: " + data.message);
        } else {
            logToConsole(">>> SYSTEM: " + data.message);
        }
    } catch (error) {
        logToConsole(`!!! Error stopping script: ${error.message}\n`);
    }
});