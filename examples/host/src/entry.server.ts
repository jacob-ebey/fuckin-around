export default async function app() {
  const mod = await import("./bootstrap.server");
  return mod.default.apply(null, arguments as any);
}
