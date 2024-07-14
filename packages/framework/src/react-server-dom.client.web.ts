// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/client";

export function createFromReadableStream(
  readableStream: ReadableStream<Uint8Array>,
  options?: {
    nonce?: string;
    replayConsoleLogs?: boolean;
  }
) {
  const ssrManifest = {};
  return ReactServerDOM.createFromReadableStream(readableStream, {
    ssrManifest,
    nonce: options?.nonce,
    replayConsoleLogs: options?.replayConsoleLogs ?? false,
  });
}
