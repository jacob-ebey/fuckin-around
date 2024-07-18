import { defineApp, defaultRenderMatch } from "framework";
import { RemoteRoute } from "framework/remote";
import { OutletProvider } from "framework";

export default defineApp(
  [
    {
      // If we are in local dev for this app, we can spin up the host
      // and federate in the layout here so we have a better feedback loop
      import: !process.env.LAYOUT
        ? undefined
        : async () => ({
            Component: ({ children, url }) => (
              <OutletProvider outlets={{ children }}>
                <RemoteRoute
                  remote="@example/host"
                  src="/api/component/layout"
                />
              </OutletProvider>
            ),
          }),
      children: [
        {
          path: "/",
          import: () => import("./routes/home"),
        },
        {
          path: "/about",
          import: () => import("./routes/about"),
        },
        {
          path: "*",
          import: async () => ({
            Component: () => (
              <RemoteRoute remote="@example/host" src="/api/component/404" />
            ),
          }),
        },
      ],
    },
  ],
  {
    renderMatch: defaultRenderMatch(),
  }
);
