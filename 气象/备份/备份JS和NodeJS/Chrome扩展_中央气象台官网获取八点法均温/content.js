(() => {
  const PANEL_ID = "nmc-avg-panel";
  const REQUEST_EVENT = "nmc-avg-read-chart";
  const RESPONSE_EVENT = "nmc-avg-chart-data";
  const KEY_HOURS = [
    { label: "23:00", hour: 23, dayOffset: -1 },
    { label: "02:00", hour: 2, dayOffset: 0 },
    { label: "05:00", hour: 5, dayOffset: 0 },
    { label: "08:00", hour: 8, dayOffset: 0 },
    { label: "11:00", hour: 11, dayOffset: 0 },
    { label: "14:00", hour: 14, dayOffset: 0 },
    { label: "17:00", hour: 17, dayOffset: 0 },
    { label: "20:00", hour: 20, dayOffset: 0 }
  ];

  let panel;
  let statusEl;
  let resultEl;
  let buttonEl;
  let pendingRead;
  let readerReadyPromise;
  let autoOpenPromise;

  init();

  function init() {
    createPanel();
    window.addEventListener(RESPONSE_EVENT, onChartData);
    setupMessageListener();

    if (!isStationForecastPage()) {
      setStatus("当前页面不是气象站专属预报页。请打开类似 /publish/forecast/AHE/saihanba.html 的页面。");
      buttonEl.disabled = true;
      return;
    }

    const autoParams = parseAutoParams();
    if (autoParams.isAutoAvg) {
      setStatus("收到控制台指令，正在自动获取 8 点法均温...");
      buttonEl.disabled = true;
      executeAutoRead(autoParams);
    } else {
      setStatus("已识别气象站页面，正在打开 24 小时实况曲线。");
      buttonEl.disabled = true;
      autoOpenHour24Chart();
    }
  }

  function isStationForecastPage() {
    return /^\/publish\/forecast\/[^/]+\/[^/]+\.html$/i.test(location.pathname);
  }

  function createPanel() {
    document.getElementById(PANEL_ID)?.remove();

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="nmc-avg-head" role="button" tabindex="0" title="点击折叠/展开面板" aria-expanded="true">
        <div class="nmc-avg-title">8点法均温</div>
        <button class="nmc-avg-close" type="button" title="关闭" aria-label="关闭">×</button>
      </div>
      <div class="nmc-avg-body">
        <div class="nmc-avg-status"></div>
        <button class="nmc-avg-button" type="button">获取并复制均温</button>
        <div class="nmc-avg-result" aria-live="polite"></div>
        <div class="nmc-avg-footer-bar">
          <button class="nmc-avg-console-btn" type="button" title="打开气象站八点法均温控制台">📊 气象站控制台</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(panel);

    statusEl = panel.querySelector(".nmc-avg-status");
    resultEl = panel.querySelector(".nmc-avg-result");
    buttonEl = panel.querySelector(".nmc-avg-button");

    const headEl = panel.querySelector(".nmc-avg-head");
    const closeEl = panel.querySelector(".nmc-avg-close");
    headEl.addEventListener("click", togglePanelCollapsed);
    headEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        togglePanelCollapsed();
      }
    });
    closeEl.addEventListener("click", (event) => {
      event.stopPropagation();
      panel.remove();
    });
    buttonEl.addEventListener("click", handleReadClick);
    panel.querySelector(".nmc-avg-console-btn")?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_CONSOLE" });
    });
  }

  function togglePanelCollapsed() {
    const isCollapsed = panel.classList.toggle("nmc-avg-collapsed");
    panel.querySelector(".nmc-avg-head")?.setAttribute("aria-expanded", String(!isCollapsed));
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function findHour24Tab() {
    return Array.from(document.querySelectorAll("[data-name], span, a, li, div"))
      .find((el) => {
        const text = el.textContent.trim();
        return el.getAttribute("data-name") === "hour24Chart" || text === "24小时实况曲线";
      });
  }

  function openHour24Chart() {
    const tab = findHour24Tab();

    if (!tab) {
      setStatus("未找到“24小时实况曲线”入口，页面可能尚未加载完成。");
      return false;
    }

    tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    tab.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    tab.click();
    return true;
  }

  async function autoOpenHour24Chart() {
    autoOpenPromise = ensureHour24ChartOpen();
    const opened = await autoOpenPromise;

    if (opened) {
      setStatus("24 小时实况曲线已打开。点击按钮读取温度数据。");
    } else {
      setStatus("未能自动打开 24 小时实况曲线。可稍后点击“获取并复制均温”重试。");
    }
    buttonEl.disabled = false;
  }

  async function ensureHour24ChartOpen() {
    const deadline = Date.now() + 8000;
    let clicked = false;

    while (Date.now() < deadline) {
      if (isHour24ChartRendered()) {
        return true;
      }

      if (openHour24Chart()) {
        clicked = true;
        await waitForChartRender(900);
        if (isHour24ChartRendered()) {
          return true;
        }
      } else {
        await waitForElement(() => findHour24Tab(), 700);
      }

      await delay(clicked ? 500 : 250);
    }

    return isHour24ChartRendered();
  }

  function isHour24ChartRendered() {
    return Boolean(document.querySelector("#hours svg.highcharts-root .highcharts-series"));
  }

  function waitForChartRender(timeoutMs) {
    return waitForElement(() => isHour24ChartRendered(), timeoutMs);
  }

  function waitForElement(check, timeoutMs) {
    const current = check();
    if (current) {
      return Promise.resolve(current);
    }

    return new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) {
          return;
        }
        done = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(value);
      };
      const observer = new MutationObserver(() => {
        const value = check();
        if (value) {
          finish(value);
        }
      });
      const timer = setTimeout(() => finish(null), timeoutMs);
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    });
  }

  async function handleReadClick() {
    try {
      await performRead();
    } catch (error) {
      setStatus(error.message || "读取失败。");
    }
  }

  async function performRead() {
    if (!isStationForecastPage()) {
      throw new Error("当前页面不是气象站专属预报页。");
    }

    buttonEl.disabled = true;
    resultEl.textContent = "";
    setStatus("正在读取图表温度序列。");

    try {
      if (autoOpenPromise) {
        await Promise.race([autoOpenPromise, delay(1500)]);
      }
      const chartReady = await ensureHour24ChartOpen();
      if (!chartReady) {
        throw new Error("未能打开 24 小时实况曲线，请确认站点页面包含近24小时实况。");
      }
      const data = await requestChartData();
      const report = buildReport(data);
      renderReport(report);
      await copyAverage(report);
      return report;
    } finally {
      buttonEl.disabled = false;
    }
  }

  function parseAutoParams() {
    const rawHash = (location.hash || "").replace(/^#/, "");
    const hashParams = new URLSearchParams(rawHash);
    const searchParams = new URLSearchParams(location.search || "");

    const isAutoAvg = hashParams.get("nmc_auto_avg") === "1" || searchParams.get("nmc_auto_avg") === "1";
    const reqId = hashParams.get("reqId") || searchParams.get("reqId") || "";
    const autoClose = hashParams.get("autoClose") === "1" || searchParams.get("autoClose") === "1";

    return { isAutoAvg, reqId, autoClose };
  }

  async function executeAutoRead(params) {
    try {
      const report = await performRead();
      const serialized = serializeReport(report);

      await chrome.runtime.sendMessage({
        type: "NMC_AVG_RESULT",
        reqId: params.reqId,
        stationUrl: location.pathname,
        success: true,
        report: serialized
      });

      if (params.autoClose) {
        setStatus("数据已成功回传控制台，标签页即将自动关闭...");
        await delay(500);
        chrome.runtime.sendMessage({ type: "NMC_CLOSE_TAB", reqId: params.reqId });
      } else {
        setStatus("数据已成功回传控制台。");
      }
    } catch (error) {
      console.error("[NMC Extension] executeAutoRead error:", error);
      await chrome.runtime.sendMessage({
        type: "NMC_AVG_RESULT",
        reqId: params.reqId,
        stationUrl: location.pathname,
        success: false,
        error: error.message || "读取均温数据失败"
      });

      if (params.autoClose) {
        await delay(1200);
        chrome.runtime.sendMessage({ type: "NMC_CLOSE_TAB", reqId: params.reqId });
      }
    }
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "NMC_TRIGGER_GET_AVG") {
        performRead()
          .then((report) => {
            sendResponse({ success: true, report: serializeReport(report) });
          })
          .catch((err) => {
            sendResponse({ success: false, error: err.message || "获取失败" });
          });
        return true;
      }
    });
  }

  function serializeReport(report) {
    return {
      latest: {
        date: formatDateTime(report.latest.date),
        hour: report.latest.hour
      },
      statisticalDate: formatDate(report.statisticalDate),
      average: report.average,
      formattedAverage: formatAverage(report.average),
      availableCount: report.availableCount,
      missingCount: 8 - report.availableCount,
      readings: report.readings.map((r) => ({
        label: r.label,
        date: formatDateTime(r.date),
        value: r.value
      })),
      minPoint: report.minPoint ? {
        value: report.minPoint.value,
        date: formatDateTime(report.minPoint.date)
      } : null,
      maxPoint: report.maxPoint ? {
        value: report.maxPoint.value,
        date: formatDateTime(report.maxPoint.date)
      } : null
    };
  }

  async function requestChartData() {
    await injectReaderOnce();

    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return new Promise((resolve, reject) => {
      pendingRead = { requestId, resolve, reject };
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { requestId } }));
      setTimeout(() => {
        if (pendingRead?.requestId === requestId) {
          pendingRead = null;
          reject(new Error("未能读取 Highcharts 数据，请确认“24小时实况曲线”已经显示。"));
        }
      }, 2500);
    });
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function onChartData(event) {
    if (!pendingRead || event.detail?.requestId !== pendingRead.requestId) {
      return;
    }

    const { resolve, reject } = pendingRead;
    pendingRead = null;

    if (event.detail.error) {
      reject(new Error(event.detail.error));
    } else {
      resolve(event.detail.payload);
    }
  }

  function injectReaderOnce() {
    if (readerReadyPromise) {
      return readerReadyPromise;
    }

    readerReadyPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById("nmc-avg-reader-script");
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "nmc-avg-reader-script";
      script.src = chrome.runtime.getURL("page-reader.js");
      script.onload = () => resolve();
      script.onerror = () => {
        readerReadyPromise = null;
        reject(new Error("图表读取脚本加载失败，请在扩展页面重新加载本扩展。"));
      };
      (document.head || document.documentElement).appendChild(script);
    });

    return readerReadyPromise;
  }

  function buildReport(data) {
    const latest = parseLatestObservation(data.title);
    if (!latest) {
      throw new Error("无法从图表标题识别最新整点时间。");
    }

    const points = normalizePoints(data.points, latest);
    const statisticalDate = latest.hour >= 20 ? startOfDay(latest.date) : addDays(startOfDay(latest.date), -1);
    const statisticalStart = setHour(addDays(statisticalDate, -1), 20);
    const statisticalEnd = setHour(statisticalDate, 20);
    const readings = KEY_HOURS.map((key) => {
      const target = setHour(addDays(statisticalDate, key.dayOffset), key.hour);
      const point = points.find((item) => sameHour(item.date, target));
      return {
        label: key.label,
        date: target,
        value: point?.value ?? null
      };
    });
    const available = readings.filter((item) => typeof item.value === "number");
    const average = available.length
      ? available.reduce((sum, item) => sum + item.value, 0) / available.length
      : null;
    const statisticalPoints = points.filter((item) => {
      return typeof item.value === "number"
        && item.date > statisticalStart
        && item.date <= statisticalEnd;
    });
    const minPoint = statisticalPoints.length
      ? statisticalPoints.reduce((min, item) => item.value < min.value ? item : min)
      : null;
    const maxPoint = statisticalPoints.length
      ? statisticalPoints.reduce((max, item) => item.value > max.value ? item : max)
      : null;

    return {
      latest,
      statisticalDate,
      readings,
      average,
      availableCount: available.length,
      minPoint,
      maxPoint
    };
  }

  function parseLatestObservation(title) {
    const match = title.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):00/);
    if (!match) {
      return null;
    }

    const [, year, month, day, hour] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), 0, 0, 0);
    return { date, hour: Number(hour) };
  }

  function normalizePoints(points, latest) {
    const indexed = points.map((point, index) => ({ ...point, index }));
    const latestDate = latest.date;
    const lastIndex = indexed.length - 1;

    return indexed.map((point, order) => {
      const date = new Date(latestDate);
      date.setHours(latestDate.getHours() - (lastIndex - order), 0, 0, 0);

      const labelHour = parseHour(point.category);
      if (labelHour != null && labelHour !== date.getHours()) {
        const aligned = new Date(date);
        aligned.setHours(labelHour, 0, 0, 0);
        while (aligned > latestDate) {
          aligned.setDate(aligned.getDate() - 1);
        }
        while (latestDate - aligned > 23 * 60 * 60 * 1000) {
          aligned.setDate(aligned.getDate() + 1);
        }
        return { ...point, date: aligned };
      }

      return { ...point, date };
    });
  }

  function parseHour(label) {
    const match = String(label || "").match(/(\d{1,2})\s*时/);
    if (!match) {
      return null;
    }
    const hour = Number(match[1]);
    return hour >= 0 && hour <= 23 ? hour : null;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function setHour(date, hour) {
    const next = new Date(date);
    next.setHours(hour, 0, 0, 0);
    return next;
  }

  function sameHour(left, right) {
    return left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate()
      && left.getHours() === right.getHours();
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateTime(date) {
    return `${formatDate(date)} ${String(date.getHours()).padStart(2, "0")}:00`;
  }

  function roundHalfUp(value, decimals) {
    return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
  }

  function formatAverage(average) {
    return average == null ? "--" : roundHalfUp(average, 2).toFixed(2);
  }

  function renderReport(report) {
    const averageText = formatAverage(report.average);
    const copiedText = report.average == null ? "" : "，已复制";
    const coverage = `${report.availableCount}/8`;
    const missingCount = 8 - report.availableCount;
    const completenessText = missingCount === 0 ? "完整8个整点" : `缺${missingCount}个整点`;
    const completenessClass = missingCount === 0 ? "nmc-avg-completeness" : "nmc-avg-completeness nmc-avg-completeness-missing";

    setStatus(`读取完成：可用 ${coverage}${copiedText}。`);
    resultEl.innerHTML = `
      <div class="nmc-avg-meta">
        <div class="nmc-avg-latest">最新整点：${formatDateTime(report.latest.date)}</div>
        <div class="nmc-avg-stat-date"><span>统计日期：</span><strong>${formatDate(report.statisticalDate)}</strong></div>
      </div>
      <div class="nmc-avg-summary">均温：<button class="nmc-avg-copy-value" type="button" ${report.average == null ? "disabled" : ""}>${averageText}</button>℃ <span class="${completenessClass}">( ${completenessText} )</span></div>
      <div class="nmc-avg-list">
        ${report.readings.map((item) => `
          <div class="nmc-avg-item" title="${formatDateTime(item.date)}">
            <span>${formatDateTime(item.date)}</span>
            <span>${item.value == null ? "缺失" : `${item.value.toFixed(1)}℃`}</span>
          </div>
        `).join("")}
      </div>
      <div class="nmc-avg-extremes">
        <div class="nmc-avg-extreme-item">
          <span>最低整点</span>
          <strong>${formatExtreme(report.minPoint)}</strong>
        </div>
        <div class="nmc-avg-extreme-item">
          <span>最高整点</span>
          <strong>${formatExtreme(report.maxPoint)}</strong>
        </div>
      </div>
      <div class="nmc-avg-note">若 8 个时次未全部出现在近 24 小时图表中，均温按已读到的关键时次计算。</div>
    `;

    resultEl.querySelector(".nmc-avg-copy-value")?.addEventListener("click", () => {
      copyAverage(report, "均温已复制。");
    });
  }

  function formatExtreme(point) {
    if (!point) {
      return "缺失";
    }

    return `${point.value.toFixed(1)}℃ ${formatDateTime(point.date)}`;
  }

  async function copyAverage(report, successMessage) {
    if (report.average == null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatAverage(report.average));
      if (successMessage) {
        setStatus(successMessage);
      }
    } catch {
      setStatus(`读取完成：可用 ${report.availableCount}/8。浏览器阻止自动复制，可手动复制均温。`);
    }
  }
})();
