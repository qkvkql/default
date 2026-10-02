// NMC 8-Point Average Temperature - Console Page Logic

(() => {
  // Built-in default station list from stations.xlsx
  const DEFAULT_STATIONS = [
    { name: "桦甸", kw: "AJL/zuodian" },
    { name: "塞罕坝", kw: "AHE/saihanba" },
    { name: "巴音布鲁克", kw: "AXJ/bayinbuluke" },
    { name: "石家庄", kw: "AHE/shijiazhuang" },
    { name: "合肥", kw: "AAH/hefei" },
    { name: "元江", kw: "AYN/yuanjiang" },
    { name: "黄山", kw: "AAH/huangshan" }
  ];

  function createStationObjects(items) {
    return items.map((s, idx) => {
      const cleanKw = String(s.kw || "").trim().replace(/^\/+|\/+$/g, "").replace(/\.html$/i, "");
      return {
        id: idx + 1,
        name: String(s.name || "").trim(),
        urlKw: cleanKw,
        targetUrl: `https://www.nmc.cn/publish/forecast/${cleanKw}.html`,
        status: "pending",
        statusMessage: "待获取",
        temperature: null,
        formattedTemp: "--",
        statisticalDate: "--",
        latestObservation: "--",
        coverage: "--",
        isComplete: false,
        report: null,
        tabId: null,
        reqId: null,
        error: null
      };
    });
  }

  // Pre-populate stations immediately so table is never stuck or empty
  let stations = createStationObjects(DEFAULT_STATIONS);
  let activeRequests = new Map(); // reqId -> stationId
  let isBatchRunning = false;
  let shouldStopBatch = false;

  // DOM Elements
  const tbodyEl = document.getElementById("stations-tbody");
  const emptyStateEl = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const fileInput = document.getElementById("file-input");

  const statTotal = document.getElementById("stat-total");
  const statDone = document.getElementById("stat-done");
  const statLoading = document.getElementById("stat-loading");
  const statPending = document.getElementById("stat-pending");

  const btnBatchAll = document.getElementById("btn-batch-all");
  const btnStopBatch = document.getElementById("btn-stop-batch");
  const btnReload = document.getElementById("btn-reload");
  const btnCopyAvg = document.getElementById("btn-copy-avg");
  const btnExportExcel = document.getElementById("btn-export-excel");
  const btnCopyTable = document.getElementById("btn-copy-table");

  const optBackground = document.getElementById("opt-background");
  const optAutoclose = document.getElementById("opt-autoclose");

  const batchProgress = document.getElementById("batch-progress");
  const batchStatusText = document.getElementById("batch-status-text");
  const batchPercentage = document.getElementById("batch-percentage");
  const batchProgressBar = document.getElementById("batch-progress-bar");

  const detailModal = document.getElementById("detail-modal");
  const modalStationTitle = document.getElementById("modal-station-title");
  const modalContent = document.getElementById("modal-content");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  const toastEl = document.getElementById("toast");

  // Immediate synchronous initialization
  init();

  function init() {
    bindEvents();
    setupMessageListener();
    renderTable();
    updateStats();
    // Silently check if stations.xlsx has additional stations in background
    loadStationsFromBundle(false);
  }

  function bindEvents() {
    searchInput.addEventListener("input", filterTable);
    btnReload.addEventListener("click", () => loadStationsFromBundle(true));
    fileInput.addEventListener("change", handleFileImport);
    btnBatchAll.addEventListener("click", handleBatchAll);
    btnStopBatch.addEventListener("click", stopBatch);
    btnCopyAvg?.addEventListener("click", copyAverageTemperaturesOnly);
    btnExportExcel.addEventListener("click", exportToExcel);
    btnCopyTable.addEventListener("click", copyTableData);

    modalCloseBtn.addEventListener("click", closeModal);
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && detailModal.classList.contains("open")) {
        closeModal();
      }
    });
  }

  function setupMessageListener() {
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "NMC_AVG_RESULT") {
          handleAvgResult(message);
          sendResponse({ received: true });
          return true;
        }
      });
    }
  }

  // Load default stations.xlsx bundled in extension (non-blocking with timeout)
  async function loadStationsFromBundle(isManualReload = false) {
    if (isManualReload) {
      showToast("正在读取 stations.xlsx...");
    }

    try {
      const candidateUrls = [];
      if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
        candidateUrls.push(chrome.runtime.getURL("stations.xlsx"));
      }
      candidateUrls.push("./stations.xlsx");
      candidateUrls.push("stations.xlsx");

      let buffer = null;
      for (const url of candidateUrls) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const resp = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          if (resp.ok) {
            buffer = await resp.arrayBuffer();
            if (buffer && buffer.byteLength > 0) {
              break;
            }
          }
        } catch (_) {
          // ignore candidate error and try next
        }
      }

      if (buffer && buffer.byteLength > 0) {
        parseAndSetStations(buffer, "stations.xlsx");
        if (isManualReload) {
          showToast(`已成功载入 ${stations.length} 个气象站`);
        }
      } else {
        if (isManualReload) {
          showToast(`已加载预设的 ${stations.length} 个气象站`);
        }
      }
    } catch (err) {
      console.warn("读取本地 stations.xlsx 提示:", err);
      if (stations.length === 0) {
        useFallbackStations();
      }
      if (isManualReload) {
        showToast(`已加载 ${stations.length} 个气象站`);
      }
    }
  }

  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        parseAndSetStations(buffer, file.name);
        showToast(`成功导入 ${file.name}，共 ${stations.length} 个站点`);
      } catch (error) {
        console.error("解析文件失败:", error);
        alert("解析表格失败: " + (error.message || "请确认文件格式为有效 Excel 或 CSV"));
      } finally {
        fileInput.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseAndSetStations(buffer, filename) {
    if (typeof XLSX === "undefined") {
      throw new Error("SheetJS 库未加载");
    }

    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length <= 1) {
      throw new Error("表格中未发现有效气象站数据");
    }

    // Determine column indices for "station name" and "url kw"
    const headerRow = rows[0].map((h) => String(h || "").trim().toLowerCase());
    let nameCol = headerRow.findIndex((h) => h.includes("station") || h.includes("站名") || h.includes("名称") || h.includes("气象站"));
    let kwCol = headerRow.findIndex((h) => h.includes("kw") || h.includes("url") || h.includes("链接") || h.includes("标识"));

    if (nameCol === -1) nameCol = 0;
    if (kwCol === -1) kwCol = 1;

    const parsed = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawName = String(row[nameCol] || "").trim();
      const rawKw = String(row[kwCol] || "").trim();

      if (!rawName || !rawKw) continue;

      // Clean URL kw: remove leading/trailing slashes and optional .html suffix
      const cleanKw = rawKw.replace(/^\/+|\/+$/g, "").replace(/\.html$/i, "");
      const targetUrl = `https://www.nmc.cn/publish/forecast/${cleanKw}.html`;

      parsed.push({
        id: parsed.length + 1,
        name: rawName,
        urlKw: cleanKw,
        targetUrl: targetUrl,
        status: "pending", // pending | fetching | success | failed
        statusMessage: "待获取",
        temperature: null,
        formattedTemp: "--",
        statisticalDate: "--",
        latestObservation: "--",
        coverage: "--",
        isComplete: false,
        report: null,
        tabId: null,
        reqId: null,
        error: null
      });
    }

    if (parsed.length === 0) {
      throw new Error("表格未能识别出任何有效的气象站数据行");
    }

    stations = parsed;
    renderTable();
    updateStats();
  }

  function useFallbackStations() {
    stations = DEFAULT_STATIONS.map((s, idx) => {
      const cleanKw = s.kw.replace(/^\/+|\/+$/g, "").replace(/\.html$/i, "");
      return {
        id: idx + 1,
        name: s.name,
        urlKw: cleanKw,
        targetUrl: `https://www.nmc.cn/publish/forecast/${cleanKw}.html`,
        status: "pending",
        statusMessage: "待获取",
        temperature: null,
        formattedTemp: "--",
        statisticalDate: "--",
        latestObservation: "--",
        coverage: "--",
        isComplete: false,
        report: null,
        tabId: null,
        reqId: null,
        error: null
      };
    });
    renderTable();
    updateStats();
  }

  function renderTable() {
    if (stations.length === 0) {
      tbodyEl.innerHTML = "";
      emptyStateEl.style.display = "block";
      return;
    }

    emptyStateEl.style.display = "none";
    const filterQuery = (searchInput.value || "").trim().toLowerCase();

    const rowsHtml = stations.map((st) => {
      const isVisible = !filterQuery || 
        st.name.toLowerCase().includes(filterQuery) || 
        st.urlKw.toLowerCase().includes(filterQuery);

      const statusBadge = getStatusBadge(st);
      const coverageBadge = getCoverageBadge(st);
      const tempDisplay = st.temperature != null
        ? `<div class="temperature-display">
            <span class="temperature-value">${st.formattedTemp}</span>
            <span style="font-size: 13px; color: var(--text-muted);">℃</span>
            <button class="copy-icon-btn" data-action="copy-val" data-val="${st.formattedTemp}" title="复制均温">📋</button>
           </div>`
        : `<span class="temperature-value empty">--</span>`;

      return `
        <tr data-station-id="${st.id}" style="${isVisible ? '' : 'display: none;'}">
          <td style="color: var(--text-dim); font-size: 12px;">${st.id}</td>
          <td>
            <div class="station-name-cell">${escapeHtml(st.name)}</div>
          </td>
          <td>
            <span class="station-kw-cell">${escapeHtml(st.urlKw)}</span>
          </td>
          <td>
            <a class="station-url-link" href="${escapeHtml(st.targetUrl)}" target="_blank" rel="noopener noreferrer" title="直接打开专属天气预报页">
              <span>${escapeHtml(st.urlKw)}.html</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </td>
          <td style="color: #cbd5e1; font-weight: 500;">${escapeHtml(st.statisticalDate)}</td>
          <td style="color: var(--text-muted); font-size: 12px;">${escapeHtml(st.latestObservation)}</td>
          <td>${tempDisplay}</td>
          <td>${coverageBadge}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right; padding-right: 16px;">
            <div class="actions-cell" style="justify-content: flex-end;">
              <button class="btn-action-get" data-action="get-avg" data-id="${st.id}" ${st.status === 'fetching' ? 'disabled' : ''}>
                ${st.status === 'fetching' ? '获取中...' : 'get avg'}
              </button>
              ${st.report ? `
                <button class="btn btn-secondary btn-sm" data-action="show-detail" data-id="${st.id}" title="查看8个定时时次具体数据">
                  详情
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbodyEl.innerHTML = rowsHtml;
    attachRowEventListeners();
  }

  function attachRowEventListeners() {
    tbodyEl.querySelectorAll("[data-action='get-avg']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const stationId = Number(e.currentTarget.getAttribute("data-id"));
        fetchSingleStation(stationId);
      });
    });

    tbodyEl.querySelectorAll("[data-action='show-detail']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const stationId = Number(e.currentTarget.getAttribute("data-id"));
        openDetailModal(stationId);
      });
    });

    tbodyEl.querySelectorAll("[data-action='copy-val']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = e.currentTarget.getAttribute("data-val");
        if (val && val !== "--") {
          navigator.clipboard.writeText(val);
          showToast(`已复制均温: ${val} ℃`);
        }
      });
    });
  }

  function updateRow(station) {
    const tr = tbodyEl.querySelector(`tr[data-station-id="${station.id}"]`);
    if (!tr) return;

    const filterQuery = (searchInput.value || "").trim().toLowerCase();
    const isVisible = !filterQuery || 
      station.name.toLowerCase().includes(filterQuery) || 
      station.urlKw.toLowerCase().includes(filterQuery);

    tr.style.display = isVisible ? "" : "none";

    // Update cells
    const cells = tr.children;
    cells[4].textContent = station.statisticalDate;
    cells[5].textContent = station.latestObservation;

    const tempDisplay = station.temperature != null
      ? `<div class="temperature-display">
          <span class="temperature-value">${station.formattedTemp}</span>
          <span style="font-size: 13px; color: var(--text-muted);">℃</span>
          <button class="copy-icon-btn" data-action="copy-val" data-val="${station.formattedTemp}" title="复制均温">📋</button>
         </div>`
      : `<span class="temperature-value empty">--</span>`;
    cells[6].innerHTML = tempDisplay;

    cells[7].innerHTML = getCoverageBadge(station);
    cells[8].innerHTML = getStatusBadge(station);

    const actionCell = cells[9].querySelector(".actions-cell");
    if (actionCell) {
      actionCell.innerHTML = `
        <button class="btn-action-get" data-action="get-avg" data-id="${station.id}" ${station.status === 'fetching' ? 'disabled' : ''}>
          ${station.status === 'fetching' ? '获取中...' : 'get avg'}
        </button>
        ${station.report ? `
          <button class="btn btn-secondary btn-sm" data-action="show-detail" data-id="${station.id}" title="查看8个定时时次具体数据">
            详情
          </button>
        ` : ''}
      `;

      actionCell.querySelector("[data-action='get-avg']")?.addEventListener("click", () => fetchSingleStation(station.id));
      actionCell.querySelector("[data-action='show-detail']")?.addEventListener("click", () => openDetailModal(station.id));
    }

    cells[6].querySelector("[data-action='copy-val']")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = e.currentTarget.getAttribute("data-val");
      if (val && val !== "--") {
        navigator.clipboard.writeText(val);
        showToast(`已复制均温: ${val} ℃`);
      }
    });

    updateStats();
  }

  function getStatusBadge(st) {
    switch (st.status) {
      case "fetching":
        return `<span class="status-badge fetching"><span class="spinner"></span>${escapeHtml(st.statusMessage || "读取中...")}</span>`;
      case "success":
        return `<span class="status-badge success">✓ ${escapeHtml(st.statusMessage || "获取成功")}</span>`;
      case "failed":
        return `<span class="status-badge failed" title="${escapeHtml(st.error || '')}">✕ ${escapeHtml(st.statusMessage || "获取失败")}</span>`;
      default:
        return `<span class="status-badge pending">待获取</span>`;
    }
  }

  function getCoverageBadge(st) {
    if (!st.report) return `<span class="coverage-badge">--</span>`;
    if (st.isComplete) {
      return `<span class="coverage-badge complete">8/8 完整</span>`;
    }
    return `<span class="coverage-badge incomplete">${escapeHtml(st.coverage)}</span>`;
  }

  function updateStats() {
    const total = stations.length;
    const done = stations.filter((s) => s.status === "success").length;
    const loading = stations.filter((s) => s.status === "fetching").length;
    const pending = total - done - loading;

    statTotal.textContent = total;
    statDone.textContent = done;
    statLoading.textContent = loading;
    statPending.textContent = Math.max(0, pending);
  }

  function filterTable() {
    const query = (searchInput.value || "").trim().toLowerCase();
    stations.forEach((st) => {
      const tr = tbodyEl.querySelector(`tr[data-station-id="${st.id}"]`);
      if (tr) {
        const matches = !query || 
          st.name.toLowerCase().includes(query) || 
          st.urlKw.toLowerCase().includes(query);
        tr.style.display = matches ? "" : "none";
      }
    });
  }

  // Core "get avg" trigger for a single station
  async function fetchSingleStation(stationId) {
    const station = stations.find((s) => s.id === stationId);
    if (!station || station.status === "fetching") return;

    const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const autoClose = optAutoclose.checked;
    const inBackground = optBackground.checked;

    station.status = "fetching";
    station.statusMessage = "正在打开页面...";
    station.reqId = reqId;
    station.error = null;
    activeRequests.set(reqId, station.id);
    updateRow(station);

    // Target URL with hash parameters for content script auto-read
    const targetUrl = `${station.targetUrl}#nmc_auto_avg=1&reqId=${reqId}&autoClose=${autoClose ? 1 : 0}`;

    try {
      if (typeof chrome !== "undefined" && chrome.tabs?.create) {
        const tab = await chrome.tabs.create({
          url: targetUrl,
          active: !inBackground
        });
        station.tabId = tab.id;
      } else {
        window.open(targetUrl, "_blank");
      }

      // Timeout safeguard: 25 seconds
      const timeoutId = setTimeout(() => {
        if (activeRequests.has(reqId)) {
          activeRequests.delete(reqId);
          station.status = "failed";
          station.statusMessage = "超时未响应";
          station.error = "气象站页面加载或读取 Highcharts 曲线超过25秒超时。";
          updateRow(station);

          if (autoClose && station.tabId && typeof chrome !== "undefined" && chrome.tabs?.remove) {
            chrome.tabs.remove(station.tabId).catch(() => {});
          }
        }
      }, 25000);

      station.timeoutId = timeoutId;
    } catch (err) {
      console.error("打开页面失败:", err);
      activeRequests.delete(reqId);
      station.status = "failed";
      station.statusMessage = "打开失败";
      station.error = err.message || "无法打开目标页面";
      updateRow(station);
    }
  }

  // Handle result message sent from content script
  function handleAvgResult(message) {
    const { reqId, success, report, error } = message;
    if (!reqId || !activeRequests.has(reqId)) return;

    const stationId = activeRequests.get(reqId);
    activeRequests.delete(reqId);

    const station = stations.find((s) => s.id === stationId);
    if (!station) return;

    if (station.timeoutId) {
      clearTimeout(station.timeoutId);
      station.timeoutId = null;
    }

    if (success && report) {
      station.status = "success";
      station.statusMessage = "获取成功";
      station.temperature = report.average;
      station.formattedTemp = report.formattedAverage;
      station.statisticalDate = report.statisticalDate;
      station.latestObservation = report.latest ? report.latest.date : "--";
      station.coverage = `${report.availableCount}/8`;
      station.isComplete = report.availableCount === 8;
      station.report = report;
      station.error = null;
      showToast(`【${station.name}】均温获取成功: ${report.formattedAverage} ℃`);
    } else {
      station.status = "failed";
      station.statusMessage = "读取失败";
      station.error = error || "未能从页面图表提取均温";
      showToast(`【${station.name}】获取失败: ${station.error}`);
    }

    updateRow(station);
  }

  // Batch process all stations
  async function handleBatchAll() {
    if (isBatchRunning) return;

    const targets = stations.filter((s) => s.status !== "success");
    if (targets.length === 0) {
      showToast("所有站点均已获取完成！如需重新获取，请先刷新。");
      return;
    }

    isBatchRunning = true;
    shouldStopBatch = false;
    btnBatchAll.style.display = "none";
    btnStopBatch.style.display = "inline-flex";
    batchProgress.style.display = "flex";

    const totalBatch = targets.length;
    let completedCount = 0;

    for (let i = 0; i < targets.length; i++) {
      if (shouldStopBatch) {
        showToast("已停止批量获取队列。");
        break;
      }

      const st = targets[i];
      batchStatusText.textContent = `批量获取中: (${i + 1}/${totalBatch}) ${st.name}`;
      const pct = Math.round((i / totalBatch) * 100);
      batchPercentage.textContent = `${pct}%`;
      batchProgressBar.style.width = `${pct}%`;

      // Trigger fetch and wait for result or max duration
      await fetchStationAndWait(st.id);
      completedCount++;

      // Small cooldown delay between tabs (1.2s)
      if (i < targets.length - 1 && !shouldStopBatch) {
        await delay(1200);
      }
    }

    batchPercentage.textContent = "100%";
    batchProgressBar.style.width = "100%";
    batchStatusText.textContent = `批量获取完成，共处理 ${completedCount} 个站点。`;

    setTimeout(() => {
      if (!isBatchRunning) {
        batchProgress.style.display = "none";
      }
    }, 4000);

    isBatchRunning = false;
    btnBatchAll.style.display = "inline-flex";
    btnStopBatch.style.display = "none";
  }

  function stopBatch() {
    shouldStopBatch = true;
    btnStopBatch.textContent = "正在停止...";
  }

  function fetchStationAndWait(stationId) {
    return new Promise((resolve) => {
      fetchSingleStation(stationId);

      const checkInterval = setInterval(() => {
        const station = stations.find((s) => s.id === stationId);
        if (!station || station.status !== "fetching") {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);

      // Max wait 22s for single station in batch
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 22000);
    });
  }

  // Detail Modal
  function openDetailModal(stationId) {
    const station = stations.find((s) => s.id === stationId);
    if (!station || !station.report) return;

    modalStationTitle.textContent = `${station.name} (KW: ${station.urlKw}) - 8点法均温明细`;

    const rep = station.report;
    const readingsHtml = (rep.readings || []).map((r) => {
      const isMissing = r.value == null;
      return `
        <div class="reading-card">
          <div class="reading-card-time">${escapeHtml(r.label)}<br><span style="font-size: 10px; color: var(--text-dim);">${escapeHtml(r.date ? r.date.slice(5) : '')}</span></div>
          <div class="reading-card-temp ${isMissing ? 'missing' : ''}">
            ${isMissing ? '无数据' : `${r.value.toFixed(1)} ℃`}
          </div>
        </div>
      `;
    }).join("");

    const minStr = rep.minPoint ? `${rep.minPoint.value.toFixed(1)} ℃ (${rep.minPoint.date})` : "缺失";
    const maxStr = rep.maxPoint ? `${rep.maxPoint.value.toFixed(1)} ℃ (${rep.maxPoint.date})` : "缺失";

    modalContent.innerHTML = `
      <div style="display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <div style="font-size: 12px; color: var(--text-dim);">统计日期</div>
          <div style="font-size: 20px; font-weight: 800; color: #fff;">${escapeHtml(rep.statisticalDate)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: var(--text-dim);">8点法计算均温</div>
          <div style="font-size: 26px; font-weight: 800; color: #38bdf8;">${escapeHtml(rep.formattedAverage)} ℃</div>
        </div>
      </div>

      <div>
        <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px;">
          关键时次实况气温 (${rep.availableCount}/8 可用)
        </div>
        <div class="readings-grid">
          ${readingsHtml}
        </div>
      </div>

      <div class="extremes-box">
        <div class="extreme-card">
          <div class="extreme-title">统计日最低整点</div>
          <div class="extreme-val">${escapeHtml(minStr)}</div>
        </div>
        <div class="extreme-card">
          <div class="extreme-title">统计日最高整点</div>
          <div class="extreme-val">${escapeHtml(maxStr)}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-dim);">
        <span>最新整点实况：${escapeHtml(rep.latest ? rep.latest.date : '--')}</span>
        <button class="btn btn-secondary btn-sm" id="btn-copy-modal-val">复制均温 (${escapeHtml(rep.formattedAverage)} ℃)</button>
      </div>
    `;

    document.getElementById("btn-copy-modal-val")?.addEventListener("click", () => {
      navigator.clipboard.writeText(rep.formattedAverage);
      showToast(`已复制均温: ${rep.formattedAverage} ℃`);
    });

    detailModal.classList.add("open");
    detailModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    detailModal.classList.remove("open");
    detailModal.setAttribute("aria-hidden", "true");
  }

  // Export to Excel (.xlsx) using SheetJS
  function exportToExcel() {
    if (typeof XLSX === "undefined") {
      alert("SheetJS 库未加载，无法导出 Excel");
      return;
    }

    const headers = [
      "气象站名称",
      "URL KW",
      "8点法均温(℃)",
      "统计日期",
      "整点覆盖度",
      "最新整点",
      "23:00",
      "02:00",
      "05:00",
      "08:00",
      "11:00",
      "14:00",
      "17:00",
      "20:00",
      "最低整点",
      "最高整点",
      "状态",
      "目标URL"
    ];

    const dataRows = stations.map((s) => {
      const rep = s.report || {};
      const readings = rep.readings || [];
      const getHourVal = (lbl) => {
        const item = readings.find((r) => r.label === lbl);
        return item && typeof item.value === "number" ? item.value : "";
      };

      const minVal = rep.minPoint ? `${rep.minPoint.value}℃ (${rep.minPoint.date})` : "";
      const maxVal = rep.maxPoint ? `${rep.maxPoint.value}℃ (${rep.maxPoint.date})` : "";

      return [
        s.name,
        s.urlKw,
        s.temperature != null ? s.formattedTemp : "",
        s.statisticalDate !== "--" ? s.statisticalDate : "",
        s.coverage !== "--" ? s.coverage : "",
        s.latestObservation !== "--" ? s.latestObservation : "",
        getHourVal("23:00"),
        getHourVal("02:00"),
        getHourVal("05:00"),
        getHourVal("08:00"),
        getHourVal("11:00"),
        getHourVal("14:00"),
        getHourVal("17:00"),
        getHourVal("20:00"),
        minVal,
        maxVal,
        s.statusMessage,
        s.targetUrl
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "气象站均温");

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(workbook, `中央气象台八点法均温_${todayStr}.xlsx`);
    showToast("Excel 文件已生成并开始下载！");
  }

  // Copy table as TSV
  function copyTableData() {
    const headers = ["气象站", "URL KW", "8点法均温(℃)", "统计日期", "最新整点", "时次覆盖", "状态", "目标URL"];
    const rows = stations.map((s) => [
      s.name,
      s.urlKw,
      s.temperature != null ? s.formattedTemp : "",
      s.statisticalDate,
      s.latestObservation,
      s.coverage,
      s.statusMessage,
      s.targetUrl
    ]);

    const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(tsv).then(() => {
      showToast("表格数据已复制为 TSV 格式（可直接粘贴到 Excel）");
    }).catch(() => {
      showToast("复制失败，请重试");
    });
  }

  // Copy ONLY the average temperatures by sequence (pure values separated by newlines, no other info)
  function copyAverageTemperaturesOnly() {
    if (!stations || stations.length === 0) {
      showToast("当前暂无气象站数据");
      return;
    }

    // Extract only the average temperature value strictly in station sequence
    const values = stations.map((s) => (s.temperature != null ? s.formattedTemp : ""));
    const textToCopy = values.join("\n");
    const fetchedCount = stations.filter((s) => s.temperature != null).length;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`已按顺序复制均温纯数值（共 ${fetchedCount}/${stations.length} 个站点）`);
    }).catch((err) => {
      console.error("复制失败:", err);
      showToast("复制失败，请重试");
    });
  }

  // Toast Helper
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2800);
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
