import { URLPattern } from "urlpattern-polyfill";

import { renderToReadableStream } from "framework/react-server-dom.server";

export type Route = {
  Component?: React.FC<{ children?: React.ReactNode }>;
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

type Matcher = (pathname: string) => false | Match;

export type DefineAppOptions = {
  renderMatch: (match: Match | null) => Promise<unknown>;
};

function DefaultNotFoundFallback() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Not Found</title>
      </head>
      <body>
        <h1>Not Found</h1>
      </body>
    </html>
  );
}

export function defaultRenderMatch({
  NotFoundFallback = DefaultNotFoundFallback,
}: {
  NotFoundFallback?: React.FC;
}) {
  return async (match: Match | null) => {
    if (!match) {
      return <NotFoundFallback />;
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
        rendered = <route.Component>{rendered}</route.Component>;
      }
    }
    return rendered;
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
      matched = matcher(url.pathname);
      if (matched) {
        break;
      }
    }

    const root = renderMatch(matched || null);

    const decoder = new TextDecoder();
    return new Response(
      (
        await renderToReadableStream(root, { signal: request.signal })
      )
      // .pipeThrough(
      //   new TransformStream({
      //     transform(chunk, controller) {
      //       controller.enqueue(chunk);
      //       process.stdout.write(decoder.decode(chunk, { stream: true }));
      //     },
      //     flush() {
      //       process.stdout.write("\n");
      //     },
      //   })
      // )
      ,
      {
        status: 200,
        headers: {
          "content-type": "text/x-component; charset=utf-8",
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
      matchers.push((pathname) => {
        const match = pattern.exec({ pathname });
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