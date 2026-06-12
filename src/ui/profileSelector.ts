// Selector compacto del perfil condicional activo, para la pagina principal.
// La gestion completa (crear, reglas) vive en la pagina de Perfiles.

import { getActiveProfile, listProfiles, setActiveProfile } from '../db/profiles';

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Monta el selector de perfil activo. `onChange` se invoca al cambiar el perfil
 * para que la vista vuelva a analizar el mensaje actual.
 */
export function initProfileSelector(container: HTMLElement, onChange: () => void): void {
  async function render(): Promise<void> {
    const profiles = await listProfiles();
    const active = await getActiveProfile();
    container.innerHTML = `
      <div class="selector-bar">
        <label class="selector-label">Perfil condicional activo
          <select id="active-profile-select">
            <option value="">(ninguno)</option>
            ${profiles.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
          </select>
        </label>
        <a class="manage-link" href="#/perfiles">Gestionar perfiles →</a>
      </div>
    `;
    const select = container.querySelector<HTMLSelectElement>('#active-profile-select')!;
    select.value = active ? String(active.id) : '';
    select.addEventListener('change', async () => {
      await setActiveProfile(select.value ? Number(select.value) : null);
      onChange();
    });
  }

  void render();
}
