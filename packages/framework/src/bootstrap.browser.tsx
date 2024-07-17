import { startTransition } from "react";
import { createRoot } from "react-dom/client";

import { createFromReadableStream } from "framework/react-server-dom.client";

let root: ReturnType<typeof createRoot> | null;
const url = new URL(window.location.href);
url.pathname += ".data";
fetch(url, {
  headers: { Accept: "text/x-component" },
})
  .then((response) => {
    if (!response.body) {
      throw new Error("RSC response body is missing");
    }
    return createFromReadableStream(response.body);
  })
  .then((vdom) =>
    startTransition(() => {
      const rootElement = document.getElementById("root");
      if (!rootElement) {
        console.error("Root element not found");
        return;
      }
      root = createRoot(rootElement, {
        onRecoverableError(error, errorInfo) {
          console.error("Recoverable error", { error, errorInfo });
        },
      });
      root.render(vdom);
    })
  );

window.navigation?.addEventListener("navigate", (event) => {
  const url = new URL(event.destination.url);
  url.pathname += ".data";
  const reactRoot = root;

  if (
    !reactRoot ||
    !event.canIntercept ||
    !event.isTrusted ||
    event.formData ||
    event.defaultPrevented ||
    url.origin !== window.location.origin
  ) {
    console.log(event);
    return;
  }

  event.intercept({
    async handler() {
      await fetch(url, {
        headers: { Accept: "text/x-component" },
      })
        .then((response) => {
          if (!response.body) {
            throw new Error("RSC response body is missing");
          }
          return createFromReadableStream(response.body);
        })
        .then((vdom) => {
          startTransition(() => {
            if (!root) {
              console.error("Root element not found");
              return;
            }
            reactRoot.render(vdom);
            event.scroll();
          });
        });
    },
  });
});
