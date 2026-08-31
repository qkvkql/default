# NMC 8-Point Average Temperature

Chrome extension for `www.nmc.cn` station forecast pages.

## What it does

- Detects dedicated station pages such as `https://www.nmc.cn/publish/forecast/AHE/saihanba.html`.
- Opens the `24小时实况曲线` chart when the page is recognized.
- Reads the Highcharts temperature series for the recent 24-hour chart.
- Calculates the latest statistical-date key-hour average from `23:00, 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00`.
- Shows all key-hour values found, marks missing values, and copies the average to the clipboard.

## Install locally

1. Open Chrome Extensions: `chrome://extensions/`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder.
5. Open an NMC station page and use the floating panel.
