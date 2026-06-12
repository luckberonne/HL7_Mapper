// Pagina principal: editor del mensaje, acciones, selector de perfil activo y reporte.

import { parseMessage } from '../hl7/parser';
import { analyzeIntegrity } from '../hl7/validator';
import { renderError, renderReport } from '../ui/render';
import { buildExportPayload, downloadJson } from '../ui/download';
import { initProfileSelector } from '../ui/profileSelector';
import { getActiveRules } from '../db/profiles';
import { addHistory } from '../db/history';
import { state } from '../state';
import sampleMessage from '../samples/adt_a01.hl7?raw';

export function mountMainView(container: HTMLElement): void {
  container.innerHTML = `
    <section class="input-panel">
      <label for="hl7-input">Mensaje HL7 v2.x</label>
      <textarea id="hl7-input" spellcheck="false"
        placeholder="Pega aqui tu mensaje HL7 (segmentos separados por salto de linea)..."></textarea>
      <div class="actions">
        <button id="btn-analyze" class="primary">Analizar</button>
        <button id="btn-paste">Pegar</button>
        <button id="btn-sample">Cargar ejemplo</button>
        <button id="btn-file">Cargar archivo</button>
        <button id="btn-download" disabled>Descargar JSON</button>
        <button id="btn-clear" class="ghost">Limpiar</button>
        <input type="file" id="file-input" accept=".hl7,.txt,text/plain" hidden />
      </div>
    </section>

    <div id="profile-selector"></div>
    <section id="report" class="report"></section>
  `;

  const input = container.querySelector<HTMLTextAreaElement>('#hl7-input')!;
  const reportEl = container.querySelector<HTMLElement>('#report')!;
  const fileInput = container.querySelector<HTMLInputElement>('#file-input')!;
  const btnAnalyze = container.querySelector<HTMLButtonElement>('#btn-analyze')!;
  const btnPaste = container.querySelector<HTMLButtonElement>('#btn-paste')!;
  const btnSample = container.querySelector<HTMLButtonElement>('#btn-sample')!;
  const btnFile = container.querySelector<HTMLButtonElement>('#btn-file')!;
  const btnDownload = container.querySelector<HTMLButtonElement>('#btn-download')!;
  const btnClear = container.querySelector<HTMLButtonElement>('#btn-clear')!;

  input.value = state.currentMessage;

  initProfileSelector(container.querySelector<HTMLElement>('#profile-selector')!, () => {
    if (input.value.trim()) void analyze(false);
  });

  /**
   * Parsea, analiza y muestra el mensaje del editor.
   * @param record si true, guarda el analisis en el historial.
   */
  async function analyze(record: boolean): Promise<void> {
    const text = input.value;
    state.currentMessage = text;
    if (!text.trim()) {
      renderError(reportEl, 'Ingresa un mensaje HL7 para analizar.');
      btnDownload.disabled = true;
      state.lastParsed = null;
      state.lastReport = null;
      return;
    }
    try {
      const rules = await getActiveRules();
      const parsed = parseMessage(text);
      const report = analyzeIntegrity(parsed, rules);
      state.lastParsed = parsed;
      state.lastReport = report;
      renderReport(reportEl, parsed, report);
      btnDownload.disabled = false;
      if (record) await addHistory(text, parsed, report);
    } catch (err) {
      state.lastParsed = null;
      state.lastReport = null;
      btnDownload.disabled = true;
      renderError(reportEl, err instanceof Error ? err.message : String(err));
    }
  }

  input.addEventListener('input', () => {
    state.currentMessage = input.value;
  });

  btnAnalyze.addEventListener('click', () => void analyze(true));

  btnSample.addEventListener('click', () => {
    input.value = sampleMessage.trim();
    void analyze(true);
  });

  btnFile.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      input.value = String(reader.result ?? '');
      void analyze(true);
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        alert('El portapapeles esta vacio.');
        return;
      }
      input.value = text;
      await analyze(true);
    } catch {
      alert('No se pudo leer el portapapeles. Pega manualmente con Ctrl+V.');
    }
  });

  btnDownload.addEventListener('click', () => {
    if (!state.lastParsed || !state.lastReport) return;
    downloadJson(buildExportPayload(state.lastParsed, state.lastReport));
  });

  btnClear.addEventListener('click', () => {
    input.value = '';
    state.currentMessage = '';
    state.lastParsed = null;
    state.lastReport = null;
    reportEl.innerHTML = '';
    btnDownload.disabled = true;
  });

  // Al entrar a la pagina con un mensaje ya cargado (p.ej. desde Historial),
  // se analiza automaticamente sin volver a registrarlo en el historial.
  if (state.currentMessage.trim()) void analyze(false);
}
