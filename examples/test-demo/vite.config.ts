import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '217.182.206.127',
      'brain-training.theermite.com',
      '.trycloudflare.com', // CloudFlare tunnel wildcard
    ],
  },
})
