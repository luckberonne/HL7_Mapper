// Pagina de historial. Al hacer clic en una entrada se carga el mensaje en el
// editor de la pagina principal.

import { initHistoryPanel } from '../ui/historyPanel';
import { state } from '../state';
import { navigate } from '../router';

export function mountHistoryView(container: HTMLElement): void {
  initHistoryPanel(container, (message) => {
    state.currentMessage = message;
    state.lastParsed = null;
    state.lastReport = null;
    navigate('/'); // vuelve a la pagina principal, que muestra y analiza el mensaje
  });
}
