import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Tailwind's official Vite plugin (v4 approach)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),      // enables JSX + React fast refresh
    tailwindcss(), // enables Tailwind — scans your files and generates only the CSS classes you actually use
  ],
})
