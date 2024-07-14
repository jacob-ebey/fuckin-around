// @ts-expect-error - no types
import ReactServerDOM from "react-server-dom-webpack/client";

export function registerServerReference(
  proxy: Function,
  id: string,
  exp: string
) {
  return ReactServerDOM.createServerReference(`${id}#${exp}`);
}
