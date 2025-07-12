
# Aeri – Minimalist Microframework for Microservices

Aeri is a modular, lightweight microframework for microservices written in TypeScript (with future extensions to Go). Inspired by the simplicity of Lumen and the "do one thing, do it well" philosophy.

---

## ⚡ Quick Installation

```bash
npm install @aeri/core
```

---

## ✨ Minimal Microservice Example

```ts
// index.ts
import { bootstrap } from '@aeri/core';
bootstrap();
```

```ts
// logic/payments.ts
export default {
  createPayment,
  _rpc: ['createPayment'],
  _http: {
    createPayment: { method: 'post', path: '/payments' }
  }
}
```

---

## 🧩 Main Modules

| Module          | Brief Description                                        |
| --------------  | ------------------------------------------------------- |
| @aeri/core      | Complete microframework with HTTP, RPC, events, and more |

---

## 🛡️ Security

> ⚠️ **In production, use Redis with TLS (`rediss://`).**
> Aeri will show a warning if `redis://` (without encryption) is detected.

---

## 🧱 Philosophy

- Zero config, zero boilerplate
- Convention over configuration
- Declarative magic from `logic/` files
- Modular, stateless, and easy to deploy
- Redis as the base messaging system

---

## 🚀 Main Features

- Independent microservices that can communicate with each other
- Built-in HTTP server with automatic routes
- RPC between services (coming soon)
- Workers as regular functions (coming soon)
- Decoupled events (coming soon)
- Scheduled tasks (coming soon)
- Efficient structured logging (coming soon)
- No need to write route, worker, or handler files

---

## 📂 Recommended Structure

```
my-service/
├── logic/
│   ├── payments.ts
│   └── internal/cache.ts
├── models/
│   ├── user.model.ts
│   └── product.model.ts
├── index.ts
├── package.json
```

---

## 🧠 Magic Conventions

You can define functions and assign them roles using magic metadata or the `method()` helper:

```ts
// Form A: Magic metadata
export default {
  createPayment,
  notifyUser,

  _rpc: ['createPayment'],
  _job: ['notifyUser'],
  _events: {
    notifyUser: ['payment.completed']
  },
  _http: {
    createPayment: { method: 'post', path: '/payments', middlewares: ['auth'] }
  },
  _schedule: {
    cleanOldPayments: '0 3 * * *'
  }
}
```

```ts
// Form B: Using method()
export default {
  createPayment: method(createPayment, {
    rpc: true,
    job: true,
    http: { method: 'post', path: '/payments' }
  })
}
```

---

## ⏱️ Roadmap

- [x] Core bootstrap (`@aeri/core`)
- [x] RPC module
- [x] HTTP router
- [x] Queues/jobs system
- [x] Events
- [x] Scheduler
- [x] Logger
- [ ] Devtools (`npm run dev`)
- [ ] Documentation (`@aeri/docs`)
- [ ] CLI scaffolder for JS and Go
- [ ] Binary compatibility between clients (TS + Go)
- [ ] VSCode Extension to detect RPCs

---

## 🚦 Project Status

Aeri is in **alpha version**: the API may change and it is recommended for experimentation, prototypes, and early feedback. All contributions and bug reports are welcome!

## 🤝 How to Contribute

1. Fork the repository
2. Create a branch for your feature or fix
3. Open a Pull Request
4. Use issues for suggestions or to report bugs

---

## ✨ License

Open Source – a formal license will be defined soon.
