import path from 'path';
import { AeriCore } from './core.js';
import { HttpModule, type HttpOptions } from './modules/http.js';
import type { LogicInput, LogicBlock } from './types.js';

// Re-export everything from types
export * from './types.js';
export { AeriCore } from './core.js';
export { HttpModule } from './modules/http.js';

export interface BootstrapOptions {
  logic?: LogicInput;
  config?: Record<string, any>;
  http?: HttpOptions;
  modules?: Array<(core: AeriCore) => void | Promise<void>>;
}

export async function bootstrap(options: BootstrapOptions = {}) {
  const core = new AeriCore(options.config);

  // Initialize HTTP by default (unless explicitly disabled)
  const httpEnabled = options.http?.enabled !== false;
  let httpModule: HttpModule | undefined;
  
  if (httpEnabled) {
    httpModule = new HttpModule(core);
    httpModule.initialize(options.http);
  }

  // Initialize modules if specified
  if (Array.isArray(options.modules)) {
    console.log(`[Aeri] Initializing ${options.modules.length} module(s)...`);
    for (const mod of options.modules) {
      if (typeof mod === 'function') {
        await mod(core);
      }
    }
    console.log(`[Aeri] Loaded ${options.modules.length} module(s)`);
  }

  // Load business logic if specified
  const logicConfig = options.logic;
  if (logicConfig && typeof logicConfig === 'object' && !Array.isArray(logicConfig)) {
    core.logic.push(logicConfig);
  } else {
    let logicFiles: (string | LogicBlock)[] = [];
    if (logicConfig !== undefined) {
      logicFiles = Array.isArray(logicConfig)
        ? logicConfig
        : logicConfig
          ? [logicConfig]
          : [];
    } else {
      // Look for logic.ts, logic.js, logic/*.ts, logic/*.js
      const cwd = process.cwd();
      const fs = await import('fs');
      const candidates = [
        'logic.ts',
        'logic.js',
      ];
      for (const file of candidates) {
        if (fs.existsSync(`${cwd}/${file}`)) {
          logicFiles.push(`${cwd}/${file}`);
        }
      }
      // Look for files in logic/
      const logicDir = `${cwd}/logic`;
      if (fs.existsSync(logicDir) && fs.statSync(logicDir).isDirectory()) {
        const allFiles = fs.readdirSync(logicDir);
        for (const file of allFiles) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            logicFiles.push(`${logicDir}/${file}`);
          }
        }
      }
      if (logicFiles.length === 0) {
        console.warn('[Aeri] No business logic found. Please create a logic.ts, logic.js file or put your logic files inside the logic/ folder.');
      }
    }
    for (const logicItem of logicFiles) {
      if (logicItem && typeof logicItem === 'object') {
        core.logic.push(logicItem);
        console.log('[Aeri] Loaded inline logic object');
      } else if (typeof logicItem === 'string') {
        try {
          // Resolve absolute path relative to user's cwd
          const absPath = path.isAbsolute(logicItem)
            ? logicItem
            : path.resolve(process.cwd(), logicItem);
          const logicModule = await import(absPath);
          core.logic.push(logicModule.default || logicModule);
          console.log(`[Aeri] Loaded logic from ${logicItem}`);
        } catch (err: any) {
          console.warn(`[Aeri] Could not load logic file ${logicItem}:`, err.message);
        }
      }
    }
  }

  // Start HTTP server if enabled and logic with HTTP routes exists
  if (httpEnabled && httpModule) {
    const hasHttpRoutes = core.logic.some(logic => logic && logic._http);
    if (hasHttpRoutes) {
      console.log('[Aeri] Starting HTTP server...');
      httpModule.startServer();
    } else {
      console.log('[Aeri] No HTTP routes found in logic, skipping HTTP server startup.');
    }
  }

  console.log('[Aeri] Microservice started!');
  return core;
}