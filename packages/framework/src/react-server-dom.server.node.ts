import * as stream from "node:stream";

// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/server.node";

import { getWebpackMap } from "./react-server-dom.server.shared";

export async function renderToReadableStream(
  model: unknown,
  { signal }: { signal: AbortSignal }
): Promise<ReadableStream<Uint8Array>> {
  const webpackMap = await getWebpackMap();

  const { abort, pipe } = ReactServerDOM.renderToPipeableStream(
    model,
    webpackMap,
    {}
  );

  if (signal.aborted) {
    abort();
  } else {
    signal.addEventListener(
      "abort",
      () => {
        abort();
      },
      { once: true }
    );
  }

  return stream.Readable.toWeb(
    pipe(new stream.PassThrough())
  ) as ReadableStream<Uint8Array>;
}
