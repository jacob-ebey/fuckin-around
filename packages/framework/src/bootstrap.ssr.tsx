import {
  createFromReadableStream,
  renderToReadableStream,
} from "framework/ssr";
import { isTextComponentContentType } from "framework/utils";

export default async function handleRequest(
  request: Request,
  callServer: (request: Request) => Promise<Response>
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

  const root = await createFromReadableStream(rscResponse.body);
  const body = await renderToReadableStream(root, { signal: request.signal });

  return new Response(body, {
    status: rscResponse.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
