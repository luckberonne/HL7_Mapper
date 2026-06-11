import { defineConfig } from 'vite';

// hl7-dictionary es un paquete CommonJS; Vite lo pre-empaqueta sin problema.
export default defineConfig({
  optimizeDeps: {
    include: ['hl7-dictionary'],
  },
});
