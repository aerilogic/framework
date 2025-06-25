export interface BootstrapOptions {
  logic?: any;
  config?: Record<string, any>;
  modules?: Array<(core: AeriCore) => void | Promise<void>>;
}

export class AeriCore {
  config: Record<string, any>;
  logic: any[] = [];
  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }
  getConfig<T = any>(key: string, defaultValue?: T): T {
    return this.config[key] ?? defaultValue;
  }
}

import path from 'path';

export async function bootstrap(options: BootstrapOptions = {}) {
  console.log('[Aeri][DEBUG][bootstrap] options:', JSON.stringify(options, (k, v) => (typeof v === 'function' ? '[Function]' : v), 2));
  const core = new AeriCore(options.config);

  // Mostrar el estado inicial de core.logic y core.config
  console.log('[Aeri][DEBUG][bootstrap] core.logic (init):', JSON.stringify(core.logic));
  console.log('[Aeri][DEBUG][bootstrap] core.config (init):', JSON.stringify(core.config));

  // Inicializar módulos si se especifican
  if (Array.isArray(options.modules)) {
    console.log('[Aeri][DEBUG][bootstrap] Inicializando módulos:', options.modules.length);
    for (const mod of options.modules) {
      if (typeof mod === 'function') {
        await mod(core);
      }
    }
    console.log(`[Aeri] Loaded ${options.modules.length} module(s)`);
  }

  // Cargar lógica de negocio si se especifica
  const logicConfig = options.logic;
  console.log('[Aeri][DEBUG][bootstrap] logicConfig:', JSON.stringify(logicConfig, (k, v) => (typeof v === 'function' ? '[Function]' : v), 2));
  if (logicConfig && typeof logicConfig === 'object' && !Array.isArray(logicConfig)) {
    core.logic.push(logicConfig);
    console.log('[Aeri][DEBUG][bootstrap] core.logic after push:', JSON.stringify(core.logic, (k, v) => (typeof v === 'function' ? '[Function]' : v), 2));
    console.log('[Aeri] Loaded inline logic object');
  } else {
    let logicFiles: any[] = [];
    if (logicConfig !== undefined) {
      logicFiles = Array.isArray(logicConfig)
        ? logicConfig
        : logicConfig
          ? [logicConfig]
          : [];
    } else {
      // Buscar logic.ts, logic.js, logic/*.ts, logic/*.js
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
      // Buscar archivos en logic/
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
          // Resolver path absoluto relativo al cwd del usuario
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

  console.log('[Aeri] Microservice started!');
  return core;
}
