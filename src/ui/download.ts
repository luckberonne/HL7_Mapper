import type { IntegrityReport, ParsedMessage } from '../hl7/types';

/** Estructura del archivo JSON descargable. */
export interface ExportPayload {
  generatedAt: string;
  parsed: ParsedMessage;
  integrity: IntegrityReport;
}

export function buildExportPayload(
  parsed: ParsedMessage,
  integrity: IntegrityReport,
): ExportPayload {
  return {
    generatedAt: new Date().toISOString(),
    parsed,
    integrity,
  };
}

/** Serializa el payload y dispara la descarga del archivo JSON en el navegador. */
export function downloadJson(payload: ExportPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const structure = payload.integrity.structureId || 'mensaje';
  const stamp = payload.generatedAt.replace(/[:.]/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `hl7-${structure}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
