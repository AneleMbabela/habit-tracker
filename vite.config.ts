import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use relative asset URLs so the app works correctly on GitHub Pages
  // project URLs (/habit-tracker/) and other hosting paths.
  base: './',
})
