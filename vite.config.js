import { defineConfig } from 'vite';
import { execSync } from 'child_process';

export default defineConfig({
  plugins: [
    {
      name: 'portfolio-scanner',
      buildStart() {
        execSync('node update-portfolio.js', { stdio: 'inherit' });
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  publicDir: 'Assests'
});
