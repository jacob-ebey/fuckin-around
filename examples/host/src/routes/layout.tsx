export function Component({ children }: { children?: React.ReactNode }) {
  return (
    <html>
      <head></head>
      <body>
        <div>
          <nav>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/not-found">404</a>
              </li>
            </ul>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
