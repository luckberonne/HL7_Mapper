import type {
  Delimiters,
  ParsedComponent,
  ParsedField,
  ParsedMessage,
  ParsedSegment,
} from './types';
import { DEFAULT_DELIMITERS, extractDelimiters } from './delimiters';

export class HL7ParseError extends Error {}

/** Separa el texto en lineas de segmento, normalizando saltos de linea. */
function splitSegments(text: string): string[] {
  return text
    .replace(/\r\n/g, '\r')
    .replace(/\n/g, '\r')
    .split('\r')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Descompone el valor crudo de un campo en repeticiones -> componentes -> subcomponentes. */
function parseFieldValue(raw: string, d: Delimiters): ParsedComponent[][] {
  const repetitions = raw.split(d.repetition);
  return repetitions.map((rep) => {
    const components = rep.split(d.component);
    return components.map<ParsedComponent>((comp) => ({
      value: comp,
      subcomponents: comp.split(d.subcomponent),
    }));
  });
}

/**
 * Parsea un segmento. El MSH se trata de forma especial: MSH-1 es el separador de
 * campo y MSH-2 son los caracteres de codificacion, de modo que la numeracion de
 * campos queda desplazada respecto a los demas segmentos.
 */
function parseSegment(raw: string, d: Delimiters): ParsedSegment {
  const name = raw.slice(0, 3).toUpperCase();
  const tokens = raw.split(d.field);
  const fields: ParsedField[] = [];

  if (name === 'MSH') {
    // tokens = ["MSH", "^~\&", campo3, campo4, ...]
    // MSH-1 = separador de campo, MSH-2 = tokens[1], MSH-n = tokens[n-1] (n>=2).
    fields[1] = {
      index: 1,
      raw: d.field,
      repetitions: [[{ value: d.field, subcomponents: [d.field] }]],
    };
    for (let i = 1; i < tokens.length; i++) {
      const fieldNumber = i + 1; // tokens[1] -> MSH-2
      const value = tokens[i] ?? '';
      fields[fieldNumber] = {
        index: fieldNumber,
        raw: value,
        repetitions: parseFieldValue(value, d),
      };
    }
  } else {
    // tokens = [name, campo1, campo2, ...]
    for (let i = 1; i < tokens.length; i++) {
      const value = tokens[i] ?? '';
      fields[i] = {
        index: i,
        raw: value,
        repetitions: parseFieldValue(value, d),
      };
    }
  }

  return { name, raw, fields };
}

/** Helper: lee el valor de un componente de un campo de un segmento ya parseado. */
function componentValue(seg: ParsedSegment | undefined, fieldNumber: number, componentNumber: number): string {
  const field = seg?.fields[fieldNumber];
  if (!field) return '';
  const firstRep = field.repetitions[0];
  if (!firstRep) return '';
  return firstRep[componentNumber - 1]?.value ?? '';
}

/** Parsea un mensaje HL7 v2.x completo. */
export function parseMessage(text: string): ParsedMessage {
  const lines = splitSegments(text);
  if (lines.length === 0) {
    throw new HL7ParseError('El mensaje esta vacio.');
  }

  const mshLine = lines.find((l) => l.slice(0, 3).toUpperCase() === 'MSH');
  if (!mshLine) {
    throw new HL7ParseError('No se encontro el segmento MSH (obligatorio en todo mensaje HL7).');
  }

  const delimiters = extractDelimiters(mshLine);
  const segments = lines.map((line) => parseSegment(line, delimiters));
  const msh = segments.find((s) => s.name === 'MSH');

  // MSH-9: tipo de mensaje (^ separa codigo, evento, estructura).
  const messageType = componentValue(msh, 9, 1);
  const triggerEvent = componentValue(msh, 9, 2);
  const explicitStructure = componentValue(msh, 9, 3);
  const declaredVersion = componentValue(msh, 12, 1);

  const structureId =
    explicitStructure ||
    (messageType && triggerEvent ? `${messageType}_${triggerEvent}` : messageType);

  return {
    delimiters: delimiters ?? DEFAULT_DELIMITERS,
    messageType,
    triggerEvent,
    structureId,
    declaredVersion,
    segments,
  };
}
