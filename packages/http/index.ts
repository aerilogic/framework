import express, { Express, Request, Response, NextFunction } from 'express';
import { AeriCore } from '@aeri/core';

export interface HttpModuleOptions {
  port?: number;
}

export const httpModule = async (core: AeriCore, options: HttpModuleOptions = {}) => {
  const app: Express = express();
  const config = core.config || {};
  let port = options.port || config.http?.port || 3000;

  // Log completo del estado de core.logic
  console.log('[Aeri][DEBUG][httpModule] core.logic:', JSON.stringify(core.logic, (k, v) => (typeof v === 'function' ? '[Function]' : v), 2));

  // Normalizar la lógica: aceptar tanto un objeto plano como un array
  // Si core.logic es un array, úsalo tal cual. Si es un objeto, envuélvelo en un array.
  const logicObjects = Array.isArray(core.logic) ? core.logic : [core.logic];
  console.log('[Aeri][DEBUG][httpModule] logicObjects.length:', logicObjects.length);

  // Registrar rutas HTTP a partir de la metadata mágica '@http' en cada objeto de lógica
  for (const [idx, logic] of logicObjects.entries()) {
    console.log(`[Aeri][DEBUG][httpModule] Logic object #${idx}:`, JSON.stringify(logic, (k, v) => (typeof v === 'function' ? '[Function]' : v), 2));
    if (!logic || typeof logic !== 'object') continue;
    const logicKeys = Object.keys(logic);
    console.log(`[Aeri][DEBUG][httpModule] Logic object #${idx} keys:`, logicKeys);
    if (!logic['@http']) {
      console.log(`[Aeri][HTTP] No @http metadata found in logic object #${idx}, skipping.`);
      continue;
    }
    const routes = logic['@http'];
    // Iterar sobre cada endpoint definido en la metadata @http
    for (const [fnName, routeConfig] of Object.entries<any>(routes)) {
      const handler = logic[fnName];
      console.log(`[Aeri][DEBUG][httpModule] Checking handler for "${fnName}" in logic #${idx}:`, typeof handler);
      if (typeof handler !== 'function') {
        console.warn(`[Aeri][HTTP] Handler for "${fnName}" not found or not a function in logic #${idx}, skipping route.`);
        continue;
      }
      const method = (routeConfig.method || 'get').toLowerCase();
      const path = routeConfig.path || `/${fnName}`;
      const middlewares = routeConfig.middlewares || [];
      // Registrar la ruta en Express
      (app as any)[method](path, ...middlewares, async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Ejecutar el handler (puede ser async o sync)
          const result = await handler(req, res, next);
          if (!res.headersSent && result !== undefined) {
            res.json(result);
          }
        } catch (err) {
          next(err);
        }
      });
      console.log(`[Aeri][HTTP] Registered route [${method.toUpperCase()}] ${path} (handler: ${fnName}) in logic #${idx}`);
    }
  }

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Aeri][HTTP] Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // Lógica para encontrar un puerto disponible
  const startServer = (tryPort: number) => {
    const server = app.listen(tryPort, () => {
      console.log(`[Aeri][HTTP] Listening on port ${tryPort}`);
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Aeri][HTTP] Port ${tryPort} in use, trying ${tryPort + 1}...`);
        startServer(tryPort + 1);
      } else {
        console.error('[Aeri][HTTP] Server error:', err);
      }
    });
  };
  startServer(port);
};
