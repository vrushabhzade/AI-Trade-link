import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Production build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Minification
    minify: 'esbuild',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('chartjs-adapter-date-fns')) {
              return 'chart-vendor';
            }
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          let extType = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    

  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    
    // Proxy API requests to backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // CSS optimization
  css: {
    devSourcemap: true
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'chart.js',
      'react-chartjs-2',
      'axios',
      'date-fns'
    ]
  }
})
