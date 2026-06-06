# NASA Worldview Brightness Temperature Celsius

Chrome extension for `https://worldview.earthdata.nasa.gov/`.

When a `Brightness Temperature` layer's `View Options` panel is open, it reads that panel's left Kelvin threshold minimum, converts it to Celsius with `K - 273.15`, and shows the value by replacing the large `Worldview` title. When the options panel closes, the last Celsius value remains visible until another `Brightness Temperature` threshold is read.

## Install

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on `Developer mode`.
3. Click `Load unpacked`.
4. Select this extension folder.
5. Open or refresh NASA Worldview.

For example, `223.2 K` is displayed as `-50.0&deg;C`.
