import type { renderToReadableStream } from "framework/ssr";

export default async function handleRequest(
  request: Request,
  callServer: (request: Request) => Promise<Response>,
  options?: Parameters<typeof renderToReadableStream>[1]
) {
  const mod = await import("./bootstrap.ssr");
  return mod.default(request, callServer, options);
}
