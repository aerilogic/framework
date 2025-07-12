import { Request, Response, NextFunction } from 'express';
import type { AeriCore } from './core.js';

export type Logger = Pick<Console, 'info' | 'warn' | 'error' | 'debug'>;

// Re-export Express types for convenience
export { Request, Response, NextFunction } from 'express';

// HTTP Route configuration
export interface HttpRouteConfig {
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path?: string;
  middlewares?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

// Unified Context System
export interface BaseContext {
  type: 'http' | 'worker';
  core: AeriCore;
  logger: Logger;
}

export interface HttpContext extends BaseContext {
  type: 'http';
  req: Request;
  res: Response;
  next: NextFunction;
  // Convenience methods
  query: any;
  params: any;
  body: any;
  headers: any;
}

// Worker Context - for all job/queue/event/rpc/schedule operations
export interface WorkerContext extends BaseContext {
  type: 'worker';
  data: any;  // Main data payload
  jobId: string;
  attempts: number;
  progress: (progress: number) => void;
  
  // Optional metadata based on worker type
  job?: {
    name: string;
    scheduledAt?: Date;
  };
  event?: {
    name: string;
    timestamp: Date;
  };
  rpc?: {
    method: string;
    params: any[];
    clientId?: string;
  };
  schedule?: {
    name: string;
    scheduledAt: Date;
    interval?: string;
  };
}

// Union type for contexts
export type AeriContext = HttpContext | WorkerContext;

// Handler function types - specialized for each context type
export type HttpHandler = (ctx: HttpContext) => any;
export type WorkerHandler = (ctx: WorkerContext) => any;
export type AeriHandler = HttpHandler | WorkerHandler | (() => any);

// Logic block structure
export interface LogicBlock {
  [functionName: string]: AeriHandler | any; // Business logic functions
  _http?: Record<string, HttpRouteConfig>;
  _rpc?: string[];
  _job?: string[];
  _events?: Record<string, string[]>;
}

// Union type for logic input
export type LogicInput = LogicBlock | string | LogicBlock[];