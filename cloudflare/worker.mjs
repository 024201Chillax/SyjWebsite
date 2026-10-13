import handler from '../.open-next/worker.js';
import {serveMedia} from './media.mjs';

export default {
  async fetch(request, env, ctx) {
    return await serveMedia(request, env.PORTFOLIO_MEDIA) ?? handler.fetch(request, env, ctx);
  }
};

export {DOQueueHandler, DOShardedTagCache} from '../.open-next/worker.js';
