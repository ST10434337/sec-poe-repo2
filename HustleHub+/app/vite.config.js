import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read VITE_API_URL from .env, so the CSP allows requests to the same API the app uses ~> (Vite, n.d.a)
  const env = loadEnv(mode, process.cwd(), '')

  // Content Security Policy for the built app: only our own files, and requests only to us and the API ~> (OWASP, n.d.a)
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    `connect-src 'self' ${env.VITE_API_URL}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  return {
    plugins: [react()],
    // The API only allows requests from http://localhost:5173 (CORS),
    // so fail instead of quietly moving to another port
    server: { port: 5173, strictPort: true },
    // npm run preview serves the built app with the security headers ~> (Vite, n.d.b)
    // The dev server is left without the CSP, because hot reload needs inline scripts
    preview: {
      port: 5173,
      strictPort: true,
      headers: {
        'Content-Security-Policy': csp,
        'X-Content-Type-Options': 'nosniff',  // ~> (OWASP, n.d.b)
        'Referrer-Policy': 'no-referrer',  // ~> (OWASP, n.d.b)
      },
    },
    // npm test: Vitest runs the tests in a fake browser (jsdom), so React components can be rendered
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})

// Vite. n.d.a. Configuring Vite: Using Environment Variables in Config. [online] Available at: https://vite.dev/config/ (Accessed: 12 October 2026).
// Vite. n.d.b. Preview Options: preview.headers. [online] Available at: https://vite.dev/config/preview-options (Accessed: 12 October 2026).
// OWASP. n.d.a. Content Security Policy Cheat Sheet. [online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html (Accessed: 12 October 2026).
// OWASP. n.d.b. HTTP Headers Cheat Sheet. [online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html (Accessed: 12 October 2026).