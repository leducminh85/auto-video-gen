import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

function videoApiPlugin(): Plugin {
  return {
    name: 'video-api-plugin',
    configureServer(server) {
      for (const modulePath of ['./scripts/projectEditor.cjs', './scripts/projectStore.cjs']) {
        delete require.cache[require.resolve(modulePath)];
      }
      server.middlewares.use(async (req, res, next) => {
        const editor = require('./scripts/projectEditor.cjs');
        const publicRoot = path.resolve('public');
        const store = require('./scripts/projectStore.cjs').createStore(publicRoot);
        const videoRoute = req.url?.split('?')[0].match(/^\/projects\/([a-zA-Z0-9-]+)\/final-video\.mp4$/);
        if (videoRoute && (req.method === 'GET' || req.method === 'HEAD')) {
          const file = path.join(publicRoot, 'projects', videoRoute[1], 'final-video.mp4');
          if (!fs.existsSync(file)) { res.statusCode = 404; res.end('Video chưa được xuất.'); return; }
          const size = fs.statSync(file).size;
          let start = 0, end = size - 1;
          if (req.headers.range) {
            const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
            if (!range || (!range[1] && !range[2])) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${size}`); res.end(); return; }
            if (range[1]) { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), end) : end; }
            else start = Math.max(0, size - Number(range[2]));
            if (start > end || start >= size) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${size}`); res.end(); return; }
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
          }
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Length', end - start + 1);
          if (req.method === 'HEAD') res.end();
          else fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
          return;
        }
        const projectRoute = req.url?.match(/^\/api\/projects\/([a-zA-Z0-9-]+)(\/render)?$/);
        if (req.url === '/api/projects' || projectRoute) {
          res.setHeader('Content-Type', 'application/json');
          try {
            let result;
            if (req.url === '/api/projects' && req.method === 'GET') result = store.list();
            else if (projectRoute && req.method === 'GET' && !projectRoute[2]) result = store.read(projectRoute[1]);
            else if (projectRoute && req.method === 'DELETE' && !projectRoute[2]) result = await editor.exclusive(() => { store.remove(projectRoute[1]); return { success: true }; });
            else if (projectRoute && req.method === 'POST') {
              const chunks: Buffer[] = []; let bytes = 0;
              for await (const chunk of req) { bytes += chunk.length; if (bytes > 10 * 1024 * 1024) throw new Error('Dữ liệu quá lớn.'); chunks.push(Buffer.from(chunk)); }
              const input = JSON.parse(Buffer.concat(chunks).toString());
              result = await editor.exclusive(() => store.save(projectRoute[1], input, !!projectRoute[2]));
            } else { res.statusCode = 405; result = { error: 'Phương thức không hỗ trợ.' }; }
            res.end(JSON.stringify(result));
          } catch (error: any) { res.statusCode = error.status || 400; res.end(JSON.stringify({ error: error.message })); }
          return;
        }
        if (req.url === '/api/project' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(path.join(publicRoot, 'scenes.json')));
          return;
        }
        if (['/api/project', '/api/project/render', '/api/audio/import'].includes(req.url || '') && req.method === 'POST') {
          try {
            const chunks: Buffer[] = [];
            let bytes = 0;
            const limit = req.url === '/api/audio/import' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
            for await (const chunk of req) {
              bytes += chunk.length;
              if (bytes > limit) throw new Error('Tệp hoặc dữ liệu vượt dung lượng cho phép.');
              chunks.push(Buffer.from(chunk));
            }
            const body = Buffer.concat(chunks);
            const result = await editor.exclusive(async () => {
              if (req.url === '/api/audio/import') return editor.importAudio(body, publicRoot);
              const project = editor.normalizeProject(JSON.parse(body.toString()));
              if (req.url === '/api/project/render') return editor.renderProject(project, publicRoot);
              project.metadata.render_dirty = true;
              editor.saveProject(project, publicRoot);
              return project;
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (error: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
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
              const scriptPath = require.resolve('./scripts/videoGenerator.cjs');
              const { generateVideo } = require(scriptPath);

              const onProgress = (prog: any) => {
                try {
                  res.write(JSON.stringify(prog) + '\n');
                } catch (e) {
                  // ignore if socket closed
                }
              };

              const result = await editor.exclusive(async () => {
                store.migrate();
                const generated = await generateVideo({ ...data, onProgress });
                const saved = store.create({ metadata: generated.metadata, scenes: generated.scenes }, path.join(publicRoot, 'final-video.mp4'));
                return { ...generated, ...saved, finalVideoUrl: `/projects/${saved.metadata.project_id}/final-video.mp4` };
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

        // Regenerate Beat Image via AI API
        if (req.url === '/api/regenerate-beat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const payload = JSON.parse(body || '{}');
              const { regenerateBeatImage } = require('./scripts/beatImageRegenerator.cjs');
              const result = await editor.exclusive(() => regenerateBeatImage(payload));
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message || String(err) }));
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
