export async function getWebpackMap() {
  return new Proxy(
    {},
    {
      get(target, p, receiver) {
        switch (p) {
          case "then":
            return undefined;
        }
        if (typeof p !== "string" || !p.startsWith("fcr:")) {
          throw new Error(`Invalid reference ID "${String(p)}"`);
        }

        const [, remoteId, ...restClientId] = p.split(":");
        const clientId = restClientId.join(":");
        const [exposedId, ...restExportedId] = clientId.split("#");
        const exportedId = restExportedId.join("#");

        return {
          id: p,
          name: exportedId,
          chunks: [`fcr:${remoteId}:${exposedId}`],
        };
      },
    }
  );
}
