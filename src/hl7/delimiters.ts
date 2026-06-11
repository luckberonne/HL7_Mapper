import type { Delimiters } from './types';

/** Delimitadores HL7 v2 estandar. */
export const DEFAULT_DELIMITERS: Delimiters = {
  field: '|',
  component: '^',
  repetition: '~',
  escape: '\\',
  subcomponent: '&',
};

/**
 * Extrae los delimitadores desde la cabecera MSH.
 * En HL7 v2, MSH-1 es el separador de campo (4to caracter del segmento) y
 * MSH-2 son los caracteres de codificacion: componente, repeticion, escape, subcomponente.
 */
export function extractDelimiters(mshSegment: string): Delimiters {
  if (!mshSegment || mshSegment.slice(0, 3).toUpperCase() !== 'MSH' || mshSegment.length < 4) {
    return { ...DEFAULT_DELIMITERS };
  }

  const field = mshSegment.charAt(3);
  // Los caracteres de codificacion van entre el primer y el segundo separador de campo.
  const afterField = mshSegment.slice(4);
  const encoding = afterField.split(field)[0] ?? '';

  return {
    field,
    component: encoding.charAt(0) || DEFAULT_DELIMITERS.component,
    repetition: encoding.charAt(1) || DEFAULT_DELIMITERS.repetition,
    escape: encoding.charAt(2) || DEFAULT_DELIMITERS.escape,
    subcomponent: encoding.charAt(3) || DEFAULT_DELIMITERS.subcomponent,
  };
}
