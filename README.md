# HL7 Mapper

Herramienta web (Vite + TypeScript, **sin framework y sin IA**) para parsear mensajes
**HL7 v2.x** y analizar su **integridad**: qué datos requeridos faltan, cuáles son
opcionales (presentes/ausentes) y cuáles condicionales — a nivel de segmento y campo, con
nombres legibles. Permite **descargar un JSON** con el mensaje parseado más el análisis.

Todo se procesa en el navegador; no se envían datos a ningún servidor.

## Cómo funciona

- **Parser propio** (`src/hl7/parser.ts`): separa el mensaje en segmentos → campos →
  repeticiones → componentes → subcomponentes usando los delimitadores declarados en MSH
  (con el caso especial de MSH-1/MSH-2).
- **Diccionario** [`hl7-dictionary`](https://www.npmjs.com/package/hl7-dictionary)
  (`src/hl7/dictionary.ts`): aporta la metadata de cada campo (`opt`: 0=opcional,
  1=requerido, 2=condicional), nombres, tipos de dato y la estructura de cada mensaje
  (segmentos requeridos vía `min`).
- **Validador** (`src/hl7/validator.ts`): cruza el mensaje parseado con el diccionario y
  produce un `IntegrityReport`: segmentos requeridos ausentes, campos requeridos faltantes,
  opcionales, condicionales y un estado global `valid`.
- La versión a validar se toma de **MSH-12**; si no está en el diccionario se usa `2.5.1`
  como fallback y se muestra una advertencia.

## Scripts

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (Vite)
npm run build    # compila TypeScript y genera build de producción en dist/
npm run preview  # sirve el build de producción
```

## Uso

1. Pega un mensaje HL7 v2.x en el área de texto (o usa **Cargar ejemplo** / **Cargar archivo**).
2. Pulsa **Analizar**.
3. Revisa el resumen de integridad, la sección de **datos requeridos faltantes** y el detalle
   por segmento.
4. Pulsa **Descargar JSON** para exportar el mensaje parseado + el análisis.

## Límites

- La validación cubre estructura (segmentos requeridos) y optionality de campos. No valida
  tablas de códigos ni reglas condicionales complejas; el estado `conditional` es informativo.
- El diccionario soporta las versiones HL7 v2.1 … 2.7.1.
