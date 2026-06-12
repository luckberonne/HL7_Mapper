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

## Páginas

La app tiene tres páginas con navegación por hash (`#/`, `#/perfiles`, `#/historial`), lo que la
hace compatible con hosting estático (Vercel) sin configuración de rewrites. Router en
[src/router.ts](src/router.ts), vistas en [src/views/](src/views/).

- **Analizar** (`#/`): editor del mensaje, acciones, **selector del perfil activo** y el reporte.
- **Perfiles** (`#/perfiles`): gestión completa de perfiles y reglas.
- **Historial** (`#/historial`): lista de análisis; al hacer clic en una entrada se carga su
  mensaje en el editor de la página principal y se re-analiza.

## Uso

1. En **Analizar**, carga un mensaje HL7 v2.x: pégalo, usa el botón **Pegar** (lee el
   portapapeles), o **Cargar ejemplo** / **Cargar archivo**.
2. Pulsa **Analizar**.
3. Revisa el resumen de integridad, la sección de **datos requeridos faltantes** y el detalle
   por segmento.
4. Pulsa **Descargar JSON** para exportar el mensaje parseado + el análisis.

## Funciones adicionales

- **Traducción de nombres en tooltip**: al pasar el mouse sobre el nombre de un campo (subrayado
  punteado) se muestra su traducción al español, usando un diccionario local
  ([src/i18n/fieldNames.ts](src/i18n/fieldNames.ts)) — traducción exacta para los campos más
  comunes y sustitución por términos para el resto. Sin servicios externos.
- **Perfiles de campos condicionales** (página *Perfiles*): define reglas que reclasifican un
  campo como `condicional`, `requerido` u `opcional` (por estructura `ADT_A01` o comodín `*`). El
  perfil activo (elegible desde el selector de la página principal) se aplica al analizar; los
  campos modificados se marcan con ★.
- **Historial de mensajes** (página *Historial*): cada análisis se guarda y puede recargarse con
  un clic, llevándote a la página principal con el mensaje cargado.

### Persistencia (SQLite en el navegador)

Perfiles, reglas e historial se guardan en **SQLite** vía
[`sql.js`](https://www.npmjs.com/package/sql.js) (SQLite compilado a WASM). La base se serializa
y persiste en **IndexedDB** del navegador tras cada cambio. No hay servidor: los datos nunca
salen de tu equipo. Capa en [src/db/](src/db/).

## Límites

- La validación cubre estructura (segmentos requeridos) y optionality de campos del diccionario
  (requerido vs opcional). El estado `condicional` se obtiene de los perfiles que tú definas; el
  diccionario base no codifica condicionalidad ni reglas complejas, ni valida tablas de códigos.
- El diccionario de traducción cubre los campos más frecuentes; el resto usa sustitución por
  términos y puede no ser perfecto.
- El diccionario HL7 soporta las versiones v2.1 … 2.7.1.
