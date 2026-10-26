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
        if ((req.url === '/api/chatgpt/status' && req.method === 'GET') || (['/api/chatgpt/connect', '/api/chatgpt/test'].includes(req.url || '') && req.method === 'POST')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            delete require.cache[require.resolve('./scripts/chatgptBrowser.cjs')];
            const browser = require('./scripts/chatgptBrowser.cjs').ChatGPTBrowser.getInstance();
            const result = req.url?.endsWith('/test')
              ? await editor.exclusive(async () => {
                const reply = await browser.request('Connection test for my local video studio. Reply with only this JSON: {"studio_connection":"ok"}');
                const parsed = require('./scripts/chatgptBrowser.cjs').parseJSON(reply);
                if (parsed.studio_connection !== 'ok') throw new Error('ChatGPT chưa trả lời đúng yêu cầu kiểm tra.');
                return { connected: true, verified: true };
              })
              : req.url?.endsWith('/connect') ? await browser.open() : await browser.status();
            res.end(JSON.stringify(result));
          } catch (error: any) { res.statusCode = 400; res.end(JSON.stringify({ error: error.message })); }
          return;
        }
        if (req.url === '/api/remotion/revise' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const chunks: Buffer[] = []; let size = 0;
            for await (const chunk of req) { size += chunk.length; if (size > 1024 * 1024) throw new Error('Yêu cầu quá lớn.'); chunks.push(Buffer.from(chunk)); }
            const data = JSON.parse(Buffer.concat(chunks).toString());
            const current = require('./scripts/remotionSchema.cjs').validateShot(data.current);
            if (typeof data.instruction !== 'string' || !data.instruction.trim() || data.instruction.length > 4000) throw new Error('Nhập yêu cầu chỉnh cảnh, tối đa 4.000 ký tự.');
            const shot = await editor.exclusive(() => require('./scripts/remotionPlanner.cjs').planShot({ ...data, current }));
            res.end(JSON.stringify({ shot }));
          } catch (error: any) { res.statusCode = 400; res.end(JSON.stringify({ error: error.message })); }
          return;
        }
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
            else if (projectRoute && (req.method === 'POST' || (req.method === 'PATCH' && !projectRoute[2]))) {
              const chunks: Buffer[] = []; let bytes = 0;
              for await (const chunk of req) { bytes += chunk.length; if (bytes > 10 * 1024 * 1024) throw new Error('Dữ liệu quá lớn.'); chunks.push(Buffer.from(chunk)); }
              const input = JSON.parse(Buffer.concat(chunks).toString());
              result = await editor.exclusive(() => req.method === 'PATCH' ? store.rename(projectRoute[1], input.title) : store.save(projectRoute[1], input, !!projectRoute[2]));
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
        if (req.url?.match(/^\/api\/storyboard\/[\w-]+\/stop$/) && req.method === 'POST') {
          res.setHeader('Content-Type','application/json');
          try {
            const drafts = require('./scripts/storyboardDrafts.cjs');
            const id = req.url.split('/')[3];
            const draft = drafts.requestStop(id);
            if (draft.status === 'building') await require('./scripts/chatgptBrowser.cjs').ChatGPTBrowser.getInstance().cancelRequest();
            res.end(JSON.stringify(draft));
          } catch(error:any) {res.statusCode=400;res.end(JSON.stringify({error:error.message}));}
          return;
        }
        if (req.url?.startsWith('/api/storyboard/') && ['GET','PUT'].includes(req.method || '')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            delete require.cache[require.resolve('./scripts/storyboardDrafts.cjs')];
            const drafts = require('./scripts/storyboardDrafts.cjs');
            const exporting=req.url.endsWith('/export');
            const id = req.url.slice('/api/storyboard/'.length).replace(/\/export$/, '');
            if(exporting && req.method==='GET') {
              const list=require('./scripts/remotionSceneList.cjs').exportDraft(drafts.read(id));
              res.setHeader('Content-Disposition', 'attachment; filename="scene-list.json"');
              res.end(JSON.stringify(list,null,2));return;
            }
            if (req.method === 'GET') res.end(JSON.stringify(drafts.publicDraft(drafts.read(id))));
            else {
              let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1000000) throw new Error('Storyboard quá lớn.'); }
              res.end(JSON.stringify(drafts.saveDraft(id, JSON.parse(body))));
            }
          } catch (error: any) { res.statusCode = 400; res.end(JSON.stringify({error:error.message})); }
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
            let remotionRequest = false;
            try {
              const data = JSON.parse(body);
              delete data.approvedPlan;
              remotionRequest = data.videoMode === 'remotion';
              if (data.videoMode && !['images', 'remotion'].includes(data.videoMode)) throw new Error('Kiểu video không hợp lệ.');
              if (data.videoMode === 'remotion') for (const module of ['remotionGenerator', 'remotionPlanner', 'remotionSchema', 'remotionDirection', 'chatgptBrowser']) delete require.cache[require.resolve(`./scripts/${module}.cjs`)];
              const scriptPath = require.resolve(data.videoMode === 'remotion' ? './scripts/remotionGenerator.cjs' : './scripts/videoGenerator.cjs');
              const { generateVideo } = require(scriptPath);

              const onProgress = (prog: any) => {
                if (data.storyboardId) require('./scripts/storyboardDrafts.cjs').progress(data.storyboardId,prog);
                try {
                  res.write(JSON.stringify(prog) + '\n');
                } catch (e) {
                  // ignore if socket closed
                }
              };

              const result = await editor.exclusive(async () => {
                store.migrate();
                delete require.cache[require.resolve('./scripts/storyboardDrafts.cjs')];
                const drafts = require('./scripts/storyboardDrafts.cjs');
                let approved;
                if (data.videoMode === 'remotion' && data.storyboardId) approved = drafts.begin(data.storyboardId, data.revision);
                let generated;
                try { generated = await generateVideo(approved ? {...approved.options, approvedPlan:approved, onProgress} : { ...data, onProgress }); }
                catch (error) { if (approved) drafts.finish(approved.id,'failed',undefined,require('./scripts/remotionReliability.cjs').publicGenerationError(error)); throw error; }
                if (generated.approvalRequired) return generated;
                let saved;
                try { saved = store.create({ metadata: generated.metadata, scenes: generated.scenes }, generated.finalVideoPath || path.join(publicRoot, 'final-video.mp4')); }
                catch (error) { if (approved) drafts.finish(approved.id,'failed',undefined,require('./scripts/remotionReliability.cjs').publicGenerationError(error)); throw error; }
                if (approved) drafts.finish(approved.id,'complete',saved.metadata.project_id);
                return { ...generated, ...saved, finalVideoUrl: `/projects/${saved.metadata.project_id}/final-video.mp4` };
              });

              res.write(JSON.stringify({ type: result.approvalRequired ? 'storyboard' : 'complete', percent: 100, result }) + '\n');
              res.end();
            } catch (err: any) {
              console.error('API Error in /api/generate-video:', err);
              try {
                res.write(JSON.stringify({ type: 'error', error: remotionRequest ? require('./scripts/remotionReliability.cjs').publicGenerationError(err) : err.message || String(err) }) + '\n');
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
      allowedHosts: ['test.wevic.vn'],
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**'],
      },
    },
  };
});
