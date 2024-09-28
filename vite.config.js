import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: './src',  // Set the root folder for source files
  build: {
    outDir: '../',  // Output directory at the root
    emptyOutDir: false,  // Prevent Vite from clearing the folder before building
  },
})