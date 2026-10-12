import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The API only allows requests from http://localhost:5173 (CORS),
  // so fail instead of quietly moving to another port
  server: { port: 5173, strictPort: true },
})
