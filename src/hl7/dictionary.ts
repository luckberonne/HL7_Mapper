// Wrapper sobre `hl7-dictionary` (paquete de datos puros). Aisla el resto del
// codigo de la forma exacta del paquete y resuelve version/estructura.
//
// Forma del paquete:
//   definitions[version] = { fields, segments, messages }
//   segments[SEG].fields[] = { datatype, desc, opt, rep, len, table? }   (opt: 1 = opcional, 2 = requerido)
//   messages[STRUCT].segments.segments[] = { name, desc, min, max }
//   fields[DATATYPE].subfields[] = { datatype, desc, opt, rep, len }

// @ts-expect-error: paquete CommonJS sin tipos.
import hl7dict from 'hl7-dictionary';

export interface FieldDef {
  datatype: string;
  desc: string;
  /** Optionality del diccionario: 1 = opcional, 2 = requerido. */
  opt: number;
  rep: number;
  len?: number;
  table?: string;
}

/** Optionality requerida segun el diccionario hl7-dictionary. */
export const OPT_REQUIRED = 2;

export interface SegmentDef {
  desc: string;
  fields: FieldDef[];
}

export interface MessageSegmentRef {
  name: string;
  desc: string;
  min: number;
  max: number;
  children?: MessageSegmentRef[];
}

export interface MessageDef {
  desc: string;
  name: string;
  segments: { desc: string; segments: MessageSegmentRef[] };
}

interface VersionDef {
  fields: Record<string, { desc: string; subfields?: FieldDef[] }>;
  segments: Record<string, SegmentDef>;
  messages: Record<string, MessageDef>;
}

const definitions: Record<string, VersionDef> = hl7dict.definitions;

/** Version usada cuando la declarada en MSH-12 no existe en el diccionario. */
export const DEFAULT_VERSION = '2.5.1';

/** Lista de versiones soportadas por el diccionario. */
export function availableVersions(): string[] {
  return Object.keys(definitions);
}

/**
 * Resuelve la version a usar para validar. Devuelve la version declarada si existe,
 * de lo contrario la version por defecto y `fallback: true`.
 */
export function resolveVersion(declared: string): { version: string; fallback: boolean } {
  if (declared && definitions[declared]) {
    return { version: declared, fallback: false };
  }
  return { version: DEFAULT_VERSION, fallback: true };
}

export function getSegmentDef(version: string, segment: string): SegmentDef | undefined {
  return definitions[version]?.segments?.[segment];
}

/**
 * Busca la definicion de estructura del mensaje probando variantes:
 * structureId directo (ADT_A01), luego TIPO_EVENTO, luego solo TIPO.
 */
export function getMessageDef(
  version: string,
  structureId: string,
  messageType: string,
  triggerEvent: string,
): MessageDef | undefined {
  const messages = definitions[version]?.messages;
  if (!messages) return undefined;
  const candidates = [
    structureId,
    messageType && triggerEvent ? `${messageType}_${triggerEvent}` : '',
    messageType,
  ].filter(Boolean);
  for (const key of candidates) {
    if (messages[key]) return messages[key];
  }
  return undefined;
}
