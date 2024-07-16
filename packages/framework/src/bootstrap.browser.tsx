import { startTransition } from "react";
import { createRoot } from "react-dom/client";

import { createFromReadableStream } from "framework/react-server-dom.client";

let root: ReturnType<typeof createRoot> | null;

fetch(window.location.href, {
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
