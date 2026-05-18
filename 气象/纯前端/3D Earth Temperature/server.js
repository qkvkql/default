const express = require('express');
const xlsx    = require('xlsx');
const path    = require('path');

const app  = express();
const PORT = 5500;

const EXCEL_PATH = 'D:\\文档\\GIT SYNC\\default\\气象\\For_Python_站点信息和记录.xlsx';

// Serve all static files from this directory
app.use(express.static(__dirname));

// Fresh Excel read on every call
app.get('/api/stations', (req, res) => {
  try {
    const wb = xlsx.readFile(EXCEL_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: null });

    const stations = rows
      .map(row => {
        const lat = parseFloat(row.latitude);
        const lon = parseFloat(row.longitude);
        if (isNaN(lat) || isNaN(lon) || !row.cn_name) return null;

        const station = {
          name: String(row.cn_name),
          lat,
          lon,
        };
        if (row.date_text != null && String(row.date_text).trim()) {
          station.date_text = String(row.date_text).trim();
        }

        const minV = parseFloat(row.min);
        const maxV = parseFloat(row.max);
        const avgV = parseFloat(row.avg);
        if (!isNaN(minV)) station.min = minV;
        if (!isNaN(maxV)) station.max = maxV;
        if (!isNaN(avgV)) station.avg = avgV;

        return station;
      })
      .filter(Boolean);

    console.log(`[${new Date().toLocaleTimeString()}] Served ${stations.length} stations from Excel`);
    res.json(stations);
  } catch (err) {
    console.error('Failed to read Excel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  🌏 Weather Station Globe`);
  console.log(`  Running at: http://localhost:${PORT}\n`);
});
