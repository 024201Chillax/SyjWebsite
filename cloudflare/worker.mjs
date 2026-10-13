import handler from '../.open-next/worker.js';
import {serveVideo} from './video-range.mjs';

export default {
  async fetch(request, env, ctx) {
    return await serveVideo(request, env.ASSETS, ctx) ?? handler.fetch(request, env, ctx);
  }
};
export {DOQueueHandler, DOShardedTagCache} from '../.open-next/worker.js';
