# RP5 Statistical Temperatures

A Manifest V3 Chrome extension for RP5 weather archive pages. It adds a small panel on `https://rp5.ru/*` pages to calculate minimum, maximum, and the mean of the 8 scheduled temperature observations for one statistical date or a date range of up to 30 days.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Open a station's hourly archive page, such as `https://rp5.ru/Weather_archive_in_Terelj`.

## Use

Enter all dates (**Period end date**, **Target start date**, and **Target end date**) as `YYYY-MM-DD`. Enter the statistical **end time** as exactly two digits from `00` to `24`; `20` means 20:00, and `24` means midnight at the start of the next day. Choose the RP5 table selection period (7 or 30 days). Check **Is Chinese Station** for Chinese stations: only Tn/Tx at the statistical end time are used; values at other times are ignored. If either end-time value is missing, the corresponding minimum or maximum is derived from hourly T values. Leave it unchecked for other stations. The target end must not be later than the archive period end date. Click **Get min/max/avg**; the extension applies the date and selection period on the RP5 page and clicks its **Select** control. When the calculation finishes, the min, max, and average are copied to the clipboard as three tab-separated values.

For each target statistical date, the 8-point mean uses observations at end-time minus 21, 18, 15, 12, 9, 6, 3, and 0 hours. Across a date range, it averages all available scheduled observations and displays the available/required count (for example, `55/56`). The minimum and maximum combine the hourly `T` values and reported `Tn`/`Tx` values from the inclusive statistical-day interval. RP5 times are treated as the displayed wall clock, independent of the computer's timezone.

The extension reads the archive table's `T`, `Tn`, and `Tx` columns. Missing temperatures are omitted from the calculations; if no scheduled point is available, the average is shown as `—`.

## Convert a downloaded archive

Expand **Generate formatted Excel file from RP5 downloaded archive** at the bottom of the panel and upload an RP5 `.xls`, `.xlsx`, or `.csv` file. Binary Excel `.xls` workbooks are supported directly. The source file can belong to any station. Set **Statistical end time** and the **Is Chinese Station** checkbox in the panel, then click **Generate target file** to download an `.xlsx` workbook with one row per calendar date and columns for station number/name, a `Date` in `YYYY-MM-DD` format, year, month, day, minimum, maximum, average, and `Tx`. The average is populated only when all eight scheduled temperature observations are available for that date; otherwise, it is blank. The `Tx` column contains the source value at that date's statistical end time, or is blank if no value is available. The converter reads the source file's `T`, `Tn`, and `Tx` columns and uses the same daily statistics calculation as the page tool. Year, month, and day are exported as text, with month and day zero-padded. If the source archive does not include a station number in its metadata, that output cell is left blank.

The extension bundles the SheetJS Community Edition browser reader to support binary `.xls` files. See [LICENSE-SheetJS.txt](LICENSE-SheetJS.txt) for its Apache 2.0 license.
