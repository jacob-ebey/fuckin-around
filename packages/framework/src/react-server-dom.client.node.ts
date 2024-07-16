import * as stream from "node:stream";
import * as streamWeb from "node:stream/web";

// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/client.node";

let ssrManifest: unknown = "__FRAMEWORK__SSR_MANIFEST__";

export function createFromReadableStream(
  readableStream: ReadableStream<Uint8Array>,
  options?: {
    nonce?: string;
    replayConsoleLogs?: boolean;
  }
) {
  return ReactServerDOM.createFromNodeStream(
    stream.Readable.fromWeb(
      readableStream as streamWeb.ReadableStream<Uint8Array>
    ),
    ssrManifest,
    {
      nonce: options?.nonce,
      replayConsoleLogs: options?.replayConsoleLogs ?? false,
    }
  );
}
