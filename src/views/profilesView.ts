// Pagina de gestion de perfiles de campos condicionales.

import { initProfilesPanel } from '../ui/profilesPanel';
import { state } from '../state';

export function mountProfilesView(container: HTMLElement): void {
  initProfilesPanel(container, () => {
    // Cambian las reglas: invalida el ultimo reporte para que la pagina principal
    // vuelva a analizar con el perfil actualizado al regresar.
    state.lastReport = null;
    state.lastParsed = null;
  });
}
