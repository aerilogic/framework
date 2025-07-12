import type { LogicBlock, Logger } from './types.js';

export class AeriCore {
  config: Record<string, any>;
  logic: LogicBlock[] = [];
  logger: Logger = console;

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  getConfig<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let current: any = this.config;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue as T;
      }
    }
    
    return (current ?? defaultValue) as T;
  }
}