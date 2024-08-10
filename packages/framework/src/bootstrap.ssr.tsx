import * as React from "react";

import {
  InlinePayload,
  createFromReadableStream,
  renderToReadableStream,
} from "framework/ssr";
import { isTextComponentContentType } from "framework/utils";

export default async function handleRequest(
  request: Request,
  callServer: (request: Request) => Promise<Response>,
  options?: Parameters<typeof renderToReadableStream>[1]
) {
  const rscResponse = await callServer(request);
  if (
    !isTextComponentContentType(rscResponse.headers.get("content-type")) ||
    !rscResponse.body
  ) {
    return new Response("Invalid response from server", {
      status: 500,
    });
  }
  const [rscStreamA, rscStreamB] = rscResponse.body.tee();

  const root = await createFromReadableStream(rscStreamA, {
    replayConsoleLogs: false,
  });
  const body = await renderToReadableStream(
    <>
      {root}
      <React.Suspense>
        <InlinePayload readable={rscStreamB.getReader()} />
      </React.Suspense>
    </>,
    {
      ...options,
      signal: options?.signal ?? request.signal,
    }
  );

  return new Response(body, {
    status: rscResponse.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
