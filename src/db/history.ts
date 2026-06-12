// Historial de mensajes procesados, persistido en SQLite.

import { execute, query } from './database';
import type { HistoryEntry } from './models';
import type { IntegrityReport, ParsedMessage } from '../hl7/types';

/** Registra un analisis en el historial. Evita duplicar el mensaje mas reciente. */
export async function addHistory(
  message: string,
  parsed: ParsedMessage,
  report: IntegrityReport,
): Promise<void> {
  const last = await query<{ message: string }>(
    'SELECT message FROM history ORDER BY id DESC LIMIT 1',
  );
  if (last[0]?.message === message) return; // mismo mensaje consecutivo

  await execute(
    `INSERT INTO history (processed_at, structure_id, version, valid, required_missing, message, counts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      new Date().toISOString(),
      parsed.structureId || null,
      report.version || null,
      report.valid ? 1 : 0,
      report.counts.requiredMissing,
      message,
      JSON.stringify(report.counts),
    ],
  );
}

export function listHistory(limit = 50): Promise<HistoryEntry[]> {
  return query<HistoryEntry>('SELECT * FROM history ORDER BY id DESC LIMIT ?', [limit]);
}

export function getHistoryEntry(id: number): Promise<HistoryEntry[]> {
  return query<HistoryEntry>('SELECT * FROM history WHERE id = ?', [id]);
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  await execute('DELETE FROM history WHERE id = ?', [id]);
}

export async function clearHistory(): Promise<void> {
  await execute('DELETE FROM history', []);
}
