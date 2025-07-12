import { bootstrap, HttpContext, Request, Response } from '@aeri/core';

await bootstrap({
  logic: {
    // Simple handler with no parameters
    home: () => ({ message: 'Welcome to Aeri!' }),
    
    // NEW: Modern context-based handler (recommended)
    modernHandler: (ctx: HttpContext) => ({
      message: 'Modern context handler!',
      type: ctx.type,
      query: ctx.query,
      body: ctx.body,
      method: ctx.req.method,
      path: ctx.req.path
    }),

    // NEW: Multi-purpose handler that works across modules
    universalHandler: (ctx: HttpContext) => {
      if (ctx.type === 'http') {
        return {
          message: 'HTTP request received',
          query: ctx.query,
          userAgent: ctx.headers['user-agent']
        };
      }
      // In the future, this same handler could handle jobs, events, etc.
      return { message: 'Unknown context type', type: ctx.type };
    },

    // NEW: Custom response with context
    customContextResponse: (ctx: HttpContext) => {
      ctx.res.status(201).json({
        message: 'Custom response via context',
        timestamp: new Date().toISOString(),
        path: ctx.req.path
      });
    },
    
    // LEGACY: Old Express-style handlers (still supported)
    legacyHello: (req: Request) => ({ 
      message: 'Legacy Express handler', 
      query: req.query 
    }),
    
    legacyCustom: (req: Request, res: Response) => {
      res.status(200).json({
        message: 'Legacy Express style',
        method: req.method
      });
    },

    _http: {
      home: { method: 'get', path: '/' },
      modernHandler: { method: 'get', path: '/modern' },
      universalHandler: { method: 'get', path: '/universal' },
      customContextResponse: { method: 'post', path: '/context-custom' },
      legacyHello: { method: 'get', path: '/legacy' },
      legacyCustom: { method: 'get', path: '/legacy-custom' }
    }
  }
});
