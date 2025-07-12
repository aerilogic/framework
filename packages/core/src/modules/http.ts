import express, { Express, Request, Response, NextFunction, Application } from 'express';
import http from 'http';
import type { AeriCore } from '../core.js';
import type { HttpContext, HttpRouteConfig, LogicBlock, Logger } from '../types.js';

export interface HttpOptions {
  port?: number;
  host?: string;
  enabled?: boolean;
}

export class HttpModule {
  private core: AeriCore;
  private httpApp?: Application;
  private config?: {
    port: number;
    host: string;
    logger: Logger;
  };
  private started = false;

  constructor(core: AeriCore) {
    this.core = core;
  }

  initialize(options: HttpOptions = {}) {
    if (this.started) return;

    const port = options.port ?? this.core.getConfig('http.port', 3000);
    const host = options.host ?? this.core.getConfig('http.host', '127.0.0.1');
    
    this.httpApp = express();
    this.config = { port, host, logger: this.core.logger };

    // Setup middleware
    this.httpApp.use(express.json());
    this.httpApp.use(express.urlencoded({ extended: true }));
    this.httpApp.use(this.createErrorHandler());

    this.started = true;
  }

  startServer() {
    if (!this.httpApp || !this.config) {
      this.core.logger.warn('[Aeri] HTTP not initialized. Cannot start server.');
      return;
    }

    this.registerRoutes();
    this.startHttpServer();
  }

  private registerRoutes() {
    if (!this.httpApp || !this.core.logic.length) {
      this.core.logger.warn('[Aeri][HTTP] No logic found, no routes to register.');
      return;
    }

    console.log('[Aeri][HTTP] Starting route registration...');
    let routesRegistered = 0;

    for (const logic of this.core.logic) {
      if (!logic || typeof logic !== 'object' || !logic._http) {
        continue;
      }

      const routes = logic._http;
      console.log(`[Aeri][HTTP] Found _http routes:`, routes);

      for (const [fnName, routeConfig] of Object.entries<HttpRouteConfig>(routes)) {
        const handler = logic[fnName];

        if (typeof handler !== 'function') {
          this.core.logger.warn(`[Aeri][HTTP] Handler for "${fnName}" not found or not a function.`);
          continue;
        }

        const method = (routeConfig.method || 'get').toLowerCase();
        const path = routeConfig.path || `/${fnName}`;
        const middlewares = routeConfig.middlewares || [];

        const asyncHandler = (req: Request, res: Response, next: NextFunction) => {
          try {
            // Create HTTP context object
            const httpContext: HttpContext = {
              type: 'http',
              core: this.core,
              logger: this.core.logger,
              req,
              res,
              next,
              // Convenience properties
              query: req.query,
              params: req.params,
              body: req.body,
              headers: req.headers
            };

            // Detect function signature and call appropriately
            const funcStr = handler.toString();
            // Simple regex to match function parameters
            const paramMatch = funcStr.match(/^(?:async\s+)?(?:\w+\s*=\s*)?(?:async\s+)?\(([^)]*)\)|^(?:async\s+)?(\w+)\s*=>/);
            let params: string[] = [];
            
            if (paramMatch) {
              if (paramMatch[1] !== undefined) {
                // Function with parentheses: (param1, param2) => or function(param1, param2)
                params = paramMatch[1].split(',').map((p: string) => p.trim()).filter((p: string) => p);
              } else if (paramMatch[2]) {
                // Arrow function without parentheses: param =>
                params = [paramMatch[2].trim()];
              }
            }
            
            let result: any;
            
            // Check if handler expects HttpContext (modern approach)
            if (params.length === 1) {
              // Single parameter - assume it's HttpContext
              result = handler(httpContext);
            }
            // Legacy support for Express-style handlers
            else if (params.length >= 3) {
              result = handler(req, res, next);
            } else if (params.length === 2) {
              result = handler(req, res);
            } else {
              result = handler();
            }

            // Handle the result
            Promise.resolve(result)
              .then(finalResult => {
                // Only auto-respond if the response hasn't been sent manually
                if (!res.headersSent && finalResult !== undefined) {
                  res.json(finalResult);
                }
              })
              .catch(next);
          } catch (error) {
            next(error);
          }
        };

        const httpMethod = method as 'get' | 'post' | 'put' | 'delete' | 'patch';
        if (['get', 'post', 'put', 'delete', 'patch'].includes(httpMethod)) {
          this.httpApp[httpMethod](path, ...middlewares, asyncHandler);
          this.core.logger.info(`[Aeri][HTTP] Route registered: [${method.toUpperCase()}] ${path}`);
          routesRegistered++;
        } else {
          this.core.logger.warn(`[Aeri][HTTP] Unsupported HTTP method: ${method}`);
        }
      }
    }

    console.log(`[Aeri][HTTP] Total routes registered: ${routesRegistered}`);
  }

  private startHttpServer() {
    if (!this.httpApp || !this.config) return;

    const { port, host, logger } = this.config;
    const server = http.createServer(this.httpApp);

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`[Aeri][HTTP] Port ${port} is in use, trying port ${port + 1}.`);
        setTimeout(() => {
          this.config!.port = port + 1;
          this.startHttpServer();
        }, 100);
      } else {
        logger.error('[Aeri][HTTP] Failed to start server:', err);
      }
    });

    server.listen(port, host, () => {
      logger.info(`[Aeri][HTTP] Server listening on http://${host}:${port}`);
    });
  }

  private createErrorHandler() {
    return (err: any, req: Request, res: Response, _next: NextFunction) => {
      this.core.logger.error(`[Aeri][HTTP] Unhandled error on ${req.method} ${req.path}:`, err);

      const isProduction = process.env.NODE_ENV === 'production';
      const errorResponse = {
        message: 'Internal Server Error',
        ...(isProduction ? {} : { error: err.message }),
      };

      res.status(500).json(errorResponse);
    };
  }

  get app() {
    return this.httpApp;
  }

  get isStarted() {
    return this.started;
  }
}