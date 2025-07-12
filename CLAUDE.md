# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aeri is a minimalist microframework for building microservices in TypeScript. It follows a "zero config, zero boilerplate" philosophy with convention over configuration.

### Core Architecture

- **Monorepo structure** with TypeScript workspaces
- **Batteries-included design** with core functionality:
  - `@aeri/core` - Complete microframework with HTTP, and future RPC, queues, events, etc.
- **Magic conventions** using metadata (`_http`, `_rpc`, `_job`) for automatic service registration
- **Logic-first approach** where business logic files in `logic/` automatically generate routes and endpoints

### Key Components

1. **AeriCore class** (`packages/core/index.ts:8-18`) - Central configuration and logic management
2. **bootstrap function** (`packages/core/index.ts:22-105`) - Main entry point that loads logic files and initializes modules
3. **httpModule** (`packages/http/index.ts:104-125`) - Express.js integration with automatic route registration
4. **Logic loading** - Automatically discovers and loads `logic.ts`, `logic.js`, or files in `logic/` directory

### Convention-Based Architecture

Business logic files use magic metadata to define endpoints:

```typescript
export default {
  createPayment,
  _http: {
    createPayment: { method: 'post', path: '/payments' }
  },
  _rpc: ['createPayment']
}
```

## Development Commands

### Build Commands
- `npm run build` - Build individual packages (each package has its own build script)
- Individual package builds: `cd packages/core && npm run build`

### Development
- `npm run dev` - Start development server with nodemon, watches packages and examples
- Runs the hello-world example: `examples/hello-world/index.ts`

### Testing
- No test framework currently configured (shows "Error: no test specified")

## Working with the Codebase

### Adding New Modules
1. Create new package in `packages/` directory
2. Follow the pattern: `index.ts` with main module function
3. Add to workspace in root `package.json`
4. Module functions should accept `AeriCore` instance as first parameter

### Logic Files
- Place business logic in `logic/` directory or `logic.ts`/`logic.js` files
- Use magic metadata (`_http`, `_rpc`, etc.) to define service endpoints
- Functions are automatically registered based on metadata

### TypeScript Configuration
- Root `tsconfig.json` builds all packages from `packages/` directory
- Individual packages have their own `tsconfig.json`
- Target: ES2020, Module: NodeNext
- Outputs to `dist/` directories

### Example Structure
See `examples/hello-world/` for a minimal working example showing:
- Bootstrap configuration
- Inline logic definition
- HTTP module integration