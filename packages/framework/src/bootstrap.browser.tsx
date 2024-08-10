import * as React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import { createFromReadableStream } from "framework/react-server-dom.client";
import { isTextComponentContentType } from "framework/utils";

let root: ReturnType<typeof createRoot> | null;
const url = new URL(window.location.href);
url.pathname += ".data";
const rootElement = document.getElementById("root");
// SPA mode
if (rootElement) {
  fetch(url, {
    headers: { Accept: "text/x-component" },
  }).then(async (response) => {
    if (!response.body) {
      throw new Error("RSC response body is missing");
    }
    if (!isTextComponentContentType(response.headers.get("content-type"))) {
      throw new Error("Invalid content type");
    }

    const vdom: React.Usable<React.ReactNode> = await createFromReadableStream(
      response.body
    );
    React.startTransition(() => {
      root = createRoot(rootElement, {
        onRecoverableError(error, errorInfo) {
          console.error("Recoverable error", { error, errorInfo });
        },
      });
      root.render(<ClientRouter initialVDOM={vdom} />);
    });
  });
} else {
  // SSR Mode
  // @ts-expect-error
  createFromReadableStream(__RSC__.stream).then(
    (vdom: React.Usable<React.ReactNode>) => {
      React.startTransition(() => {
        root = hydrateRoot(document, <ClientRouter initialVDOM={vdom} />);
      });
    }
  );
}

function ClientRouter({
  initialVDOM,
}: {
  initialVDOM: React.Usable<React.ReactNode>;
}) {
  const [{ vdom, scroll }, setVDOM] = React.useState({
    vdom: initialVDOM,
    scroll: false,
  });
  const [transitioning, startTransition] = React.useTransition();

  React.useEffect(() => {
    const handleNavigate = (event: NavigateEvent) => {
      const url = new URL(event.destination.url);
      url.pathname += ".data";

      if (
        !event.canIntercept ||
        !event.isTrusted ||
        event.formData ||
        event.defaultPrevented ||
        url.origin !== window.location.origin
      ) {
        return;
      }

      event.intercept({
        scroll: "after-transition",
        async handler() {
          await fetch(url, {
            headers: { Accept: "text/x-component" },
          }).then(async (response) => {
            const body = response.body;
            if (!body) {
              throw new Error("RSC response body is missing");
            }
            const vdom = await createFromReadableStream(body);
            startTransition(() => {
              setVDOM({
                vdom,
                scroll: false,
              });
            });
          });
        },
      });
    };

    if (window.navigation) {
      window.navigation?.addEventListener("navigate", handleNavigate);
      return () => {
        window.navigation?.removeEventListener("navigate", handleNavigate);
      };
    }
  }, [setVDOM, startTransition]);

  return React.use(vdom);
}
