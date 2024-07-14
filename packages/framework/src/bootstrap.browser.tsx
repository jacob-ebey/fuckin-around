import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
// @ts-expect-error - no types
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";
import { rscStream } from "rsc-html-stream/client";

const root = createFromReadableStream(rscStream);

startTransition(() => {
  hydrateRoot(document, root);
});
