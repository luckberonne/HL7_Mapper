// CRUD de perfiles de campos condicionales y sus reglas.

import { execute, persist, query } from './database';
import type { NewRule, Profile, Rule } from './models';

export function listProfiles(): Promise<Profile[]> {
  return query<Profile>('SELECT * FROM profiles ORDER BY name COLLATE NOCASE');
}

export async function getActiveProfile(): Promise<Profile | null> {
  const rows = await query<Profile>('SELECT * FROM profiles WHERE active = 1 LIMIT 1');
  return rows[0] ?? null;
}

export function createProfile(name: string): Promise<number> {
  return execute('INSERT INTO profiles (name, active, created_at) VALUES (?, 0, ?)', [
    name,
    new Date().toISOString(),
  ]);
}

export async function deleteProfile(id: number): Promise<void> {
  await execute('DELETE FROM rules WHERE profile_id = ?', [id]);
  await execute('DELETE FROM profiles WHERE id = ?', [id]);
}

/** Activa un perfil (o ninguno si id es null), desactivando el resto. */
export async function setActiveProfile(id: number | null): Promise<void> {
  await execute('UPDATE profiles SET active = 0', []);
  if (id !== null) {
    await execute('UPDATE profiles SET active = 1 WHERE id = ?', [id]);
  } else {
    await persist();
  }
}

export function listRules(profileId: number): Promise<Rule[]> {
  return query<Rule>(
    'SELECT * FROM rules WHERE profile_id = ? ORDER BY structure_id, segment, field',
    [profileId],
  );
}

/** Reglas del perfil activo (vacio si no hay perfil activo). */
export async function getActiveRules(): Promise<Rule[]> {
  const active = await getActiveProfile();
  if (!active) return [];
  return listRules(active.id);
}

export function addRule(rule: NewRule): Promise<number> {
  return execute(
    'INSERT INTO rules (profile_id, structure_id, segment, field, requirement, note) VALUES (?, ?, ?, ?, ?, ?)',
    [
      rule.profile_id,
      rule.structure_id || '*',
      rule.segment.toUpperCase(),
      rule.field,
      rule.requirement,
      rule.note,
    ],
  );
}

export async function deleteRule(id: number): Promise<void> {
  await execute('DELETE FROM rules WHERE id = ?', [id]);
}
