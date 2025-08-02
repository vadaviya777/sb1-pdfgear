import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        compressPdf: resolve(__dirname, 'compress-pdf.html'),
        grayscalePdf: resolve(__dirname, 'grayscale-pdf.html'),
        htmlToPdf: resolve(__dirname, 'html-to-pdf.html'),
        mergePdf: resolve(__dirname, 'merge-pdf.html'),
        pdfToExcel: resolve(__dirname, 'pdf-to-excel.html'),
        pdfToJpg: resolve(__dirname, 'pdf-to-jpg.html'),
        pdfToPowerpoint: resolve(__dirname, 'pdf-to-powerpoint.html'),
        pdfToTxt: resolve(__dirname, 'pdf-to-txt.html'),
        pdfToWord: resolve(__dirname, 'pdf-to-word.html'),
        powerpointToPdf: resolve(__dirname, 'powerpoint-to-pdf.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        protectPdf: resolve(__dirname, 'protect-pdf.html'),
        protectWord: resolve(__dirname, 'protect-word.html'),
        pubToPdf: resolve(__dirname, 'pub-to-pdf.html'),
        repairPdf: resolve(__dirname, 'repair-pdf.html'),
        rotatePdf: resolve(__dirname, 'rotate-pdf.html'),
        terms: resolve(__dirname, 'terms.html'),
        txtToPdf: resolve(__dirname, 'txt-to-pdf.html'),
        unlockPdf: resolve(__dirname, 'unlock-pdf.html'),
        wordToPdf: resolve(__dirname, 'word-to-pdf.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  publicDir: 'public',
});