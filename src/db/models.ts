// Tipos de las entidades persistidas en SQLite.

/** Override de optionality que un perfil aplica a un campo. */
export type Requirement = 'conditional' | 'required' | 'optional';

export interface Profile {
  id: number;
  name: string;
  active: number; // 0 | 1
  created_at: string;
}

export interface Rule {
  id: number;
  profile_id: number;
  /** Estructura a la que aplica (p.ej. ADT_A01) o '*' para todas. */
  structure_id: string;
  /** Segmento, p.ej. PID. */
  segment: string;
  /** Numero de campo HL7 (1-based), p.ej. 11. */
  field: number;
  requirement: Requirement;
  note: string | null;
}

/** Datos para crear una regla (sin id). */
export type NewRule = Omit<Rule, 'id'>;

export interface HistoryEntry {
  id: number;
  processed_at: string;
  structure_id: string | null;
  version: string | null;
  valid: number; // 0 | 1
  required_missing: number;
  message: string;
  /** JSON con el resumen de conteos. */
  counts: string | null;
}
