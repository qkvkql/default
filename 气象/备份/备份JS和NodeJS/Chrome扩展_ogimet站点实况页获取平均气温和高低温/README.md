# Ogimet Statistical Temperatures

Manifest V3 Chrome extension for the decoded Ogimet SYNOP hourly page. It runs only on `https://ogimet.com/cgi-bin/gsynres*` pages.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Open a station page, for example `https://ogimet.com/cgi-bin/gsynres?ind=44221&decoded=yes&ndays=7&ano=2026&mes=10&day=26&hora=14`.

## Use

`ind` is read as the WMO station number. The three date fields accept strict `YYYY-MM-DD` text. The page period dropdown controls `ndays` (7 or 30). Page data end date updates `ano`, `mes`, and `day`; the URL `hora` remains the latest observation cutoff and is separate from the statistical end time. The page hour defaults from the URL (12 UTC if absent). If necessary, the extension reloads with the selected date and `ndays`, then calculates the requested inclusive target date range. Statistical end time defaults to 12 UTC. The range cannot exceed the selected page period or end after the page data end date.

Check **Is Chinese Station** only for Chinese stations. It defaults to unchecked. Results show Date, min, max, and avg; the three temperature columns are copied as tab-separated values where clipboard access is available. There is no downloaded-archive converter.

## Calculation copied from `get_daily_temperature_ogimet(wmo, tz)`

The Python function treats the target date as a UTC calendar date whose 24-hour window starts at midnight minus `tz` hours and ends 24 hours later. Here, `tz` is the panel's statistical end hour (default 12), matching the function parameter and boundary calculation. At the default 12, the UTC interval runs from the previous date at 12:00 through the target date at 12:00. The interval includes both endpoints. Average uses T at the eight exact 3-hour timestamps from 21 hours before the end through the end, and is returned only when all eight valid observations exist (rounded to two decimals, with midpoint ties rounded away from zero).

For a Chinese station, min and max use Tn and Tx on the exact end-hour row when both exist. Otherwise, the extension combines hourly T from the full interval with reported Tn/Tx from the second half of the interval (midpoint through end, inclusive), matching the Python function's `in_half_2` selection. This excludes the reported-extreme value at the starting boundary, which belongs to the previous target date. When Tn or Tx values exist, their respective extreme is compared with hourly T; a difference of 10°C or more invalidates that min/max result. Temperature values follow the script's valid range (> -100°C and < 60°C); min/max values are rounded to one decimal. Missing results display as an em dash (the script's `-999` sentinel).

The parser expects the decoded Ogimet table structure used in the supplied Python script: date in the first column, time in the second, T in the third, Tx at zero-based column 6, and Tn at column 7.

