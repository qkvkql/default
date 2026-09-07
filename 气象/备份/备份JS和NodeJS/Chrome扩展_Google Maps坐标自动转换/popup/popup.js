/**
 * popup.js — Popup logic
 * Provides an inline test / preview for the coordinate converter.
 */

const COORD_RE = /^-?\d+(\.\d+)?,\s+-?\d+(\.\d+)?$/;

const testInput    = document.getElementById('testInput');
const convertBtn   = document.getElementById('convertBtn');
const resultRow    = document.getElementById('resultRow');
const resultValue  = document.getElementById('resultValue');
const copyResultBtn = document.getElementById('copyResultBtn');

function runConvert() {
  const raw = testInput.value.trim();
  if (!raw) return;

  if (!COORD_RE.test(raw)) {
    resultValue.textContent = '⚠ Not a valid coordinate pair';
    resultValue.style.color = '#ef5350';
    resultRow.classList.add('visible');
    return;
  }

  const converted = raw.replace(/,\s+/, '\t');
  // Display with a visible ⇥ marker so the user can see the TAB
  resultValue.textContent = converted.replace('\t', ' ⇥ ');
  resultValue.style.color = '';
  // Store the real converted value for copying
  resultValue.dataset.real = converted;
  resultRow.classList.add('visible');
}

convertBtn.addEventListener('click', runConvert);

testInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runConvert();
});

copyResultBtn.addEventListener('click', async () => {
  const text = resultValue.dataset.real;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyResultBtn.style.color = '#1de9b6';
    setTimeout(() => { copyResultBtn.style.color = ''; }, 1000);
  } catch (_) {}
});
