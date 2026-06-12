// Panel de gestion de perfiles de campos condicionales (persistidos en SQLite).

import {
  addRule,
  createProfile,
  deleteProfile,
  deleteRule,
  getActiveProfile,
  listProfiles,
  listRules,
  setActiveProfile,
} from '../db/profiles';
import type { Profile, Requirement, Rule } from '../db/models';

const REQUIREMENTS: Requirement[] = ['conditional', 'required', 'optional'];
const REQ_LABEL: Record<Requirement, string> = {
  conditional: 'Condicional',
  required: 'Requerido',
  optional: 'Opcional',
};

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface ProfilesPanel {
  refresh(): Promise<void>;
}

/**
 * Monta el panel de perfiles. `onChange` se invoca cuando cambia el perfil activo
 * o sus reglas, para que el llamador vuelva a analizar el mensaje actual.
 */
export function initProfilesPanel(
  container: HTMLElement,
  onChange: () => void,
): ProfilesPanel {
  container.innerHTML = `
    <section class="panel profiles">
      <h3>Perfiles de campos condicionales</h3>
      <p class="panel-help">Define reglas que marcan campos como condicionales, requeridos u opcionales.
        El perfil activo se aplica al analizar. Se guardan en SQLite (en tu navegador).</p>
      <div class="profile-controls">
        <label>Perfil activo
          <select id="profile-select"></select>
        </label>
        <button id="profile-delete" class="ghost">Eliminar perfil</button>
      </div>
      <div class="profile-create">
        <input id="profile-name" type="text" placeholder="Nombre de nuevo perfil" />
        <button id="profile-create-btn">Crear perfil</button>
      </div>
      <div id="rules-area"></div>
    </section>
  `;

  const select = container.querySelector<HTMLSelectElement>('#profile-select')!;
  const nameInput = container.querySelector<HTMLInputElement>('#profile-name')!;
  const createBtn = container.querySelector<HTMLButtonElement>('#profile-create-btn')!;
  const deleteBtn = container.querySelector<HTMLButtonElement>('#profile-delete')!;
  const rulesArea = container.querySelector<HTMLElement>('#rules-area')!;

  async function renderRules(profile: Profile | null): Promise<void> {
    if (!profile) {
      rulesArea.innerHTML = `<p class="panel-help">No hay perfil activo. Crea o selecciona uno para definir reglas.</p>`;
      return;
    }
    const rules = await listRules(profile.id);
    const rows = rules
      .map(
        (r: Rule) => `
        <tr>
          <td class="num">${esc(r.structure_id)}</td>
          <td class="num">${esc(r.segment)}-${r.field}</td>
          <td><span class="badge st-${r.requirement === 'required' ? 'req-ok' : r.requirement === 'conditional' ? 'conditional' : 'opt-present'}">${REQ_LABEL[r.requirement]}</span></td>
          <td>${esc(r.note ?? '')}</td>
          <td><button class="rule-del ghost" data-id="${r.id}">✕</button></td>
        </tr>`,
      )
      .join('');

    rulesArea.innerHTML = `
      <table class="rules-table">
        <thead><tr><th>Estructura</th><th>Campo</th><th>Optionality</th><th>Nota</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="empty">Sin reglas.</td></tr>'}</tbody>
      </table>
      <div class="rule-form">
        <input id="rule-structure" type="text" placeholder="Estructura (ADT_A01 o *)" value="*" />
        <input id="rule-segment" type="text" placeholder="Segmento (PID)" maxlength="3" />
        <input id="rule-field" type="number" min="1" placeholder="Campo #" />
        <select id="rule-req">${REQUIREMENTS.map((r) => `<option value="${r}">${REQ_LABEL[r]}</option>`).join('')}</select>
        <input id="rule-note" type="text" placeholder="Nota (opcional)" />
        <button id="rule-add">Agregar regla</button>
      </div>
    `;

    rulesArea.querySelectorAll<HTMLButtonElement>('.rule-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await deleteRule(Number(btn.dataset.id));
        await renderRules(profile);
        onChange();
      });
    });

    rulesArea.querySelector<HTMLButtonElement>('#rule-add')!.addEventListener('click', async () => {
      const segment = rulesArea.querySelector<HTMLInputElement>('#rule-segment')!.value.trim();
      const field = Number(rulesArea.querySelector<HTMLInputElement>('#rule-field')!.value);
      if (!segment || !field || field < 1) {
        alert('Indica al menos segmento y numero de campo valido.');
        return;
      }
      await addRule({
        profile_id: profile.id,
        structure_id: rulesArea.querySelector<HTMLInputElement>('#rule-structure')!.value.trim() || '*',
        segment,
        field,
        requirement: rulesArea.querySelector<HTMLSelectElement>('#rule-req')!.value as Requirement,
        note: rulesArea.querySelector<HTMLInputElement>('#rule-note')!.value.trim() || null,
      });
      await renderRules(profile);
      onChange();
    });
  }

  async function refresh(): Promise<void> {
    const profiles = await listProfiles();
    const active = await getActiveProfile();
    select.innerHTML =
      `<option value="">(ninguno)</option>` +
      profiles.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    select.value = active ? String(active.id) : '';
    deleteBtn.disabled = !active;
    await renderRules(active);
  }

  select.addEventListener('change', async () => {
    const id = select.value ? Number(select.value) : null;
    await setActiveProfile(id);
    await refresh();
    onChange();
  });

  createBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert('Indica un nombre para el perfil.');
      return;
    }
    const id = await createProfile(name);
    await setActiveProfile(id); // el nuevo queda activo
    nameInput.value = '';
    await refresh();
    onChange();
  });

  deleteBtn.addEventListener('click', async () => {
    const active = await getActiveProfile();
    if (!active) return;
    if (!confirm(`¿Eliminar el perfil "${active.name}" y sus reglas?`)) return;
    await deleteProfile(active.id);
    await refresh();
    onChange();
  });

  void refresh();
  return { refresh };
}
