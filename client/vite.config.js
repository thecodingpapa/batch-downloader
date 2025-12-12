import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../localhost+2.pem'))
    }
  }
})
