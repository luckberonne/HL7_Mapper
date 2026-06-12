// Router minimo basado en hash (#/ruta). Funciona en hosting estatico (Vercel)
// sin necesidad de rewrites del servidor.

export type ViewMount = (container: HTMLElement) => void;

/** Navega a una ruta. Si ya estamos en ella, fuerza un re-render. */
export function navigate(path: string): void {
  const target = `#${path}`;
  if (location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = target;
  }
}

function currentPath(fallback: string): string {
  return location.hash.replace(/^#/, '') || fallback;
}

/**
 * Inicializa el router: monta la vista de la ruta actual dentro de `container`
 * y marca el enlace de navegacion activo.
 */
export function initRouter(
  container: HTMLElement,
  routes: Record<string, ViewMount>,
  fallback: string,
): void {
  function render(): void {
    const path = currentPath(fallback);
    const mount = routes[path] ?? routes[fallback];
    container.innerHTML = '';
    mount(container);
    document.querySelectorAll<HTMLAnchorElement>('.app-nav a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === `#${path}`);
    });
  }

  window.addEventListener('hashchange', render);
  render();
}
