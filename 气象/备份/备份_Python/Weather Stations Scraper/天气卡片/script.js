// Import from Parent Folder
import { array_of_stations_by_different_filters } from '../stations_data.js';
import { cold_days } from './cold_days.js';
let source_data = [];

switch(1){
    case 1:
        source_data = cold_days;
        break;
    default:
        source_data = array_of_stations_by_different_filters['汇总']
}

let my_date = '2025-12-03';

// DOM Elements
const selector = document.getElementById('locationSelector');
const card = document.getElementById('weatherCard');

// Map HTML elements to JS variables
const els = {
    date: document.getElementById('date'),
    city: document.getElementById('cityName'),
    state: document.getElementById('subLocation'),
    range: document.getElementById('tempRange'), // Main Big Display
    avg: document.getElementById('avgTemp'),     // Small Detail
    elev: document.getElementById('elevation'),
    lat: document.getElementById('lat'),
    lon: document.getElementById('lon')
};

// 1. Initialize Dropdown
function init() {
    // Access the array from the imported object
    const records = source_data;

    // Create dropdown options
    records.forEach((station, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = station.cn_name;
        selector.appendChild(option);
    });

    // Load the first location immediately if data exists
    if (records.length > 0) {
        updateCard(0);
    }
}

// 2. Update Card Logic
function updateCard(index) {
    const data = source_data[index];

    // Safety: Stop if data doesn't exist
    if (!data) return;

    // --- HELPER: Safely format temperature to 1 decimal place ---
    // Works for numbers (12.53), strings ("12.5"), or mixed inputs
    function fv(v, i){
        if(v === ''){return '--'}
        else if(typeof(v) === 'number'){
            if(i === 2){
                if(v.toString().split('.')[1].trim().length < 2){
                    return v.toFixed(1)
                }else{
                    return v.toFixed(2)
                }
            }
            return v.toFixed(i)
        }
    }

    // --- TEXT UPDATES ---
    els.city.innerText = data.cn_name || "Unknown";
    if(data.country === '中国'){
        els.state.innerText = data.level1 + ' ' + data.level2;
    }else{
        els.state.innerText = data.country + ' ' + data.level1;
    }
    
    // MAIN: Format Min and Max
    const minVal = fv(data.min, 1);
    const maxVal = fv(data.max, 1);
    els.range.innerText = `${minVal}° ~ ${maxVal}°`;
    
    // SUB: Format Average
    els.avg.innerText = fv(data.avg, 2);

    // DETAILS: Elevation & Coords
    els.elev.innerText = data.elev || "--";
    
    // Handle Lat/Lon safely
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    els.lat.innerText = isNaN(lat) ? "Lat: --" : `Lat: ${lat.toFixed(2)}`;
    els.lon.innerText = isNaN(lon) ? "Lon: --" : `Lon: ${lon.toFixed(2)}`;

    els.date.innerText = my_date;

    // --- VISUAL UPDATES ---
    // Pass the raw number to the theme manager, not the string
    updateTheme(Number(data.avg));
}

// 3. Theme Manager (Colors)
function updateTheme(avgTemp) {
    // Remove all theme classes first
    card.classList.remove('cold', 'warm', 'freezing');

    if (avgTemp < -5) {
        // Freezing (Light Icy Blue)
        card.classList.add('freezing');
    } else if (avgTemp >= -5 && avgTemp < 15) {
        // Cold (Deep Blue)
        card.classList.add('cold');
    } else {
        // Warm (Orange/Sunset)
        card.classList.add('warm');
    }
}

// 4. Listen for user changes
selector.addEventListener('change', (e) => {
    updateCard(e.target.value);
});

// --- NEW DATE LOGIC ---
const datePicker = document.getElementById('datePicker');
const dateText = document.getElementById('dateText');

// 1. Set a default value (e.g., today or your hardcoded date)
datePicker.value = my_date;
dateText.innerText = my_date;

// 2. Listen for changes
datePicker.addEventListener('change', (e) => {
    // Update the text on the card immediately
    dateText.innerText = e.target.value;
});

// Start the app
init();