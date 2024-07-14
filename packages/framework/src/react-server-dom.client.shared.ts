export function getSsrManifest() {
  return {
    moduleMap: new Proxy(
      {},
      {
        get(target, p, receiver) {
          console.log({ p });
          return undefined;
        },
      }
    ),
    moduleLoading: {},
  };
}
