# Console Styling Functions Reference

You can use these functions in the browser's developer console (F12) to quickly style the table.

## Basic Usage

All styling functions accept a `styles` object containing CSS properties in camelCase (e.g., `{ backgroundColor: 'red', fontWeight: 'bold' }`).

| Function | Description | Example |
| :------- | :---------- | :------ |
| `setAllRowsStyle(styles)` | Styles all body rows | `setAllRowsStyle({ height: '40px' })` |
| `setRowStyle(index, styles)` | Styles a specific row (0-indexed) | `setRowStyle(0, { color: 'blue' })` |
| `setAllColumnsStyle(styles)` | Styles all cells in the table | `setAllColumnsStyle({ textAlign: 'center' })` |
| `setColumnStyle(index, styles)` | Styles a specific column (0-indexed) | `setColumnStyle(1, { width: '200px' })` |
| `setCellStyle(r, c, styles)` | Styles a specific cell | `setCellStyle(0, 0, { fontSize: '20px' })` |
| `setHeaderStyle(styles)` | Styles all header rows | `setHeaderStyle({ backgroundColor: '#333' })` |
| `clearStyles()` | Removes all custom styles | `clearStyles()` |

## Temperature Coloring (.temp)

Each styling function has a `.temp()` variant that automatically colors cells based on their numerical value (treating them as temperature).

- `setAllRowsStyle.temp()`
- `setRowStyle.temp(index)`
- `setAllColumnsStyle.temp()`
- `setColumnStyle.temp(index)`
- `setCellStyle.temp(rowIndex, colIndex)`
- `setHeaderStyle.temp()`

**Example:** `setColumnStyle.temp(2)` will apply a heat-map color to the 3rd column.

## Available Style Properties

Compatible properties include:
- `color`, `backgroundColor`
- `fontWeight`, `fontSize`, `textAlign`
- `borderStyle`, `height`, `width`
- `padding`, `margin`, `whiteSpace`
