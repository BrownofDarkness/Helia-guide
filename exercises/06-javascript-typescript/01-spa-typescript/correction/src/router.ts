export type RouteParams = Record<string, string>;
export type RouteHandler = (params: RouteParams) => void | Promise<void>;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];
let notFoundHandler: RouteHandler | null = null;

function compile(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexSource = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return { pattern: new RegExp(`^${regexSource}$`), paramNames };
}

export function route(path: string, handler: RouteHandler): void {
  const { pattern, paramNames } = compile(path);
  routes.push({ pattern, paramNames, handler });
}

export function setNotFound(handler: RouteHandler): void {
  notFoundHandler = handler;
}

export function navigate(path: string): void {
  history.pushState({}, '', path);
  resolve(path);
}

function resolve(path: string): void {
  for (const r of routes) {
    const match = r.pattern.exec(path);
    if (match) {
      const params: RouteParams = {};
      r.paramNames.forEach((name, i) => {
        const captured = match[i + 1];
        if (captured !== undefined) params[name] = captured;
      });
      r.handler(params);
      return;
    }
  }
  notFoundHandler?.({});
}

export function start(): void {
  window.addEventListener('popstate', () => resolve(location.pathname));

  document.body.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest('a[data-link]');
    if (link instanceof HTMLAnchorElement) {
      e.preventDefault();
      navigate(link.getAttribute('href') ?? '/');
    }
  });

  resolve(location.pathname);
}

// Exposé pour les tests
export const _internal = { compile, resolve };
