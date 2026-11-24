from __future__ import annotations

import hashlib
import json
import math
import os
import tempfile
import threading
import webbrowser
from copy import copy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from openpyxl import load_workbook


DEFAULT_WORKBOOK_PATH = Path(r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx")
CONFIG_PATH = Path(__file__).with_name("station_editor_config.json")
HOST = "127.0.0.1"
PORT = 8765
WRITE_LOCK = threading.Lock()
REQUIRED_HEADERS = ("min", "max", "avg")
IDENTITY_HEADERS = ("id", "USAF", "rp5", "WBAN", "cn_name", "level1", "country")


def configured_workbook_path():
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return Path(config.get("workbook_path", DEFAULT_WORKBOOK_PATH))
    except (OSError, ValueError, TypeError):
        return DEFAULT_WORKBOOK_PATH


ACTIVE_WORKBOOK_PATH = configured_workbook_path()


PAGE = r'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>气象站数据编辑器</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", "Microsoft YaHei", sans-serif; color: #18212f; background: #f4f6f9; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #dbe1e9; padding: 18px 24px; }
    h1 { font-size: 20px; margin: 0 0 5px; }
    .sub { color: #637083; font-size: 13px; }
    .pathbar { display:flex; gap:9px; align-items:center; max-width:1360px; margin:14px auto 0; }
    .pathbar label { color:#526176; font-size:13px; white-space:nowrap; }
    .pathbar input { flex:1; min-width:180px; height:38px; border:1px solid #c9d2df; border-radius:7px; padding:0 10px; font:inherit; }
    main { max-width: 1360px; margin: 20px auto; padding: 0 18px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
    input, select, button { font: inherit; }
    .search, select { height: 38px; border: 1px solid #c9d2df; border-radius: 7px; background: #fff; padding: 0 10px; }
    .search { min-width: 250px; }
    button { border: 1px solid #b9c4d2; background: #fff; border-radius: 7px; height: 36px; padding: 0 13px; cursor: pointer; color: #1c2a3a; }
    button:hover { background: #f1f5fa; }
    button.primary { background: #175cd3; color: #fff; border-color: #175cd3; }
    button.primary:hover { background: #124bb2; }
    button:disabled { opacity: .5; cursor: default; }
    .status { color: #5b6676; font-size: 13px; margin-left: auto; }
    .hint { font-size: 12px; color: #667386; margin: 0 0 10px; }
    .table-wrap { overflow: auto; max-height: calc(100vh - 205px); background: white; border: 1px solid #dbe1e9; border-radius: 9px; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1250px; table-layout: fixed; }
    th:nth-child(1), td.station-id { width: 65px; }
    th:nth-child(2), td.province { width: 130px; }
    th:nth-child(3), td.station-name { width: 220px; }
    th:nth-child(4), th:nth-child(5), th:nth-child(6), td.num { width: 138px; }
    th:nth-child(7), td.status-column { width: 75px; }
    th:nth-child(8), td.action { width: 110px; }
    th:nth-child(9), td.country { width: 120px; }
    th:nth-child(10), td.clear-column { width: 110px; }
    th { position: sticky; top: 0; background: #eef2f7; z-index: 2; text-align: center; font-size: 12px; color: #425166; padding: 10px; border-bottom: 1px solid #dbe1e9; }
    td { padding: 6px 8px; border-bottom: 1px solid #edf0f4; font-size: 13px; }
    tbody tr:nth-child(odd) td { background: #fff; }
    tbody tr:nth-child(even) td { background: #f3f7fc; }
    tbody tr:hover td { background: #eaf2ff; }
    td.num { width: 138px; }
    td.action { width: 245px; }
    .station-id { position: relative; overflow: visible; color: #6a7482; width: 65px; font-variant-numeric: tabular-nums; }
    .id-button { border: 0; background: transparent; padding: 3px 4px; height: auto; color: #175cd3; font-variant-numeric: tabular-nums; text-decoration: underline; text-underline-offset: 2px; }
    .id-button:hover { background: #eaf2ff; }
    .id-menu { position: absolute; left: 4px; top: calc(100% - 2px); z-index: 8; min-width: 148px; padding: 5px; background: #fff; border: 1px solid #cbd4df; border-radius: 7px; box-shadow: 0 8px 24px #18212f33; }
    .id-menu[hidden] { display: none; }
    .id-menu button { width: 100%; text-align: left; border: 0; height: 32px; padding: 0 8px; }
    .station-name { overflow: hidden; white-space: nowrap; }
    .cn-name-text { display: block; font-size: 20px; line-height: 1.2; white-space: nowrap; overflow: hidden; }
    .province { min-width: 130px; text-align: right; }
    .data-input { width: 100%; height: 42px; padding: 0 5px; border: 1px solid #cbd4df; border-radius: 5px; background: transparent; text-align: right; font-size: 20px; font-variant-numeric: tabular-nums; }
    .data-input[data-col="min"], .data-input[data-col="max"] { padding-right: 4ch; }
    .data-input[data-col="avg"] { padding-right: 3ch; }
    .data-input:focus { outline: 2px solid #8ab4f8; border-color: #5c91e5; background: #fff; }
    tr.dirty { outline: 2px solid #d92d20; outline-offset: -2px; }
    .dirty-mark { color: #b42318; font-size: 11px; white-space: nowrap; }
    .row-save { height: 30px; padding: 0 9px; font-size: 12px; }
    .row-clear { height: 30px; padding: 0 8px; font-size: 12px; white-space: nowrap; }
    .row-insert { height: 30px; padding: 0 6px; font-size: 12px; white-space: nowrap; }
    dialog { width: min(900px, calc(100vw - 24px)); max-height: 90vh; border: 1px solid #cbd4df; border-radius: 10px; padding: 0; box-shadow: 0 20px 60px #18212f33; }
    dialog::backdrop { background: #13203377; }
    .dialog-head, .dialog-foot { padding: 14px 18px; background: #f7f9fc; }
    .dialog-head { border-bottom: 1px solid #e0e5ec; }
    .dialog-foot { border-top: 1px solid #e0e5ec; display:flex; justify-content:flex-end; gap:8px; }
    .dialog-body { padding: 16px 18px; overflow:auto; max-height: 62vh; }
    .view-table { width: 100%; min-width: 0; table-layout: auto; border-collapse: collapse; }
    .view-table th { position: static; width: 150px; text-align: left; white-space: nowrap; }
    .view-table th, .view-table td { border-bottom: 1px solid #e5e9ef; user-select: text; }
    .view-table td { cursor: text; white-space: pre-wrap; overflow-wrap: anywhere; }
    .fields { display:grid; grid-template-columns: repeat(auto-fit, minmax(210px,1fr)); gap:10px; }
    .field label { display:block; color:#526176; font-size:12px; margin:0 0 4px; }
    .field input { width:100%; height:34px; border:1px solid #cbd4df; border-radius:5px; padding:0 8px; }
    .error { color: #b42318; }
    .empty { padding: 35px; text-align: center; color: #637083; }
    @media (max-width: 720px) { header { padding: 14px; } .pathbar { flex-wrap:wrap; } .pathbar input { order:3; flex-basis:100%; } main { margin: 12px auto; padding: 0 10px; } .status { width: 100%; margin-left: 0; } .table-wrap { max-height: calc(100vh - 250px); } }
  </style>
</head>
<body>
  <header>
    <h1>气象站数据编辑器</h1>
    <div class="sub" id="file-label">正在连接工作簿…</div>
    <div class="pathbar"><label for="workbook-path">工作簿路径</label><input id="workbook-path" type="text" spellcheck="false" placeholder="输入 .xlsx 完整路径"><button id="load-path" class="primary">载入此文件</button></div>
  </header>
  <main>
    <div class="toolbar">
      <input id="search" class="search" type="search" placeholder="搜索站点 ID、名称或代码">
      <select id="country"><option value="">所有国家</option></select>
      <select id="province"><option value="">所有省份</option></select>
      <button id="reload">重新载入</button>
      <button id="locate-unsaved" disabled>定位未保存</button>
      <button id="save-all" class="primary" disabled>保存所有未保存站点</button>
      <div id="status" class="status"></div>
    </div>
    <p class="hint">从当前 min / max / avg 单元格开始，可按 Excel 的行列方式粘贴多格数据；超出 avg 列的数据会忽略。红框表示尚未保存。</p>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>省份（level1）</th><th>cn_name</th><th>Min</th><th>Max</th><th>Avg</th><th>状态</th><th>保存</th><th>国家（country）</th><th>清除数据</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
  </main>
  <dialog id="insert-dialog">
    <form id="insert-form">
      <div class="dialog-head"><strong id="insert-title">插入新站</strong><div class="sub" id="insert-hint">表单会预填所选站点当前各列的值，可按需修改；新站 ID 自动生成，后续站点 ID 会顺延。</div></div>
      <div class="dialog-body"><div id="insert-fields" class="fields"></div></div>
      <div class="dialog-foot"><button type="button" id="insert-cancel">取消</button><button id="insert-submit" class="primary" type="submit">插入站点</button></div>
    </form>
  </dialog>
  <dialog id="view-dialog">
    <div class="dialog-head"><strong id="view-title">查看站点信息</strong><div class="sub">双击单元格文本可选中整项，然后复制。</div></div>
    <div class="dialog-body"><table class="view-table"><tbody id="view-fields"></tbody></table></div>
    <div class="dialog-foot"><button type="button" id="view-close">关闭</button></div>
  </dialog>
<script>
const state = { rows: [], headers: [], visibleRows: [], pending: new Map(), busy: new Set(), insertAfter: null, editRow: null, formMode: "insert", unsavedOnly: false };
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
const norm = value => value == null ? "" : String(value);

function formatTempValue(value, column) {
  const raw = norm(value).trim();
  if (!raw) return "";
  const number = Number(raw);
  if (!Number.isFinite(number)) return norm(value);
  return number.toFixed(column === "avg" ? 2 : 1);
}
function rowValues(row) {
  return [formatTempValue(row.min, "min"), formatTempValue(row.max, "max"), formatTempValue(row.avg, "avg")];
}
function currentValues(rowNo) {
  return ["min", "max", "avg"].map(k => document.querySelector(`[data-row="${rowNo}"][data-col="${k}"]`)?.value ?? "");
}
function updateDirty(rowNo) {
  const row = state.rows.find(x => x.row === rowNo);
  if (!row) return;
  const values = currentValues(rowNo);
  const dirty = values.some((v, i) => v !== rowValues(row)[i]);
  if (dirty) state.pending.set(rowNo, values); else state.pending.delete(rowNo);
  const tr = document.querySelector(`tr[data-row="${rowNo}"]`);
  if (tr) {
    tr.classList.toggle("dirty", dirty);
    const mark = tr.querySelector(".dirty-mark");
    if (mark) mark.textContent = dirty ? "未保存" : "";
    const save = tr.querySelector(".row-save");
    if (save) save.disabled = !dirty || state.busy.has(rowNo);
  }
  $("save-all").disabled = state.pending.size === 0 || state.busy.size > 0;
  if (state.unsavedOnly) {
    if (!state.pending.size) {
      state.unsavedOnly = false;
      clearViewFilters();
    }
    draw();
  } else {
    updateLocateButton();
    const status = $("status");
    status.textContent = `${state.visibleRows.length} / ${state.rows.length} 个站点` + (state.pending.size ? ` · ${state.pending.size} 行未保存` : "");
  }
}
function draw() {
  if (state.unsavedOnly && !state.pending.size) {
    state.unsavedOnly = false;
    clearViewFilters();
  }
  const q = $("search").value.trim().toLocaleLowerCase();
  const country = $("country").value;
  const province = $("province").value;
  const sourceRows = state.unsavedOnly ? state.rows.filter(row => state.pending.has(row.row)) : state.rows;
  const visible = sourceRows.filter(row => {
    if (country && row.country !== country) return false;
    if (province && row.province !== province) return false;
    return !q || [row.id, row.name, row.cn_name, row.country, row.province, row.fields?.USAF, row.fields?.rp5, row.fields?.domes_id, row.fields?.stereotype].some(v => norm(v).toLocaleLowerCase().includes(q));
  });
  state.visibleRows = visible;
  $("rows").innerHTML = visible.map(row => {
    const values = state.pending.get(row.row) || rowValues(row);
    const dirty = state.pending.has(row.row);
    const locked = state.busy.has(row.row);
    return `<tr data-row="${row.row}" class="${dirty ? "dirty" : ""}">
      <td class="station-id"><button class="id-button" data-id-menu="${escapeHtml(row.id)}" aria-expanded="false">${escapeHtml(row.id)}</button><div class="id-menu" hidden><button type="button" data-insert-after="${escapeHtml(row.id)}">在此 ID 后插入</button><button type="button" data-edit-row="${row.row}">修改站点信息</button><button type="button" data-view-row="${row.row}">查看站点信息</button></div></td><td class="province">${escapeHtml(row.province)}</td><td class="station-name"><span class="cn-name-text" title="${escapeHtml(row.cn_name)}">${escapeHtml(row.cn_name)}</span></td>
      ${["min","max","avg"].map((k,i)=>`<td class="num"><input class="data-input" inputmode="decimal" autocomplete="off" aria-label="${k} ${escapeHtml(row.name)}" data-row="${row.row}" data-col="${k}" value="${escapeHtml(values[i])}" ${locked?"disabled":""}></td>`).join("")}
      <td class="status-column"><span class="dirty-mark">${dirty?"未保存":""}</span></td><td class="action"><button class="row-save" data-save="${row.row}" ${(!dirty||locked)?"disabled":""}>保存此站</button></td><td class="country">${escapeHtml(row.country)}</td><td class="clear-column"><button class="row-clear" data-clear-row="${row.row}" ${locked?"disabled":""}>清除数据</button></td>
    </tr>`;
  }).join("") || `<tr><td colspan="10" class="empty">没有符合条件的站点</td></tr>`;
  requestAnimationFrame(fitChineseNames);
  $("status").textContent = `${visible.length} / ${state.rows.length} 个站点` + (state.pending.size ? ` · ${state.pending.size} 行未保存` : "");
  $("save-all").disabled = state.pending.size === 0 || state.busy.size > 0;
  updateLocateButton();
}
function clearViewFilters() {
  $("search").value = "";
  $("country").value = "";
  $("province").value = "";
}
function updateLocateButton() {
  const button = $("locate-unsaved");
  button.textContent = state.unsavedOnly ? "取消定位（显示全部）" : `定位未保存 (${state.pending.size})`;
  button.disabled = !state.unsavedOnly && state.pending.size === 0;
  button.classList.toggle("primary", state.unsavedOnly);
}
const fitCanvas = document.createElement("canvas");
const fitContext = fitCanvas.getContext("2d");
function fitChineseNames() {
  document.querySelectorAll(".cn-name-text").forEach(element => {
    element.style.fontSize = "";
    const cell = element.closest("td");
    const cellStyle = getComputedStyle(cell);
    const available = cell.clientWidth - parseFloat(cellStyle.paddingLeft) - parseFloat(cellStyle.paddingRight) - 2;
    const textStyle = getComputedStyle(element);
    const baseSize = parseFloat(textStyle.fontSize);
    fitContext.font = textStyle.font;
    const textWidth = fitContext.measureText(element.textContent).width;
    if (textWidth > available && available > 0) {
      element.style.fontSize = `${Math.max(10, baseSize * available / textWidth)}px`;
    }
  });
}
function updateProvinceOptions() {
  const provinces = [...new Set(state.rows.filter(r=>!$("country").value || r.country === $("country").value).map(r => r.province).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
  const selected = $("province").value;
  $("province").innerHTML = `<option value="">所有省份</option>` + provinces.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  if (provinces.includes(selected)) $("province").value = selected;
}
async function loadData() {
  $("status").textContent = "正在读取…";
  try {
    const r = await fetch("/api/data", {cache:"no-store"});
    const data = await r.json();
    if (data.path) $("workbook-path").value = data.path;
    if (!r.ok) throw new Error(data.error || "读取失败");
    state.rows = data.rows;
    state.headers = data.headers;
    state.pending.clear();
    $("file-label").textContent = `${data.path} · ${data.sheet} · ${data.count} 个站点`;
    const countries = [...new Set(state.rows.map(r => r.country).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
    const selectedCountry = $("country").value;
    $("country").innerHTML = `<option value="">所有国家</option>` + countries.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
    if (countries.includes(selectedCountry)) $("country").value = selectedCountry;
    updateProvinceOptions();
    buildInsertFields();
    $("status").classList.remove("error");
    draw();
  } catch (e) {
    if (e.message.startsWith("ID 校验失败：")) alert(e.message);
    $("status").textContent = e.message;
    $("status").classList.add("error");
  }
}
function buildInsertFields() {
  $("insert-fields").innerHTML = state.headers.filter(h=>h!=="id").map(h=>`<div class="field"><label for="new-${escapeHtml(h)}">${escapeHtml(h)}</label><input id="new-${escapeHtml(h)}" name="${escapeHtml(h)}" autocomplete="off"></div>`).join("");
}
function openInsert(afterId) {
  if (state.pending.size) {
    alert("先保存或恢复未保存的 min / max / avg 修改，再插入新站。");
    return;
  }
  state.formMode = "insert";
  state.editRow = null;
  state.insertAfter = Number(afterId);
  const source = state.rows.find(row => String(row.id) === String(afterId));
  buildInsertFields();
  $("insert-title").textContent = `在 ID ${afterId} 后插入新站（新 ID：${Number(afterId)+1}）`;
  $("insert-hint").textContent = "表单会预填所选站点当前各列的值，可按需修改；新站 ID 自动生成，后续站点 ID 会顺延。";
  $("insert-submit").textContent = "插入站点";
  $("insert-form").reset();
  state.headers.filter(name => name !== "id").forEach(name => {
    const field = document.getElementById(`new-${name}`);
    if (field) field.value = norm(source?.fields?.[name]);
  });
  $("insert-dialog").showModal();
  $("new-cn_name")?.focus();
}
function openEdit(rowNo) {
  if (state.pending.size) {
    alert("先保存或恢复未保存的 min / max / avg 修改，再修改站点信息。");
    return;
  }
  const source = state.rows.find(row => row.row === Number(rowNo));
  if (!source) { alert("找不到此站点，请重新载入工作簿。"); return; }
  state.formMode = "edit";
  state.editRow = source.row;
  state.insertAfter = null;
  buildInsertFields();
  $("insert-fields").insertAdjacentHTML("afterbegin", `<div class="field"><label for="edit-id">id</label><input id="edit-id" value="${escapeHtml(source.id)}" readonly></div>`);
  $("insert-title").textContent = `修改 ID ${source.id} 的站点信息`;
  $("insert-hint").textContent = "所有站点信息已预填；ID 保持不变。修改后点击“保存修改”。";
  $("insert-submit").textContent = "保存修改";
  $("insert-form").reset();
  state.headers.filter(name => name !== "id").forEach(name => {
    const field = document.getElementById(`new-${name}`);
    if (field) field.value = norm(source.fields?.[name]);
  });
  $("insert-dialog").showModal();
  $("new-cn_name")?.focus();
}
function openView(rowNo) {
  const source = state.rows.find(row => row.row === Number(rowNo));
  if (!source) { alert("找不到此站点，请重新载入工作簿。"); return; }
  const fields = {...source.fields, id: source.id};
  const pending = state.pending.get(source.row);
  if (pending) ["min", "max", "avg"].forEach((name, index) => { fields[name] = pending[index]; });
  $("view-title").textContent = `查看 ID ${source.id} 的站点信息`;
  $("view-fields").innerHTML = state.headers.map(name =>
    `<tr><th scope="row">${escapeHtml(name)}</th><td>${escapeHtml(norm(fields[name]))}</td></tr>`
  ).join("");
  $("view-dialog").showModal();
}
async function changeWorkbookPath() {
  let path = $("workbook-path").value.trim();
  if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) path = path.slice(1, -1).trim();
  if (!path) { alert("请输入 .xlsx 文件的完整路径。"); return; }
  if (state.pending.size && !confirm("切换工作簿会丢弃当前未保存的修改，继续吗？")) return;
  const button = $("load-path");
  button.disabled = true;
  try {
    const response = await fetch("/api/path", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({path})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "载入工作簿失败");
    $("workbook-path").value = result.path;
    await loadData();
  } catch (e) { alert(e.message); }
  finally { button.disabled = false; }
}
async function saveRow(rowNo) {
  if (!state.pending.has(rowNo) || state.busy.has(rowNo)) return true;
  const values = state.pending.get(rowNo) || currentValues(rowNo);
  for (const value of values) {
    if (value.trim() !== "" && !Number.isFinite(Number(value))) {
      alert("min、max、avg 只能填写数字或留空。"); return false;
    }
  }
  state.busy.add(rowNo); draw();
  try {
    const response = await fetch("/api/save", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({row:rowNo, values, revision:state.rows.find(x=>x.row===rowNo).revision})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "保存失败");
    const row = state.rows.find(x=>x.row===rowNo);
    [row.min,row.max,row.avg] = values;
    row.revision = result.revision;
    state.pending.delete(rowNo);
    $("status").textContent = `已保存：${row.name}`;
    $("status").classList.remove("error");
    return true;
  } catch (e) {
    alert(e.message);
    return false;
  } finally {
    state.busy.delete(rowNo); draw();
  }
}

$("rows").addEventListener("input", e => { const el=e.target.closest(".data-input"); if(el) updateDirty(Number(el.dataset.row)); });
$("rows").addEventListener("focusout", e => {
  const el = e.target.closest(".data-input");
  if (!el) return;
  el.value = formatTempValue(el.value, el.dataset.col);
  updateDirty(Number(el.dataset.row));
});
$("rows").addEventListener("paste", e => {
  const input = e.target.closest(".data-input");
  if (!input) return;
  const text = (e.clipboardData || window.clipboardData).getData("text");
  if (!text.includes("\t") && !/[\r\n]/.test(text)) return;
  e.preventDefault();
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  if (!lines.length) return;
  const matrix = lines.map(line => line.split("\t"));
  const startRow = state.visibleRows.findIndex(row => row.row === Number(input.dataset.row));
  const cols = ["min","max","avg"];
  const startCol = cols.indexOf(input.dataset.col);
  if (startRow < 0 || !matrix.length) return;
  if (startRow + matrix.length > state.visibleRows.length) { alert("粘贴行数超过当前站点及其后续可见站点数。请清除筛选或减少粘贴行数。"); return; }
  const targets = [];
  matrix.forEach((cells, offset) => {
    const rowNo = state.visibleRows[startRow + offset].row;
    cells.forEach((value, colOffset) => {
      const col = startCol + colOffset;
      if (col >= cols.length) return;
      if (value.trim() !== "" && !Number.isFinite(Number(value))) return;
      targets.push({rowNo, col, value});
    });
  });
  const invalid = matrix.some((cells, offset) => cells.some((value, colOffset) => startCol + colOffset < cols.length && value.trim() !== "" && !Number.isFinite(Number(value))));
  if (invalid) { alert("粘贴到 min、max、avg 的内容必须是数字或空白单元格；avg 右侧的数据会忽略。"); return; }
  const changedRows = new Set();
  targets.forEach(({rowNo, col, value}) => {
    const target = document.querySelector(`[data-row="${rowNo}"][data-col="${cols[col]}"]`);
    if (target) { target.value = formatTempValue(value, cols[col]); changedRows.add(rowNo); }
  });
  changedRows.forEach(updateDirty);
  const nextRow = state.visibleRows[startRow + matrix.length];
  const lastRowNo = state.visibleRows[startRow + matrix.length - 1].row;
  const lastCol = Math.min(cols.length - 1, startCol + Math.max(...matrix.map(row => row.length), 1) - 1);
  document.querySelector(`[data-row="${nextRow ? nextRow.row : lastRowNo}"][data-col="${nextRow ? "min" : cols[lastCol]}"]`)?.focus();
});
$("rows").addEventListener("click", e => {
  const idButton = e.target.closest("[data-id-menu]");
  if (idButton) {
    const menu = idButton.parentElement.querySelector(".id-menu");
    const shouldOpen = menu.hidden;
    document.querySelectorAll(".id-menu:not([hidden])").forEach(other => { other.hidden = true; });
    menu.hidden = !shouldOpen;
    idButton.setAttribute("aria-expanded", String(shouldOpen));
    return;
  }
  const ins = e.target.closest("[data-insert-after]");
  if (ins) {
    const menu = ins.closest(".id-menu");
    if (menu) {
      menu.hidden = true;
      menu.parentElement.querySelector(".id-button")?.setAttribute("aria-expanded", "false");
    }
    openInsert(ins.dataset.insertAfter);
    return;
  }
  const edit = e.target.closest("[data-edit-row]");
  if (edit) {
    const menu = edit.closest(".id-menu");
    if (menu) {
      menu.hidden = true;
      menu.parentElement.querySelector(".id-button")?.setAttribute("aria-expanded", "false");
    }
    openEdit(edit.dataset.editRow);
    return;
  }
  const view = e.target.closest("[data-view-row]");
  if (view) {
    const menu = view.closest(".id-menu");
    if (menu) {
      menu.hidden = true;
      menu.parentElement.querySelector(".id-button")?.setAttribute("aria-expanded", "false");
    }
    openView(view.dataset.viewRow);
    return;
  }
  const clear = e.target.closest("[data-clear-row]");
  if (clear) {
    const rowNo = Number(clear.dataset.clearRow);
    ["min", "max", "avg"].forEach(col => {
      const field = document.querySelector(`[data-row="${rowNo}"][data-col="${col}"]`);
      if (field) field.value = "";
    });
    updateDirty(rowNo);
    return;
  }
  const save = e.target.closest("[data-save]");
  if (save) saveRow(Number(save.dataset.save));
});
document.addEventListener("click", e => {
  if (e.target.closest(".station-id")) return;
  document.querySelectorAll(".id-menu:not([hidden])").forEach(menu => { menu.hidden = true; });
  document.querySelectorAll(".id-button[aria-expanded='true']").forEach(button => button.setAttribute("aria-expanded", "false"));
});
$("search").addEventListener("input", draw);
$("country").addEventListener("change", () => { $("province").value = ""; updateProvinceOptions(); draw(); });
$("province").addEventListener("change", draw);
$("reload").addEventListener("click", () => { if (state.pending.size && !confirm("重新载入会丢弃尚未保存的修改，继续吗？")) return; loadData(); });
$("locate-unsaved").addEventListener("click", () => {
  state.unsavedOnly = !state.unsavedOnly;
  clearViewFilters();
  draw();
});
$("load-path").addEventListener("click", changeWorkbookPath);
$("workbook-path").addEventListener("keydown", e => { if (e.key === "Enter") changeWorkbookPath(); });
$("save-all").addEventListener("click", async () => { for (const rowNo of [...state.pending.keys()]) { if (!await saveRow(rowNo)) break; } });
$("insert-cancel").addEventListener("click", () => $("insert-dialog").close());
$("view-close").addEventListener("click", () => $("view-dialog").close());
$("view-fields").addEventListener("dblclick", e => {
  const cell = e.target.closest("td");
  if (!cell) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
});
$("insert-form").addEventListener("submit", async e => {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.currentTarget).entries());
  const button = e.currentTarget.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const isEditing = state.formMode === "edit";
    const source = isEditing ? state.rows.find(row => row.row === state.editRow) : null;
    const endpoint = isEditing ? "/api/update" : "/api/insert";
    const payload = isEditing
      ? {row:state.editRow, values, revision:source?.revision}
      : {after_id:state.insertAfter, values};
    const response = await fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || (isEditing ? "修改失败" : "插入失败"));
    $("insert-dialog").close();
    $("search").value = "";
    $("country").value = "";
    $("province").value = "";
    await loadData();
    $("status").textContent = isEditing ? `已修改站点：ID ${result.id}` : `已插入站点：ID ${result.id}`;
  } catch (err) { alert(err.message); }
  finally { button.disabled = false; }
});
loadData();
window.addEventListener("resize", fitChineseNames);
</script>
</body>
</html>'''


def json_value(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def revision_for(row_values, headers):
    positions = {name: i for i, name in enumerate(headers)}
    selected = []
    for name in (*IDENTITY_HEADERS, *REQUIRED_HEADERS):
        index = positions.get(name)
        selected.append(row_values[index] if index is not None and index < len(row_values) else None)
    raw = json.dumps(selected, ensure_ascii=False, default=str, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def workbook_sheet(workbook):
    for sheet in workbook.worksheets:
        for row_idx in range(1, min(sheet.max_row, 20) + 1):
            headers = [str(cell.value).strip() if cell.value is not None else "" for cell in sheet[row_idx]]
            if all(header in headers for header in REQUIRED_HEADERS):
                return sheet, row_idx, headers
    raise ValueError("找不到同时包含 min、max、avg 列的工作表。")


def validate_station_ids(sheet, header_row, headers):
    if "id" not in headers:
        raise ValueError("ID 校验失败：找不到 id 列。")
    if header_row != 1:
        raise ValueError(f"ID 校验失败：表头在第 {header_row} 行；id 列必须在第 2 行从 1 开始。")

    id_column = headers.index("id") + 1
    expected_id = 1
    last_consecutive_row = 1
    id_values = sheet.iter_rows(min_row=2, min_col=id_column, max_col=id_column, values_only=True)
    for row_no, (value,) in enumerate(id_values, start=2):
        is_numeric = isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
        if row_no == 2:
            if not is_numeric or value != 1:
                raise ValueError(f"ID 校验失败：第 2 行的 id 应为 1，当前值为 {value!r}。")
        if not is_numeric:
            break
        if value != expected_id:
            raise ValueError(f"ID 校验失败：第 {row_no} 行的 id 应为 {expected_id}，当前值为 {value!r}。")
        expected_id += 1
        last_consecutive_row = row_no
    if last_consecutive_row == 1:
        raise ValueError("ID 校验失败：第 2 行的 id 应为 1，当前值为空。")
    return last_consecutive_row


def row_to_station(row_no, values, headers):
    positions = {name: i for i, name in enumerate(headers)}

    def get(name):
        idx = positions.get(name)
        return values[idx] if idx is not None and idx < len(values) else None

    identity = [get(name) for name in ("id", "USAF", "rp5", "WBAN", "domes_id", "cn_name")]
    if not any(value not in (None, "") for value in identity):
        return None
    if any(str(value).strip().upper() == "END" for value in identity if value is not None):
        return None
    if str(get("min") or "").strip().upper() == "END":
        return None
    return {
        "row": row_no,
        "id": json_value(get("id")),
        "name": json_value(get("cn_name") or get("rp5") or get("USAF") or get("id")),
        "province": json_value(get("level1")),
        "country": json_value(get("country")),
        "cn_name": json_value(get("cn_name")),
        "codes": [json_value(get(name)) for name in ("USAF", "rp5", "WBAN", "domes_id") if get(name) not in (None, "")],
        "min": json_value(get("min")),
        "max": json_value(get("max")),
        "avg": json_value(get("avg")),
        "fields": {name: json_value(values[index]) for index, name in enumerate(headers)},
        "revision": revision_for(values, headers),
    }


def read_stations(path):
    if not path.exists():
        raise FileNotFoundError(f"找不到工作簿：{path}")
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        sheet, header_row, headers = workbook_sheet(workbook)
        last_id_row = validate_station_ids(sheet, header_row, headers)
        rows = []
        for row_no, values in enumerate(sheet.iter_rows(min_row=header_row + 1, max_row=last_id_row, values_only=True), start=header_row + 1):
            item = row_to_station(row_no, values, headers)
            if item:
                rows.append(item)
        return sheet.title, rows, headers, header_row
    finally:
        workbook.close()


def set_workbook_path(raw_path):
    path_text = str(raw_path).strip()
    if (path_text.startswith('"') and path_text.endswith('"')) or (path_text.startswith("'") and path_text.endswith("'")):
        path_text = path_text[1:-1].strip()
    candidate = Path(path_text).expanduser()
    if candidate.suffix.lower() != ".xlsx":
        raise ValueError("请选择 .xlsx 文件。")
    try:
        candidate = candidate.resolve(strict=True)
    except OSError as exc:
        raise FileNotFoundError(f"找不到文件：{candidate}") from exc
    if not candidate.is_file():
        raise ValueError("所选路径不是文件。")
    # Validate the workbook and its required data columns before changing the active file.
    read_stations(candidate)
    CONFIG_PATH.write_text(json.dumps({"workbook_path": str(candidate)}, ensure_ascii=False, indent=2), encoding="utf-8")
    global ACTIVE_WORKBOOK_PATH
    ACTIVE_WORKBOOK_PATH = candidate
    return candidate


def save_workbook(workbook, path):
    temp_name = None
    try:
        with tempfile.NamedTemporaryFile(prefix=f".{path.stem}_", suffix=path.suffix, dir=path.parent, delete=False) as tmp:
            temp_name = tmp.name
        workbook.save(temp_name)
        os.replace(temp_name, path)
        temp_name = None
    finally:
        if temp_name and os.path.exists(temp_name):
            os.unlink(temp_name)


def save_station(path, row_no, values, expected_revision):
    if len(values) != 3:
        raise ValueError("需要提供 min、max、avg 三个值。")
    for value in values:
        if value is not None and str(value).strip() != "":
            number = float(value)
            if not (number == number and abs(number) != float("inf")):
                raise ValueError("温度值必须是有效数字。")

    workbook = load_workbook(path, data_only=False)
    try:
        sheet, header_row, headers = workbook_sheet(workbook)
        if row_no <= header_row or row_no > sheet.max_row:
            raise ValueError("站点行已不存在。请重新载入工作簿。")
        old = [sheet.cell(row=row_no, column=col).value for col in range(1, len(headers) + 1)]
        current_revision = revision_for(old, headers)
        if current_revision != expected_revision:
            raise ValueError("此站点在工作簿中已被其他操作修改。请重新载入后再编辑。")
        positions = {name: i + 1 for i, name in enumerate(headers)}
        for name, value in zip(REQUIRED_HEADERS, values):
            cell = sheet.cell(row=row_no, column=positions[name])
            cell.value = None if value is None or str(value).strip() == "" else float(value)

        save_workbook(workbook, path)
        row_now = [sheet.cell(row=row_no, column=col).value for col in range(1, len(headers) + 1)]
        return revision_for(row_now, headers)
    finally:
        workbook.close()


def update_station(path, row_no, new_values, expected_revision):
    workbook = load_workbook(path, data_only=False)
    try:
        sheet, header_row, headers = workbook_sheet(workbook)
        if row_no <= header_row or row_no > sheet.max_row:
            raise ValueError("站点行已不存在。请重新载入工作簿。")
        positions = {name: i + 1 for i, name in enumerate(headers)}
        if "id" not in positions:
            raise ValueError("找不到 id 列。")

        old = [sheet.cell(row=row_no, column=col).value for col in range(1, len(headers) + 1)]
        if revision_for(old, headers) != expected_revision:
            raise ValueError("此站点在工作簿中已被其他操作修改。请重新载入后再编辑。")

        for name in REQUIRED_HEADERS:
            raw = str(new_values.get(name, "")).strip()
            if raw:
                try:
                    number = float(raw)
                except ValueError as exc:
                    raise ValueError("min、max、avg 只能填写数字或留空。") from exc
                if not math.isfinite(number):
                    raise ValueError("温度值必须是有效数字。")

        usaf_column = positions.get("USAF")
        candidate_usaf = str(new_values.get("USAF", "")).strip()
        if usaf_column and candidate_usaf:
            id_column = positions["id"]
            marker_column = positions.get("min")
            for check_row in range(header_row + 1, sheet.max_row + 1):
                if check_row == row_no:
                    continue
                marker = sheet.cell(row=check_row, column=marker_column).value if marker_column else None
                current_id = sheet.cell(row=check_row, column=id_column).value
                current_usaf = sheet.cell(row=check_row, column=usaf_column).value
                if (str(marker or "").strip().upper() != "END"
                        and current_id not in (None, "")
                        and str(current_usaf or "").strip() == candidate_usaf):
                    raise ValueError(f"USAF {candidate_usaf} 已存在，请检查重复站点代码。")

        numeric_fields = {"min", "max", "avg", "latitude", "longitude", "elev", "timezone", "region_id"}
        for name, column in positions.items():
            if name == "id":
                continue
            raw = str(new_values.get(name, "")).strip()
            if not raw:
                value = None
            elif name in numeric_fields:
                try:
                    value = float(raw)
                except ValueError:
                    value = raw
            else:
                value = raw
            sheet.cell(row=row_no, column=column).value = value

        save_workbook(workbook, path)
        row_now = [sheet.cell(row=row_no, column=col).value for col in range(1, len(headers) + 1)]
        return row_now[positions["id"] - 1], revision_for(row_now, headers)
    finally:
        workbook.close()


def insert_station(path, after_id, new_values):
    workbook = load_workbook(path, data_only=False)
    try:
        sheet, header_row, headers = workbook_sheet(workbook)
        positions = {name: i + 1 for i, name in enumerate(headers)}
        if "id" not in positions:
            raise ValueError("找不到 id 列。")
        id_column = positions["id"]
        marker_column = positions.get("min")
        after_row = None
        for row_no in range(header_row + 1, sheet.max_row + 1):
            value = sheet.cell(row=row_no, column=id_column).value
            marker = sheet.cell(row=row_no, column=marker_column).value if marker_column else None
            if isinstance(value, (int, float)) and value == after_id and str(marker or "").strip().upper() != "END":
                after_row = row_no
                break
        if after_row is None:
            raise ValueError(f"找不到 ID {after_id}。请重新载入工作簿。")

        usaf_column = positions.get("USAF")
        candidate_usaf = str(new_values.get("USAF", "")).strip()
        if usaf_column and candidate_usaf:
            for row_no in range(header_row + 1, sheet.max_row + 1):
                marker = sheet.cell(row=row_no, column=marker_column).value if marker_column else None
                current_id = sheet.cell(row=row_no, column=id_column).value
                current_usaf = sheet.cell(row=row_no, column=usaf_column).value
                if (str(marker or "").strip().upper() != "END"
                        and current_id not in (None, "")
                        and str(current_usaf or "").strip() == candidate_usaf):
                    raise ValueError(f"USAF {candidate_usaf} 已存在，请检查重复站点代码。")

        if not any(str(new_values.get(name, "")).strip() for name in ("cn_name", "USAF", "rp5", "WBAN", "domes_id")):
            raise ValueError("请至少填写站点名称或一个站点代码。")

        insert_row = after_row + 1
        source_row = after_row
        sheet.insert_rows(insert_row, 1)
        for col in range(1, sheet.max_column + 1):
            source = sheet.cell(row=source_row, column=col)
            target = sheet.cell(row=insert_row, column=col)
            if source.has_style:
                target._style = copy(source._style)
            if source.number_format:
                target.number_format = source.number_format
            if source.alignment:
                target.alignment = copy(source.alignment)
            if source.protection:
                target.protection = copy(source.protection)
        if source_row in sheet.row_dimensions:
            sheet.row_dimensions[insert_row].height = sheet.row_dimensions[source_row].height

        new_id = int(after_id) + 1
        for row_no in range(insert_row + 1, sheet.max_row + 1):
            marker = sheet.cell(row=row_no, column=marker_column).value if marker_column else None
            if str(marker or "").strip().upper() == "END":
                continue
            cell = sheet.cell(row=row_no, column=id_column)
            if isinstance(cell.value, (int, float)):
                cell.value += 1
        sheet.cell(row=insert_row, column=id_column).value = new_id

        numeric_fields = {"min", "max", "avg", "latitude", "longitude", "elev", "timezone", "region_id"}
        for name, column in positions.items():
            if name == "id":
                continue
            raw = str(new_values.get(name, "")).strip()
            if not raw:
                value = None
            elif name in numeric_fields:
                try:
                    value = float(raw)
                except ValueError:
                    value = raw
            else:
                value = raw
            sheet.cell(row=insert_row, column=column).value = value

        save_workbook(workbook, path)
        return new_id
    finally:
        workbook.close()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        route = urlparse(self.path).path
        if route == "/":
            body = PAGE.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if route == "/api/data":
            try:
                with WRITE_LOCK:
                    path = ACTIVE_WORKBOOK_PATH
                    sheet, rows, headers, _ = read_stations(path)
                self.send_json(200, {"path": str(path), "sheet": sheet, "rows": rows, "headers": headers, "count": len(rows)})
            except Exception as exc:
                self.send_json(500, {"path": str(ACTIVE_WORKBOOK_PATH), "error": str(exc)})
            return
        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        route = urlparse(self.path).path
        if route not in ("/api/save", "/api/insert", "/api/update", "/api/path"):
            self.send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            if route == "/api/path":
                with WRITE_LOCK:
                    path = set_workbook_path(payload.get("path", ""))
                self.send_json(200, {"ok": True, "path": str(path)})
                return
            if route == "/api/insert":
                after_id = int(payload["after_id"])
                with WRITE_LOCK:
                    new_id = insert_station(ACTIVE_WORKBOOK_PATH, after_id, payload.get("values", {}))
                self.send_json(200, {"ok": True, "id": new_id})
                return
            if route == "/api/update":
                row_no = int(payload["row"])
                with WRITE_LOCK:
                    station_id, new_revision = update_station(
                        ACTIVE_WORKBOOK_PATH,
                        row_no,
                        payload.get("values", {}),
                        str(payload.get("revision", "")),
                    )
                self.send_json(200, {"ok": True, "id": station_id, "revision": new_revision})
                return
            row_no = int(payload["row"])
            values = payload["values"]
            revision = str(payload["revision"])
            with WRITE_LOCK:
                new_revision = save_station(ACTIVE_WORKBOOK_PATH, row_no, values, revision)
            self.send_json(200, {"ok": True, "revision": new_revision})
        except PermissionError:
            self.send_json(423, {"error": "无法写入工作簿。请关闭 Excel 中打开的该文件后重试，并确认文件夹可写。"})
        except Exception as exc:
            self.send_json(400, {"error": str(exc)})


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True
    url = f"http://{HOST}:{PORT}"
    print(f"气象站数据编辑器已启动：{url}")
    print(f"当前工作簿：{ACTIVE_WORKBOOK_PATH}")
    print("保持此窗口打开即可使用；按 Ctrl+C 停止服务。")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在关闭…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
