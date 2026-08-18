import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Dev needs eval/HMR; prod is same-origin scripts + HTTPS API/images. */
function csp(): Plugin {
  return {
    name: 'csp-meta',
    transformIndexHtml(html, ctx) {
      const policy = ctx.server
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' ws: wss: http://localhost:3000; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
        : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https: http://localhost:3000; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), csp()],
});
