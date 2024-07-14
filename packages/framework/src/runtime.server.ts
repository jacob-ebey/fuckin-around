// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/server";

export const registerServerReference = ReactServerDOM.registerServerReference;

export function registerClientReference(
  proxy: Function,
  id: string,
  exp: string
) {
  return Object.defineProperties(proxy, {
    $$typeof: { value: Symbol.for("react.client.reference") },
    $$id: { value: id },
    $$async: { value: true },
  });
}
