import * as stream from "node:stream";
import * as streamWeb from "node:stream/web";

// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/client.node";

export function createFromReadableStream(
  readableStream: ReadableStream<Uint8Array>,
  options?: {
    nonce?: string;
    replayConsoleLogs?: boolean;
  }
) {
  const ssrManifest = {};
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
