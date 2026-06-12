import type {
  FieldReport,
  FieldStatus,
  IntegrityReport,
  ParsedMessage,
} from '../hl7/types';
import { translateFieldName } from '../i18n/fieldNames';

/**
 * Devuelve el HTML del nombre de campo. Si hay traduccion disponible y difiere
 * del original, lo envuelve para mostrar la traduccion en un tooltip al pasar el mouse.
 */
function fieldNameHtml(name: string): string {
  const translated = translateFieldName(name);
  if (translated && translated !== name) {
    return `<span class="field-name" title="${escapeHtml(translated)}">${escapeHtml(name)}</span>`;
  }
  return escapeHtml(name);
}

const STATUS_LABEL: Record<FieldStatus, string> = {
  'required-ok': 'Requerido OK',
  'required-missing': 'Requerido FALTANTE',
  'optional-present': 'Opcional presente',
  'optional-absent': 'Opcional ausente',
  conditional: 'Condicional',
  unknown: 'Sin definicion',
  custom: 'Personalizado',
};

const STATUS_CLASS: Record<FieldStatus, string> = {
  'required-ok': 'st-req-ok',
  'required-missing': 'st-req-missing',
  'optional-present': 'st-opt-present',
  'optional-absent': 'st-opt-absent',
  conditional: 'st-conditional',
  unknown: 'st-unknown',
  custom: 'st-custom',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fieldRow(f: FieldReport): string {
  const value = f.value.trim().length > 0 ? escapeHtml(f.value) : '<span class="empty">(vacio)</span>';
  const overrideMark = f.overridden ? ' <span class="override-mark" title="Definido por perfil condicional">★</span>' : '';
  return `
    <tr class="${STATUS_CLASS[f.status]}">
      <td class="num">${f.segment}-${f.index}</td>
      <td>${fieldNameHtml(f.name)}${overrideMark}</td>
      <td class="val">${value}</td>
      <td class="dt">${escapeHtml(f.datatype || '-')}</td>
      <td><span class="badge ${STATUS_CLASS[f.status]}">${STATUS_LABEL[f.status]}</span></td>
    </tr>`;
}

function renderSummary(parsed: ParsedMessage, r: IntegrityReport): string {
  const badge = r.valid
    ? '<span class="status-badge ok">INTEGRO</span>'
    : '<span class="status-badge bad">INCOMPLETO</span>';

  const versionNote = r.versionFallback ? ` <span class="hint">(fallback)</span>` : '';

  return `
    <section class="summary">
      <div class="summary-head">
        <h2>Resumen</h2>
        ${badge}
      </div>
      <div class="summary-grid">
        <div><span class="k">Tipo de mensaje</span><span class="v">${escapeHtml(parsed.messageType || '-')}^${escapeHtml(parsed.triggerEvent || '-')}</span></div>
        <div><span class="k">Estructura</span><span class="v">${escapeHtml(r.structureId || '-')} ${r.structureKnown ? '' : '<span class="hint">(no definida)</span>'}</span></div>
        <div><span class="k">Version</span><span class="v">${escapeHtml(r.version)}${versionNote}</span></div>
        <div><span class="k">Segmentos</span><span class="v">${parsed.segments.length}</span></div>
      </div>
      <div class="counts">
        <span class="chip st-req-ok">Requeridos OK: ${r.counts.requiredOk}/${r.counts.requiredTotal}</span>
        <span class="chip st-req-missing">Requeridos faltantes: ${r.counts.requiredMissing}</span>
        <span class="chip st-opt-present">Opcionales presentes: ${r.counts.optionalPresent}</span>
        <span class="chip st-opt-absent">Opcionales ausentes: ${r.counts.optionalAbsent}</span>
        ${r.counts.conditional > 0 ? `<span class="chip st-conditional">Condicionales: ${r.counts.conditional}</span>` : ''}
      </div>
    </section>`;
}

function renderWarnings(r: IntegrityReport): string {
  if (r.warnings.length === 0) return '';
  const items = r.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('');
  return `<section class="warnings"><h3>Advertencias</h3><ul>${items}</ul></section>`;
}

function renderMissing(r: IntegrityReport): string {
  if (r.valid && r.missingRequiredSegments.length === 0) {
    return `<section class="missing ok-box"><h3>Datos requeridos</h3><p>Todos los datos requeridos estan presentes.</p></section>`;
  }

  const segs = r.missingRequiredSegments
    .map((s) => `<li><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.desc)} (cardinalidad min ${s.min})</li>`)
    .join('');
  const segBlock = r.missingRequiredSegments.length
    ? `<h4>Segmentos requeridos ausentes</h4><ul>${segs}</ul>`
    : '';

  const fields = r.missingRequiredFields
    .map((f) => `<li><strong>${escapeHtml(f.segment)}-${f.index}</strong> ${fieldNameHtml(f.name)} <span class="dt">[${escapeHtml(f.datatype)}]</span></li>`)
    .join('');
  const fieldBlock = r.missingRequiredFields.length
    ? `<h4>Campos requeridos faltantes</h4><ul>${fields}</ul>`
    : '';

  return `<section class="missing bad-box"><h3>Datos requeridos faltantes</h3>${segBlock}${fieldBlock}</section>`;
}

function renderSegments(r: IntegrityReport): string {
  const blocks = r.segments
    .map((seg) => {
      const title = seg.occurrence > 1 ? `${seg.name}#${seg.occurrence}` : seg.name;
      const rows = seg.fields.map(fieldRow).join('');
      const body = rows
        ? `<table class="fields">
             <thead><tr><th>Campo</th><th>Nombre</th><th>Valor</th><th>Tipo</th><th>Estado</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`
        : `<p class="empty">Segmento sin campos.</p>`;
      return `
        <details class="segment">
          <summary>
            <span class="seg-name">${escapeHtml(title)}</span>
            <span class="seg-desc">${escapeHtml(seg.desc)}</span>
            ${seg.known ? '' : '<span class="badge st-unknown">desconocido</span>'}
          </summary>
          ${body}
        </details>`;
    })
    .join('');
  return `<section class="segments"><h3>Detalle por segmento</h3>${blocks}</section>`;
}

/** Renderiza el reporte completo dentro del contenedor dado. */
export function renderReport(
  container: HTMLElement,
  parsed: ParsedMessage,
  report: IntegrityReport,
): void {
  container.innerHTML = [
    renderSummary(parsed, report),
    renderWarnings(report),
    renderMissing(report),
    renderSegments(report),
  ].join('');
}

/** Muestra un mensaje de error en el contenedor. */
export function renderError(container: HTMLElement, message: string): void {
  container.innerHTML = `<section class="error-box"><h3>Error al parsear</h3><p>${escapeHtml(message)}</p></section>`;
}
