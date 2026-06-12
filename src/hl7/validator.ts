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
import type { Requirement, Rule } from '../db/models';

function fieldValue(seg: ParsedSegment, fieldNumber: number): string {
  return seg.fields[fieldNumber]?.raw ?? '';
}

function baseRequirement(def: FieldDef): Requirement {
  return def.opt === OPT_REQUIRED ? 'required' : 'optional';
}

/**
 * Resuelve overrides de perfil. Las reglas especificas de la estructura tienen
 * prioridad sobre las comodin ('*').
 */
class OverrideResolver {
  private specific = new Map<string, Requirement>();
  private wildcard = new Map<string, Requirement>();

  constructor(rules: Rule[], structureId: string) {
    for (const rule of rules) {
      const key = `${rule.segment.toUpperCase()}|${rule.field}`;
      if (rule.structure_id === structureId) {
        this.specific.set(key, rule.requirement);
      } else if (rule.structure_id === '*') {
        this.wildcard.set(key, rule.requirement);
      }
    }
  }

  get(segment: string, field: number): Requirement | undefined {
    const key = `${segment.toUpperCase()}|${field}`;
    return this.specific.get(key) ?? this.wildcard.get(key);
  }

  get hasAny(): boolean {
    return this.specific.size > 0 || this.wildcard.size > 0;
  }
}

function statusFor(requirement: Requirement, value: string): FieldStatus {
  const present = value.trim().length > 0;
  switch (requirement) {
    case 'conditional':
      return 'conditional';
    case 'required':
      return present ? 'required-ok' : 'required-missing';
    default:
      return present ? 'optional-present' : 'optional-absent';
  }
}

/** Construye el reporte de campos de un segmento contra su definicion + overrides. */
function buildSegmentReport(
  seg: ParsedSegment,
  occurrence: number,
  version: string,
  overrides: OverrideResolver,
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
    const override = overrides.get(seg.name, i);

    if (fdef) {
      const requirement = override ?? baseRequirement(fdef);
      fields.push({
        segment: label,
        index: i,
        name: fdef.desc,
        datatype: fdef.datatype,
        length: fdef.len,
        value,
        status: statusFor(requirement, value),
        required: requirement === 'required',
        overridden: override !== undefined,
      });
    } else if (override) {
      // Campo sin definicion en el diccionario pero cubierto por un perfil.
      fields.push({
        segment: label,
        index: i,
        name: '(definido por perfil)',
        datatype: '',
        value,
        status: statusFor(override, value),
        required: override === 'required',
        overridden: true,
      });
    } else if (value.trim().length > 0) {
      // Campo presente sin definicion en el diccionario.
      const isCustom = seg.name.startsWith('Z');
      fields.push({
        segment: label,
        index: i,
        name: isCustom ? 'Campo local' : '(sin definicion)',
        datatype: '',
        value,
        status: isCustom ? 'custom' : 'unknown',
        required: false,
        overridden: false,
      });
    }
  }

  return {
    name: seg.name,
    occurrence,
    desc: def?.desc ?? (seg.name.startsWith('Z') ? 'Segmento Z (Personalizado)' : '(segmento desconocido)'),
    known: !!def || seg.name.startsWith('Z'),
    fields,
  };
}

/** Analiza la integridad de un mensaje HL7 parseado, aplicando reglas de perfil. */
export function analyzeIntegrity(
  message: ParsedMessage,
  rules: Rule[] = [],
): IntegrityReport {
  const warnings: string[] = [];
  const { version, fallback } = resolveVersion(message.declaredVersion);
  if (fallback) {
    warnings.push(
      message.declaredVersion
        ? `Version "${message.declaredVersion}" no esta en el diccionario; se valido contra ${version}.`
        : `El mensaje no declara version (MSH-12); se valido contra ${version}.`,
    );
  }

  const overrides = new OverrideResolver(rules, message.structureId);
  if (overrides.hasAny) {
    warnings.push('Se aplico un perfil de campos condicionales activo.');
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

  function checkGroupPresent(group: import('./dictionary').MessageSegmentRef): boolean {
    if (!group.children || group.children.length === 0) return presentSegmentNames.has(group.name);
    // En HL7, un grupo opcional siempre es disparado por su primer segmento.
    // Solo comprobamos el primer segmento para saber si el grupo esta presente.
    return checkGroupPresent(group.children[0]);
  }

  function validateStructure(refs: import('./dictionary').MessageSegmentRef[], groupPresent: boolean) {
    for (const ref of refs) {
      const isGroup = !!ref.children;
      const isRequired = ref.min >= 1;

      if (isGroup) {
        const anyChildPresent = checkGroupPresent(ref);
        if (isRequired && groupPresent && !anyChildPresent) {
          missingRequiredSegments.push({
            name: ref.name,
            desc: ref.desc,
            min: ref.min,
            max: ref.max,
          });
        } else if (anyChildPresent || (isRequired && groupPresent)) {
          validateStructure(ref.children!, anyChildPresent || (isRequired && groupPresent));
        }
      } else {
        if (isRequired && groupPresent && !presentSegmentNames.has(ref.name)) {
          missingRequiredSegments.push({
            name: ref.name,
            desc: ref.desc,
            min: ref.min,
            max: ref.max,
          });
        }
      }
    }
  }

  if (messageDef) {
    validateStructure(messageDef.segments.segments, true);
  }

  // --- Validacion de campos por segmento ---
  const occurrences = new Map<string, number>();
  const segments: SegmentReport[] = message.segments.map((seg) => {
    const occ = (occurrences.get(seg.name) ?? 0) + 1;
    occurrences.set(seg.name, occ);
    return buildSegmentReport(seg, occ, version, overrides);
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
    conditional: 0,
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
        case 'conditional':
          counts.conditional++;
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
