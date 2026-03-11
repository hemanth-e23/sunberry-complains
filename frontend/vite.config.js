import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For local development: use '/'
  // For GitHub Pages production build: change to '/sunberry-complains/'
  base: '/',
})
