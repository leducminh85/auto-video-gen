import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function videoApiPlugin(): Plugin {
  return {
    name: 'video-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/generate-video' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');

            try {
              const data = JSON.parse(body);
              Object.keys(require.cache).forEach((k) => {
                if (k.includes('/scripts/')) {
                  delete require.cache[k];
                }
              });
              const scriptPath = require.resolve('./scripts/videoGenerator.cjs');
              const { generateVideo } = require(scriptPath);

              const onProgress = (prog: any) => {
                try {
                  res.write(JSON.stringify(prog) + '\n');
                } catch (e) {
                  // ignore if socket closed
                }
              };

              const result = await generateVideo({
                ...data,
                onProgress,
              });

              res.write(JSON.stringify({ type: 'complete', percent: 100, result }) + '\n');
              res.end();
            } catch (err: any) {
              console.error('API Error in /api/generate-video:', err);
              try {
                res.write(JSON.stringify({ type: 'error', error: err.message || String(err) }) + '\n');
                res.end();
              } catch (e) {
                // socket already closed
              }
            }
          });
          return;
        }

        // Image Provider Status API
        if (req.url === '/api/image-provider/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const ImageGenerationManager = require('./scripts/image-generation/ImageGenerationManager.cjs');
            const manager = ImageGenerationManager.getInstance();
            const status = await manager.getStatus();
            res.end(JSON.stringify(status));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Image Provider Config API
        if (req.url === '/api/image-provider/config' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { preferredProvider } = JSON.parse(body);
              const ImageGenerationManager = require('./scripts/image-generation/ImageGenerationManager.cjs');
              const manager = ImageGenerationManager.getInstance();
              manager.setPreferredProvider(preferredProvider);
              res.end(JSON.stringify({ success: true, preferredProvider }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Test Google AI Studio Connection & Open Login Browser
        if (req.url === '/api/image-provider/test-connection' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const GoogleAIStudioBrowser = require('./scripts/image-generation/browser/GoogleAIStudioBrowser.cjs');
            const browser = GoogleAIStudioBrowser.getInstance();
            const session = await browser.openForManualLogin();
            res.end(JSON.stringify({ success: true, session }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), videoApiPlugin()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
