import { URLPattern } from "urlpattern-polyfill";

import { RemoteContextProvider } from "framework/client.internal";
import { renderToReadableStream } from "framework/react-server-dom.server";

export { Outlet, OutletProvider } from "framework/client.internal";

export type Route = {
  Component?: React.FC<{
    children?: React.ReactNode;
    url: URL;
  }>;
};

export type RouteDefinition = {
  import?: () => Promise<Route>;
  path?: string;
  children?: RouteDefinition[];
};

type Match = {
  routes: RouteDefinition[];
  params: Record<string, string>;
};

type Matcher = (url: URL) => false | Match;

export type DefineAppOptions = {
  renderMatch: (url: URL, match: Match | null) => Promise<unknown>;
};

export function defaultRenderMatch() {
  return async (url: URL, match: Match | null) => {
    if (!match) {
      return null;
    }
    const routesPromises: Promise<Route>[] = [];
    for (let i = match.routes.length - 1; i >= 0; i--) {
      const route = match.routes[i];
      if (!route.import) continue;
      routesPromises.push(route.import());
    }
    const routes = await Promise.all(routesPromises);
    let rendered;
    for (const route of routes) {
      if (route.Component) {
        rendered = (
          <route.Component url={new URL(url)}>{rendered}</route.Component>
        );
      }
    }
    return <RemoteContextProvider>{rendered}</RemoteContextProvider>;
  };
}

export function defineApp(
  routes: RouteDefinition[],
  { renderMatch }: DefineAppOptions
) {
  let matchers: Matcher[] | undefined;

  return async (request: Request) => {
    if (!matchers) {
      matchers = [];
      defineRoutesRecursive(routes, matchers);
    }

    const url = new URL(request.url);
    let matched: ReturnType<(typeof matchers)[0]> | undefined;
    for (const matcher of matchers) {
      matched = matcher(url);
      if (matched) {
        break;
      }
    }

    const root = renderMatch(url, matched || null);

    return new Response(
      await renderToReadableStream(root, { signal: request.signal }),
      {
        status: 200,
        headers: {
          "content-type": "text/x-component",
          "Transfer-Encoding": "chunked",
        },
      }
    );
  };
}

function defineRoutesRecursive(
  routes: RouteDefinition[],
  matchers: Matcher[],
  base: string = "",
  branch: RouteDefinition[] = []
) {
  for (const route of routes) {
    const routePath = joinPath(base, route.path);
    const childBranch = [...branch, route];

    if (route.path) {
      const pattern = new URLPattern({ pathname: routePath });
      matchers.push((url) => {
        const match = pattern.exec({
          pathname: url.pathname,
          search: url.search,
        });
        if (!match) return false;
        return {
          params: match.pathname.groups as Record<string, string>,
          routes: childBranch,
        };
      });
    }
    if (route.children) {
      defineRoutesRecursive(route.children, matchers, routePath, childBranch);
    }
  }
}

function cleanPath(path: string) {
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

function joinPath(a: string = "", b: string = "") {
  return `/${cleanPath(`${cleanPath(a)}/${cleanPath(b)}`)}`;
}
