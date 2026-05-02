/**
 * Routeur côté client — History API.
 *
 * À COMPLÉTER aux endroits TODO.
 */

export type RouteParams = Record<string, string>;
export type RouteHandler = (params: RouteParams) => void | Promise<void>;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];
let notFoundHandler: RouteHandler | null = null;

/**
 * Compile un pattern '/pokemon/:id' en regex et liste de noms de params.
 */
function compile(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  // TODO 1 : transformer "/pokemon/:id" en /^\/pokemon\/([^/]+)$/ et stocker ['id']
  // Indice : remplacer chaque ":nom" par ([^/]+) et garder les noms
  return { pattern: /^\/$/, paramNames: [] };  // placeholder
}

export function route(path: string, handler: RouteHandler): void {
  const { pattern, paramNames } = compile(path);
  routes.push({ pattern, paramNames, handler });
}

export function setNotFound(handler: RouteHandler): void {
  notFoundHandler = handler;
}

export function navigate(path: string): void {
  // TODO 2 : history.pushState + appeler resolve()
}

function resolve(path: string): void {
  for (const r of routes) {
    const match = r.pattern.exec(path);
    if (match) {
      const params: RouteParams = {};
      // TODO 3 : remplir params à partir des groupes capturés et paramNames
      r.handler(params);
      return;
    }
  }
  notFoundHandler?.({});
}

export function start(): void {
  // TODO 4 :
  // 1. écouter popstate → resolve(location.pathname)
  // 2. intercepter clics sur <a data-link> → navigate(href) sans recharger
  // 3. resolve la route initiale au démarrage

  // Indice :
  // window.addEventListener('popstate', ...)
  // document.body.addEventListener('click', (e) => { ... e.target.closest('a[data-link]') ... })
}
