// Panel de historial de mensajes procesados (persistido en SQLite).

import { clearHistory, deleteHistoryEntry, getHistoryEntry, listHistory } from '../db/history';
import type { HistoryEntry } from '../db/models';

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export interface HistoryPanel {
  refresh(): Promise<void>;
}

/**
 * Monta el panel de historial. `onLoad` recibe el texto del mensaje al hacer clic
 * en una entrada, para recargarlo en el editor.
 */
export function initHistoryPanel(
  container: HTMLElement,
  onLoad: (message: string) => void,
): HistoryPanel {
  container.innerHTML = `
    <section class="panel history">
      <div class="history-head">
        <h3>Historial de mensajes</h3>
        <button id="history-clear" class="ghost">Limpiar historial</button>
      </div>
      <div id="history-list"></div>
    </section>
  `;

  const listEl = container.querySelector<HTMLElement>('#history-list')!;
  const clearBtn = container.querySelector<HTMLButtonElement>('#history-clear')!;

  async function refresh(): Promise<void> {
    const entries = await listHistory(50);
    if (entries.length === 0) {
      listEl.innerHTML = `<p class="panel-help">Aun no hay mensajes procesados.</p>`;
      clearBtn.disabled = true;
      return;
    }
    clearBtn.disabled = false;
    listEl.innerHTML = `
      <ul class="history-items">
        ${entries
          .map((e: HistoryEntry) => {
            const badge = e.valid
              ? '<span class="badge st-req-ok">INTEGRO</span>'
              : '<span class="badge st-req-missing">INCOMPLETO</span>';
            const missing = e.required_missing > 0 ? ` · ${e.required_missing} faltantes` : '';
            return `
              <li data-id="${e.id}">
                <button class="history-load" data-id="${e.id}">
                  <span class="h-struct">${esc(e.structure_id ?? '(desconocida)')}</span>
                  <span class="h-meta">v${esc(e.version ?? '?')} · ${esc(fmtDate(e.processed_at))}${missing}</span>
                </button>
                ${badge}
                <button class="history-del ghost" data-id="${e.id}" title="Eliminar">✕</button>
              </li>`;
          })
          .join('')}
      </ul>
    `;

    listEl.querySelectorAll<HTMLButtonElement>('.history-load').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const rows = await getHistoryEntry(Number(btn.dataset.id));
        if (rows[0]) onLoad(rows[0].message);
      });
    });

    listEl.querySelectorAll<HTMLButtonElement>('.history-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await deleteHistoryEntry(Number(btn.dataset.id));
        await refresh();
      });
    });
  }

  clearBtn.addEventListener('click', async () => {
    if (!confirm('¿Borrar todo el historial de mensajes?')) return;
    await clearHistory();
    await refresh();
  });

  void refresh();
  return { refresh };
}
