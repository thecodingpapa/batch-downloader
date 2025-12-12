import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if SSL certificates exist
const keyPath = path.resolve(__dirname, '../localhost+2-key.pem')
const certPath = path.resolve(__dirname, '../localhost+2.pem')
const hasSSL = fs.existsSync(keyPath) && fs.existsSync(certPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
    // Only use HTTPS if certificates exist
    ...(hasSSL ? {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    } : {})
  }
})
