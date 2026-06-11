import type {
  FieldReport,
  FieldStatus,
  IntegrityReport,
  MissingSegment,
  ParsedMessage,
  ParsedSegment,
  SegmentReport,
} from './types';
import {
  getMessageDef,
  getSegmentDef,
  OPT_REQUIRED,
  resolveVersion,
  type FieldDef,
} from './dictionary';

function fieldValue(seg: ParsedSegment, fieldNumber: number): string {
  return seg.fields[fieldNumber]?.raw ?? '';
}

function isRequired(def: FieldDef): boolean {
  return def.opt === OPT_REQUIRED;
}

function classify(def: FieldDef, value: string): FieldStatus {
  const present = value.trim().length > 0;
  if (isRequired(def)) {
    return present ? 'required-ok' : 'required-missing';
  }
  return present ? 'optional-present' : 'optional-absent';
}

/** Construye el reporte de campos de un segmento contra su definicion. */
function buildSegmentReport(
  seg: ParsedSegment,
  occurrence: number,
  version: string,
): SegmentReport {
  const def = getSegmentDef(version, seg.name);
  const label = occurrence > 1 ? `${seg.name}#${occurrence}` : seg.name;
  const fields: FieldReport[] = [];

  const definedCount = def?.fields.length ?? 0;
  const parsedCount = seg.fields.length - 1; // indice 0 sin usar
  const total = Math.max(definedCount, parsedCount);

  for (let i = 1; i <= total; i++) {
    const fdef = def?.fields[i - 1]; // fields[] es 0-based; campo HL7 i -> indice i-1
    const value = fieldValue(seg, i);
    if (fdef) {
      fields.push({
        segment: label,
        index: i,
        name: fdef.desc,
        datatype: fdef.datatype,
        length: fdef.len,
        value,
        status: classify(fdef, value),
        required: isRequired(fdef),
      });
    } else if (value.trim().length > 0) {
      // Campo presente sin definicion en el diccionario.
      fields.push({
        segment: label,
        index: i,
        name: '(sin definicion)',
        datatype: '',
        value,
        status: 'unknown',
        required: false,
      });
    }
  }

  return {
    name: seg.name,
    occurrence,
    desc: def?.desc ?? '(segmento desconocido)',
    known: !!def,
    fields,
  };
}

/** Analiza la integridad de un mensaje HL7 parseado. */
export function analyzeIntegrity(message: ParsedMessage): IntegrityReport {
  const warnings: string[] = [];
  const { version, fallback } = resolveVersion(message.declaredVersion);
  if (fallback) {
    warnings.push(
      message.declaredVersion
        ? `Version "${message.declaredVersion}" no esta en el diccionario; se valido contra ${version}.`
        : `El mensaje no declara version (MSH-12); se valido contra ${version}.`,
    );
  }

  const messageDef = getMessageDef(
    version,
    message.structureId,
    message.messageType,
    message.triggerEvent,
  );
  if (!messageDef) {
    warnings.push(
      `No se encontro la definicion de estructura "${message.structureId || '(desconocida)'}" en HL7 ${version}; ` +
        `solo se valida a nivel de campos por segmento.`,
    );
  }

  // --- Validacion de estructura (segmentos requeridos) ---
  const presentSegmentNames = new Set(message.segments.map((s) => s.name));
  const missingRequiredSegments: MissingSegment[] = [];
  if (messageDef) {
    for (const ref of messageDef.segments.segments) {
      if (ref.min >= 1 && !presentSegmentNames.has(ref.name)) {
        missingRequiredSegments.push({
          name: ref.name,
          desc: ref.desc,
          min: ref.min,
          max: ref.max,
        });
      }
    }
  }

  // --- Validacion de campos por segmento ---
  const occurrences = new Map<string, number>();
  const segments: SegmentReport[] = message.segments.map((seg) => {
    const occ = (occurrences.get(seg.name) ?? 0) + 1;
    occurrences.set(seg.name, occ);
    return buildSegmentReport(seg, occ, version);
  });

  const unknownSegments = [
    ...new Set(segments.filter((s) => !s.known).map((s) => s.name)),
  ];

  // --- Conteos ---
  const counts = {
    requiredTotal: 0,
    requiredOk: 0,
    requiredMissing: 0,
    optionalPresent: 0,
    optionalAbsent: 0,
  };
  const missingRequiredFields: FieldReport[] = [];

  for (const segRep of segments) {
    for (const f of segRep.fields) {
      switch (f.status) {
        case 'required-ok':
          counts.requiredTotal++;
          counts.requiredOk++;
          break;
        case 'required-missing':
          counts.requiredTotal++;
          counts.requiredMissing++;
          missingRequiredFields.push(f);
          break;
        case 'optional-present':
          counts.optionalPresent++;
          break;
        case 'optional-absent':
          counts.optionalAbsent++;
          break;
      }
    }
  }

  const valid = counts.requiredMissing === 0 && missingRequiredSegments.length === 0;

  return {
    version,
    versionFallback: fallback,
    messageType: message.messageType,
    triggerEvent: message.triggerEvent,
    structureId: message.structureId,
    structureKnown: !!messageDef,
    valid,
    counts,
    missingRequiredSegments,
    unknownSegments,
    missingRequiredFields,
    segments,
    warnings,
  };
}
