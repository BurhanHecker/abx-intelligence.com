import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite's default SPA fallback already serves index.html for /cas,
  // /cas/admin and /cas/live.
  server: { port: 5175 },
})
