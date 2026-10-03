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
