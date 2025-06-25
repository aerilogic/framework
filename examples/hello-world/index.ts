import { bootstrap } from '@aeri/core';
import { httpModule } from '@aeri/http';

await bootstrap({
  logic: {
    hello: () => ({ message: 'Hello, world!' }),
    '@http': {
      hello: { method: 'get', path: '/hello' }
    }
  },
  modules: [httpModule]
});
