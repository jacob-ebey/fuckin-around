// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/server.edge";

import { getWebpackMap } from "./react-server-dom.server.shared";

export async function renderToReadableStream(
  model: unknown,
  { signal }: { signal: AbortSignal }
): Promise<ReadableStream<Uint8Array>> {
  const webpackMap = await getWebpackMap();

  return Promise.resolve(
    ReactServerDOM.renderToReadableStream(model, webpackMap, { signal })
  );
}
