import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,  // TEMPORARY - disable for debugging
    sourcemap: true  // Enable source maps
  }
})
