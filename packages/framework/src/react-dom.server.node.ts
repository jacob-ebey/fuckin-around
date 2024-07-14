import * as stream from "node:stream";

import ReactDOM from "react-dom/server";

type Args = Parameters<typeof ReactDOM.renderToReadableStream>;

export function renderToReadableStream(children: Args[0], options: Args[1]) {
  let sentShell = false;

  const allReadyDeferred = new Deferred();
  allReadyDeferred.promise.catch(() => {});

  const promise = new Promise<
    ReadableStream<Uint8Array> & { allReady: Promise<void> }
  >((resolve, reject) => {
    const { abort, pipe } = ReactDOM.renderToPipeableStream(children, {
      bootstrapModules: options?.bootstrapModules,
      bootstrapScriptContent: options?.bootstrapScriptContent,
      bootstrapScripts: options?.bootstrapScripts,
      identifierPrefix: options?.identifierPrefix,
      namespaceURI: options?.namespaceURI,
      nonce: options?.nonce,
      progressiveChunkSize: options?.progressiveChunkSize,
      onError(error, errorInfo) {
        if (!sentShell) {
          return;
        }
        return options?.onError?.(error, errorInfo);
      },
      onShellError(error) {
        reject(error);
        allReadyDeferred.reject(error);
      },
      onAllReady() {
        sentShell = true;
        allReadyDeferred.resolve();
      },
      onShellReady() {
        const readableStream = stream.Readable.toWeb(
          pipe(new stream.PassThrough())
        );

        resolve(
          Object.assign(readableStream as ReadableStream<Uint8Array>, {
            allReady: allReadyDeferred.promise,
          })
        );
      },
    });

    options?.signal?.addEventListener(
      "abort",
      () => {
        abort();
      },
      { once: true }
    );
  });

  return promise;
}

class Deferred {
  resolve!: () => void;
  reject!: (reason: unknown) => void;
  promise = new Promise<void>((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}
