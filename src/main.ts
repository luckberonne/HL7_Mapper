import './style.css';
import { parseMessage } from './hl7/parser';
import { analyzeIntegrity } from './hl7/validator';
import { renderError, renderReport } from './ui/render';
import { buildExportPayload, downloadJson } from './ui/download';
import type { IntegrityReport, ParsedMessage } from './hl7/types';
import sampleMessage from './samples/adt_a01.hl7?raw';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="app-header">
    <h1>HL7 Mapper</h1>
    <p>Parsea mensajes HL7 v2.x y analiza su integridad: datos requeridos faltantes,
       opcionales y condicionales. Todo se procesa en tu navegador, sin IA ni envio de datos.</p>
  </header>

  <main>
    <section class="input-panel">
      <label for="hl7-input">Mensaje HL7 v2.x</label>
      <textarea id="hl7-input" spellcheck="false"
        placeholder="Pega aqui tu mensaje HL7 (segmentos separados por salto de linea)..."></textarea>
      <div class="actions">
        <button id="btn-analyze" class="primary">Analizar</button>
        <button id="btn-sample">Cargar ejemplo</button>
        <button id="btn-file">Cargar archivo</button>
        <button id="btn-download" disabled>Descargar JSON</button>
        <button id="btn-clear" class="ghost">Limpiar</button>
        <input type="file" id="file-input" accept=".hl7,.txt,text/plain" hidden />
      </div>
    </section>

    <section id="report" class="report"></section>
  </main>

  <footer class="app-footer">
    Validacion basada en el diccionario HL7 (<code>hl7-dictionary</code>): cada campo se clasifica como
    <code>requerido</code> u <code>opcional</code> segun la version del mensaje (MSH-12).
  </footer>
`;

const input = document.querySelector<HTMLTextAreaElement>('#hl7-input')!;
const reportEl = document.querySelector<HTMLElement>('#report')!;
const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
const btnAnalyze = document.querySelector<HTMLButtonElement>('#btn-analyze')!;
const btnSample = document.querySelector<HTMLButtonElement>('#btn-sample')!;
const btnFile = document.querySelector<HTMLButtonElement>('#btn-file')!;
const btnDownload = document.querySelector<HTMLButtonElement>('#btn-download')!;
const btnClear = document.querySelector<HTMLButtonElement>('#btn-clear')!;

let lastParsed: ParsedMessage | null = null;
let lastReport: IntegrityReport | null = null;

function analyze(): void {
  const text = input.value;
  if (!text.trim()) {
    renderError(reportEl, 'Ingresa un mensaje HL7 para analizar.');
    btnDownload.disabled = true;
    return;
  }
  try {
    lastParsed = parseMessage(text);
    lastReport = analyzeIntegrity(lastParsed);
    renderReport(reportEl, lastParsed, lastReport);
    btnDownload.disabled = false;
  } catch (err) {
    lastParsed = null;
    lastReport = null;
    btnDownload.disabled = true;
    renderError(reportEl, err instanceof Error ? err.message : String(err));
  }
}

btnAnalyze.addEventListener('click', analyze);

btnSample.addEventListener('click', () => {
  input.value = sampleMessage.trim();
  analyze();
});

btnFile.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    input.value = String(reader.result ?? '');
    analyze();
  };
  reader.readAsText(file);
  fileInput.value = '';
});

btnDownload.addEventListener('click', () => {
  if (!lastParsed || !lastReport) return;
  downloadJson(buildExportPayload(lastParsed, lastReport));
});

btnClear.addEventListener('click', () => {
  input.value = '';
  reportEl.innerHTML = '';
  btnDownload.disabled = true;
  lastParsed = null;
  lastReport = null;
});
