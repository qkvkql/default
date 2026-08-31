(() => {
  const REQUEST_EVENT = "nmc-avg-read-chart";
  const RESPONSE_EVENT = "nmc-avg-chart-data";

  if (window.__nmcAvgReaderInstalled) {
    return;
  }
  window.__nmcAvgReaderInstalled = true;

  window.addEventListener(REQUEST_EVENT, (event) => {
    const requestId = event.detail && event.detail.requestId;
    try {
      const payload = readFromHighcharts() || readFromSvg();
      if (!payload) {
        throw new Error("没有找到可读取的 24 小时实况曲线。");
      }

      window.dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
        detail: { requestId, payload }
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
        detail: { requestId, error: error.message || String(error) }
      }));
    }
  });

  function readFromHighcharts() {
    const charts = (window.Highcharts && window.Highcharts.charts) || [];
    const chart = charts.find((item) => item && item.renderTo && item.renderTo.id === "hours")
      || charts.find((item) => item && item.renderTo && item.renderTo.closest && item.renderTo.closest("#hour24Chart"));

    if (!chart) {
      return null;
    }

    const temperatureSeries = chart.series.find((series) => /温度/.test(series.name || ""));
    if (!temperatureSeries) {
      return null;
    }

    chart.series.forEach((series) => {
      const isTemperature = series === temperatureSeries;
      if (typeof series.setVisible === "function" && series.visible !== isTemperature) {
        series.setVisible(isTemperature, false);
      }
    });
    if (typeof chart.redraw === "function") {
      chart.redraw();
    }

    const categories = readCategories(chart);
    const sourcePoints = temperatureSeries.points?.length ? temperatureSeries.points : temperatureSeries.data || [];
    const points = sourcePoints.map((point, index) => ({
      index,
      category: point.category != null ? String(point.category) : String(categories[index] || ""),
      value: typeof point.y === "number" ? point.y : null
    }));

    if (!points.length) {
      return null;
    }

    return {
      title: readTitle(),
      categories,
      points,
      source: "highcharts"
    };
  }

  function readCategories(chart) {
    if (chart.xAxis && chart.xAxis[0] && Array.isArray(chart.xAxis[0].categories)) {
      return chart.xAxis[0].categories.map(String);
    }

    const optionsCategories = chart.options?.xAxis?.categories;
    if (Array.isArray(optionsCategories)) {
      return optionsCategories.map(String);
    }

    return Array.from(document.querySelectorAll("#hours .highcharts-xaxis-labels text"))
      .map((item) => item.textContent.trim())
      .filter(Boolean);
  }

  function readFromSvg() {
    const root = document.querySelector("#hours svg.highcharts-root");
    if (!root) {
      return null;
    }

    const categories = Array.from(root.querySelectorAll(".highcharts-xaxis-labels text"))
      .map((item) => item.textContent.trim())
      .filter(Boolean);
    const axisGroups = Array.from(root.querySelectorAll(".highcharts-yaxis-labels"))
      .map((group) => Array.from(group.querySelectorAll("text"))
        .map((item) => ({
          value: Number(item.textContent.trim()),
          y: Number(item.getAttribute("y"))
        }))
        .filter((item) => Number.isFinite(item.value) && Number.isFinite(item.y)))
      .filter((labels) => labels.length >= 2);
    const yTicks = findTemperatureAxisLabels(axisGroups);

    if (!categories.length || yTicks.length < 2) {
      return null;
    }

    const tempAxis = yTicks.sort((a, b) => a.value - b.value);
    const low = tempAxis[0];
    const high = tempAxis[tempAxis.length - 1];
    if (!low || !high || high.value === low.value || high.y === low.y) {
      return null;
    }

    const orangeSeries = findOrangeTemperatureSeries(root);
    if (!orangeSeries) {
      return null;
    }

    const transform = readTranslate(orangeSeries.getAttribute("transform") || "");
    const markers = Array.from(orangeSeries.querySelectorAll(".highcharts-point"))
      .map((marker) => readMarkerCenter(marker, transform))
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);

    if (!markers.length) {
      return null;
    }

    const points = markers.map((marker, index) => ({
      index,
      category: categories[index] || "",
      value: yToValue(marker.y, low, high)
    }));

    return {
      title: readTitle(),
      categories,
      points,
      source: "svg"
    };
  }

  function findTemperatureAxisLabels(axisGroups) {
    return axisGroups.find((labels) => {
      const values = labels.map((item) => item.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      return max <= 60 && max >= 10 && max - min >= 8;
    }) || [];
  }

  function findOrangeTemperatureSeries(root) {
    const seriesItems = Array.from(root.querySelectorAll(".highcharts-series"));
    return seriesItems.find((series) => {
      const stroke = series.querySelector(".highcharts-graph")?.getAttribute("stroke") || "";
      const fill = series.querySelector(".highcharts-point")?.getAttribute("fill") || "";
      return isOrange(stroke) || isOrange(fill);
    });
  }

  function isOrange(color) {
    return /#f78723|#ff7f0e|rgb\(\s*247\s*,\s*135\s*,\s*35\s*\)/i.test(color || "");
  }

  function readTranslate(transform) {
    const match = transform.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)/);
    return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
  }

  function readMarkerCenter(marker, transform) {
    const d = marker.getAttribute("d") || "";
    const circle = d.match(/M\s*([-\d.]+)\s+([-\d.]+)\s*A/i);
    if (circle) {
      return { x: Number(circle[1]) + transform.x, y: Number(circle[2]) + transform.y };
    }

    const diamond = d.match(/M\s*([-\d.]+)\s+([-\d.]+)\s*L\s*([-\d.]+)\s+([-\d.]+)/i);
    if (diamond) {
      return {
        x: (Number(diamond[1]) + Number(diamond[3])) / 2 + transform.x,
        y: (Number(diamond[2]) + Number(diamond[4])) / 2 + transform.y
      };
    }

    const x = Number(marker.getAttribute("x"));
    const y = Number(marker.getAttribute("y"));
    const width = Number(marker.getAttribute("width")) || 0;
    const height = Number(marker.getAttribute("height")) || 0;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { x: x + width / 2 + transform.x, y: y + height / 2 + transform.y };
    }

    return null;
  }

  function yToValue(y, low, high) {
    const ratio = (low.y - y) / (low.y - high.y);
    const value = low.value + ratio * (high.value - low.value);
    return Math.round(value * 10) / 10;
  }

  function readTitle() {
    return document.querySelector("#hours_title")?.textContent?.trim()
      || document.querySelector("#hour24Chart")?.textContent?.match(/最新整点实况[^：]*（[^）]+）/)?.[0]
      || "";
  }
})();
