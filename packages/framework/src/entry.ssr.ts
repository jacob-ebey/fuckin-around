export default async function handleRequest(
  request: Request,
  callServer: (request: Request) => Promise<Response>
) {
  const mod = await import("framework/bootstrap.ssr");
  return mod.default(request, callServer);
}
