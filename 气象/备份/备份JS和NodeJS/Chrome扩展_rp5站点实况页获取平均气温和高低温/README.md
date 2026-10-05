# RP5 Statistical Temperatures

A Manifest V3 Chrome extension for RP5 weather archive pages. It adds a small panel on `https://rp5.ru/*` pages to calculate minimum, maximum, and the mean of the 8 scheduled temperature observations for one statistical date or a date range of up to 30 days.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Open a station's hourly archive page, such as `https://rp5.ru/Weather_archive_in_Terelj`.

## Use

Enter all dates (**Period end date**, **Target start date**, and **Target end date**) as `YYYY-MM-DD`. Enter the statistical **end time** as exactly two digits from `00` to `24`; `20` means 20:00, and `24` means midnight at the start of the next day. Choose the RP5 table selection period (7 or 30 days). The target end must not be later than the archive period end date. Click **Get min/max/avg**; the extension applies the date and selection period on the RP5 page and clicks its **Select** control. When the calculation finishes, the min, max, and average are copied to the clipboard as three tab-separated values.

For each target statistical date, the 8-point mean uses observations at end-time minus 21, 18, 15, 12, 9, 6, 3, and 0 hours. Across a date range, it averages all available scheduled observations and displays the available/required count (for example, `55/56`). The minimum and maximum combine the hourly `T` values and reported `Tn`/`Tx` values from the inclusive statistical-day interval. RP5 times are treated as the displayed wall clock, independent of the computer's timezone.

The extension reads the archive table's `T`, `Tn`, and `Tx` columns. Missing temperatures are omitted from the calculations; if no scheduled point is available, the average is shown as `—`.
