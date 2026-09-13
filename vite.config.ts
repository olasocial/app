import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function turnstileDevMiddlewarePlugin(): Plugin {
  return {
    name: 'turnstile-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/verify-turnstile' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const token = parsed.token;
              if (!token) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Token requerido' }));
                return;
              }

              const secretKey =
                process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
                process.env.TURNSTILE_SECRET_KEY ||
                '1x0000000000000000000000000000000AA';

              const formData = new URLSearchParams();
              formData.append('secret', secretKey);
              formData.append('response', token.trim());

              const cloudflareResp = await fetch(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                {
                  method: 'POST',
                  body: formData,
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                }
              );

              const data = await cloudflareResp.json();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), turnstileDevMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
