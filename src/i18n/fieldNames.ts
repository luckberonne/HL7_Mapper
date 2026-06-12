// Diccionario local de traduccion EN -> ES de nombres de campo HL7.
// Cubre los campos mas comunes de forma exacta; para el resto aplica una
// sustitucion por terminos. Sin servicios externos ni IA.

/** Traducciones exactas de descripciones de campo (clave = desc del diccionario HL7). */
const EXACT: Record<string, string> = {
  // MSH
  'Field Separator': 'Separador de campo',
  'Encoding Characters': 'Caracteres de codificacion',
  'Sending Application': 'Aplicacion emisora',
  'Sending Facility': 'Institucion emisora',
  'Receiving Application': 'Aplicacion receptora',
  'Receiving Facility': 'Institucion receptora',
  'Date/Time Of Message': 'Fecha/hora del mensaje',
  Security: 'Seguridad',
  'Message Type': 'Tipo de mensaje',
  'Message Control ID': 'ID de control del mensaje',
  'Processing ID': 'ID de procesamiento',
  'Version ID': 'Version',
  'Sequence Number': 'Numero de secuencia',
  'Continuation Pointer': 'Puntero de continuacion',
  'Accept Acknowledgment Type': 'Tipo de acuse de recepcion',
  'Application Acknowledgment Type': 'Tipo de acuse de aplicacion',
  'Country Code': 'Codigo de pais',
  'Character Set': 'Juego de caracteres',
  'Principal Language Of Message': 'Idioma principal del mensaje',
  'Message Profile Identifier': 'Identificador de perfil del mensaje',

  // EVN
  'Event Type Code': 'Codigo de tipo de evento',
  'Recorded Date/Time': 'Fecha/hora de registro',
  'Date/Time Planned Event': 'Fecha/hora del evento planificado',
  'Event Reason Code': 'Codigo de motivo del evento',
  'Operator ID': 'ID del operador',
  'Event Occurred': 'Evento ocurrido',
  'Event Facility': 'Institucion del evento',

  // PID
  'Set ID - PID': 'ID de conjunto - PID',
  'Patient ID': 'ID del paciente',
  'Patient Identifier List': 'Lista de identificadores del paciente',
  'Alternate Patient ID - PID': 'ID alternativo del paciente',
  'Patient Name': 'Nombre del paciente',
  "Mother's Maiden Name": 'Apellido materno (de soltera)',
  'Date/Time of Birth': 'Fecha/hora de nacimiento',
  'Administrative Sex': 'Sexo administrativo',
  'Patient Alias': 'Alias del paciente',
  Race: 'Raza',
  'Patient Address': 'Direccion del paciente',
  'County Code': 'Codigo de condado',
  'Phone Number - Home': 'Telefono - particular',
  'Phone Number - Business': 'Telefono - laboral',
  'Primary Language': 'Idioma principal',
  'Marital Status': 'Estado civil',
  Religion: 'Religion',
  'Patient Account Number': 'Numero de cuenta del paciente',
  'SSN Number - Patient': 'Numero de seguro social',
  "Driver's License Number - Patient": 'Numero de licencia de conducir',
  "Mother's Identifier": 'Identificador de la madre',
  'Ethnic Group': 'Grupo etnico',
  'Birth Place': 'Lugar de nacimiento',
  'Multiple Birth Indicator': 'Indicador de parto multiple',
  'Birth Order': 'Orden de nacimiento',
  Citizenship: 'Ciudadania',
  'Veterans Military Status': 'Estado militar de veterano',
  Nationality: 'Nacionalidad',
  'Patient Death Date and Time': 'Fecha y hora de fallecimiento',
  'Patient Death Indicator': 'Indicador de fallecimiento',
  'Identity Unknown Indicator': 'Indicador de identidad desconocida',
  'Last Update Date/Time': 'Fecha/hora de ultima actualizacion',
  'Last Update Facility': 'Institucion de ultima actualizacion',

  // PV1
  'Set ID - PV1': 'ID de conjunto - PV1',
  'Patient Class': 'Clase de paciente',
  'Assigned Patient Location': 'Ubicacion asignada del paciente',
  'Admission Type': 'Tipo de admision',
  'Preadmit Number': 'Numero de preadmision',
  'Prior Patient Location': 'Ubicacion previa del paciente',
  'Attending Doctor': 'Medico tratante',
  'Referring Doctor': 'Medico que refiere',
  'Consulting Doctor': 'Medico consultor',
  'Hospital Service': 'Servicio hospitalario',
  'Temporary Location': 'Ubicacion temporal',
  'Admit Source': 'Origen de la admision',
  'Ambulatory Status': 'Estado ambulatorio',
  'VIP Indicator': 'Indicador VIP',
  'Admitting Doctor': 'Medico que admite',
  'Patient Type': 'Tipo de paciente',
  'Visit Number': 'Numero de visita',
  'Financial Class': 'Clase financiera',
  'Discharge Disposition': 'Disposicion del alta',
  'Discharged to Location': 'Ubicacion de alta',
  'Servicing Facility': 'Institucion de servicio',
  'Admit Date/Time': 'Fecha/hora de admision',
  'Discharge Date/Time': 'Fecha/hora de alta',
  'Alternate Visit ID': 'ID alternativo de visita',
  'Visit Indicator': 'Indicador de visita',

  // NK1
  'Set ID - NK1': 'ID de conjunto - NK1',
  Name: 'Nombre',
  Relationship: 'Parentesco',
  Address: 'Direccion',
  'Phone Number': 'Numero de telefono',

  // MSA / ERR
  'Acknowledgment Code': 'Codigo de acuse',
  'Text Message': 'Mensaje de texto',
  'Error Code and Location': 'Codigo y ubicacion del error',
  'HL7 Error Code': 'Codigo de error HL7',
  Severity: 'Severidad',

  // OBX / OBR / ORC
  'Set ID - OBX': 'ID de conjunto - OBX',
  'Value Type': 'Tipo de valor',
  'Observation Identifier': 'Identificador de observacion',
  'Observation Sub-ID': 'Sub-ID de observacion',
  'Observation Value': 'Valor de la observacion',
  Units: 'Unidades',
  'References Range': 'Rango de referencia',
  'Abnormal Flags': 'Indicadores de anormalidad',
  'Observation Result Status': 'Estado del resultado',
  'Set ID - OBR': 'ID de conjunto - OBR',
  'Placer Order Number': 'Numero de orden del solicitante',
  'Filler Order Number': 'Numero de orden del ejecutor',
  'Universal Service Identifier': 'Identificador universal de servicio',
  'Order Control': 'Control de orden',

  // AL1 / DG1
  'Set ID - AL1': 'ID de conjunto - AL1',
  'Allergen Type Code': 'Codigo de tipo de alergeno',
  'Allergen Code/Mnemonic/Description': 'Codigo/descripcion del alergeno',
  'Allergy Severity Code': 'Codigo de severidad de la alergia',
  'Set ID - DG1': 'ID de conjunto - DG1',
  'Diagnosis Code - DG1': 'Codigo de diagnostico',
  'Diagnosis Description': 'Descripcion del diagnostico',
  'Diagnosis Date/Time': 'Fecha/hora del diagnostico',
};

/** Sustituciones por termino para el resto de descripciones (best effort). */
const TERMS: Array<[RegExp, string]> = [
  [/Set ID/gi, 'ID de conjunto'],
  [/Date\s*\/\s*Time/gi, 'Fecha/hora'],
  [/Date and Time/gi, 'Fecha y hora'],
  [/Identifier/gi, 'Identificador'],
  [/\bID\b/g, 'ID'],
  [/Number/gi, 'Numero'],
  [/\bName\b/gi, 'Nombre'],
  [/\bCode\b/gi, 'Codigo'],
  [/\bType\b/gi, 'Tipo'],
  [/Address/gi, 'Direccion'],
  [/Patient/gi, 'Paciente'],
  [/Indicator/gi, 'Indicador'],
  [/\bDate\b/gi, 'Fecha'],
  [/\bTime\b/gi, 'Hora'],
  [/Status/gi, 'Estado'],
  [/Facility/gi, 'Institucion'],
  [/Location/gi, 'Ubicacion'],
  [/Amount/gi, 'Monto'],
  [/\bDoctor\b/gi, 'Medico'],
  [/Language/gi, 'Idioma'],
];

/**
 * Traduce el nombre legible de un campo al espanol.
 * Devuelve la traduccion exacta si existe; de lo contrario aplica sustitucion
 * por terminos; si nada aplica, devuelve el original.
 */
export function translateFieldName(desc: string): string {
  if (!desc) return desc;
  const exact = EXACT[desc];
  if (exact) return exact;

  let out = desc;
  for (const [re, es] of TERMS) {
    out = out.replace(re, es);
  }
  return out;
}
