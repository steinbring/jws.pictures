import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: './src',  // Set the root folder for source files
  build: {
    outDir: '../',  // Output directory at the root
    emptyOutDir: false,  // Prevent Vite from clearing the folder before building
    rollupOptions: {
      external: [
        'primevue/resources/themes/aura/theme.css',
        'primevue/resources/primevue.min.css',
        'primeicons/primeicons.css'
      ]
    }
  },
})