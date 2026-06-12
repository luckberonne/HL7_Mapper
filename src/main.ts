import './style.css';
import { initRouter } from './router';
import { mountMainView } from './views/mainView';
import { mountProfilesView } from './views/profilesView';
import { mountHistoryView } from './views/historyView';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="app-header">
    <h1>HL7 Mapper</h1>
    <p>Parsea mensajes HL7 v2.x y analiza su integridad: datos requeridos faltantes,
       opcionales y condicionales. Todo se procesa en tu navegador, sin IA ni envio de datos.</p>
    <nav class="app-nav">
      <a href="#/">Analizar</a>
      <a href="#/perfiles">Perfiles</a>
      <a href="#/historial">Historial</a>
    </nav>
  </header>

  <main id="view"></main>

  <footer class="app-footer">
    Validacion basada en el diccionario HL7 (<code>hl7-dictionary</code>). Pasa el mouse sobre el
    nombre de un campo para ver su traduccion. Perfiles e historial se guardan en SQLite
    (<code>sql.js</code>) dentro de tu navegador.
  </footer>
`;

const view = document.querySelector<HTMLElement>('#view')!;

initRouter(
  view,
  {
    '/': mountMainView,
    '/perfiles': mountProfilesView,
    '/historial': mountHistoryView,
  },
  '/',
);
