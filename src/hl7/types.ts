// Tipos del dominio HL7 usados en todo el mapper.

/** Delimitadores extraidos de la cabecera MSH. */
export interface Delimiters {
  field: string;        // | (MSH-1)
  component: string;    // ^
  repetition: string;   // ~
  escape: string;       // \
  subcomponent: string; // &
}

/** Un campo parseado de un segmento, con su descomposicion. */
export interface ParsedField {
  /** Numero de campo HL7 (1-based), p.ej. 3 para PID-3. */
  index: number;
  /** Valor crudo tal cual aparece en el mensaje. */
  raw: string;
  /** Repeticiones (separadas por ~). Cada repeticion es lista de componentes. */
  repetitions: ParsedComponent[][];
}

/** Un componente dentro de un campo, con sus subcomponentes. */
export interface ParsedComponent {
  value: string;
  subcomponents: string[];
}

/** Un segmento parseado. */
export interface ParsedSegment {
  /** Codigo de segmento de 3 letras, p.ej. MSH, PID. */
  name: string;
  /** Linea cruda original. */
  raw: string;
  /** Campos indexados por numero HL7 (1-based). El indice 0 no se usa. */
  fields: ParsedField[];
}

/** Mensaje HL7 completo parseado. */
export interface ParsedMessage {
  delimiters: Delimiters;
  /** Codigo de mensaje, p.ej. ADT (de MSH-9.1). */
  messageType: string;
  /** Evento disparador, p.ej. A01 (de MSH-9.2). */
  triggerEvent: string;
  /** Id de estructura, p.ej. ADT_A01 (MSH-9.3 o derivado). */
  structureId: string;
  /** Version declarada en MSH-12, p.ej. 2.5.1. */
  declaredVersion: string;
  segments: ParsedSegment[];
}

// ---- Reporte de integridad ----

export type FieldStatus =
  | 'required-ok'        // requerido y presente
  | 'required-missing'   // requerido y vacio
  | 'optional-present'   // opcional y presente
  | 'optional-absent'    // opcional y vacio
  | 'conditional'        // condicional (informativo)
  | 'unknown';           // sin definicion en el diccionario

export interface FieldReport {
  segment: string;       // nombre del segmento + numero de ocurrencia, p.ej. PID o PID#2
  index: number;         // numero de campo HL7
  name: string;          // descripcion legible del diccionario
  datatype: string;
  length?: number;
  value: string;         // valor crudo
  status: FieldStatus;
  required: boolean;
  overridden: boolean;   // true si un perfil condicional cambio su optionality
}

export interface SegmentReport {
  name: string;
  occurrence: number;
  desc: string;
  known: boolean;        // si el segmento existe en el diccionario
  fields: FieldReport[];
}

export interface MissingSegment {
  name: string;
  desc: string;
  min: number;
  max: number;
}

export interface IntegrityReport {
  version: string;            // version usada para validar
  versionFallback: boolean;   // true si se uso una version por defecto
  messageType: string;
  triggerEvent: string;
  structureId: string;
  structureKnown: boolean;    // si la estructura existe en el diccionario
  valid: boolean;             // sin requeridos faltantes (campos ni segmentos)
  counts: {
    requiredTotal: number;
    requiredOk: number;
    requiredMissing: number;
    optionalPresent: number;
    optionalAbsent: number;
    conditional: number;
  };
  /** Segmentos requeridos (min>=1) ausentes en el mensaje. */
  missingRequiredSegments: MissingSegment[];
  /** Segmentos presentes que no estan definidos para esta estructura/diccionario. */
  unknownSegments: string[];
  /** Campos requeridos faltantes, para destacar arriba. */
  missingRequiredFields: FieldReport[];
  /** Reporte detallado por segmento. */
  segments: SegmentReport[];
  /** Advertencias generales (version desconocida, estructura no encontrada, etc.). */
  warnings: string[];
}
