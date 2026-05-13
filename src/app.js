import { createServer } from 'node:http';
import { config } from './config.js';
import { generateLinkedInPost, validateDraft, validateGenerateInput } from './content/generator.js';
import { LinkedInPublisher } from './linkedin/publisher.js';
import { publishDuePosts } from './scheduler/publisherWorker.js';
import { PostStore } from './storage/postStore.js';
import { parseRoute, readJson, sendJson } from './http.js';

export function createApp(store = new PostStore(config.dataFile), publisher = new LinkedInPublisher()) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'OPTIONS') return sendJson(res, 204, {});

      if (req.method === 'GET' && url.pathname === '/health') {
        return sendJson(res, 200, { status: 'ok', service: 'linkedin-ai-content-automation' });
      }

      if (req.method === 'POST' && url.pathname === '/api/posts/generate') {
        const body = validateGenerateInput(await readJson(req));
        const draft = await generateLinkedInPost(body);
        return sendJson(res, 201, { draft });
      }

      if (req.method === 'POST' && url.pathname === '/api/posts') {
        const body = await readJson(req);
        const input = validateGenerateInput(body);
        validateDraft(body.draft);
        const post = await store.create({ ...input, draft: body.draft, scheduledAt: body.scheduledAt, status: body.status });
        return sendJson(res, 201, post);
      }

      if (req.method === 'GET' && url.pathname === '/api/posts') {
        return sendJson(res, 200, await store.list());
      }

      const postRoute = parseRoute(url, '/api/posts/:id');
      if (req.method === 'GET' && postRoute) {
        const post = await store.findById(postRoute.id);
        return post ? sendJson(res, 200, post) : sendJson(res, 404, { error: 'Post not found' });
      }

      const statusRoute = parseRoute(url, '/api/posts/:id/status');
      if (req.method === 'PATCH' && statusRoute) {
        const body = await readJson(req);
        if (!['draft', 'approved', 'scheduled'].includes(body.status)) throw new Error('status must be draft, approved, or scheduled.');
        const post = await store.setStatus(statusRoute.id, body.status, { scheduledAt: body.scheduledAt });
        return sendJson(res, 200, post);
      }

      const publishRoute = parseRoute(url, '/api/posts/:id/publish');
      if (req.method === 'POST' && publishRoute) {
        const post = await store.findById(publishRoute.id);
        if (!post) return sendJson(res, 404, { error: 'Post not found' });

        await store.setStatus(post.id, 'publishing');
        const result = await publisher.publishTextPost(post.draft.fullText);
        const publishedPost = await store.setStatus(post.id, 'published', {
          linkedInPostId: result.id,
          publishedAt: new Date().toISOString(),
          error: undefined
        });
        return sendJson(res, 200, publishedPost);
      }

      if (req.method === 'POST' && url.pathname === '/api/scheduler/run-once') {
        const publishedCount = await publishDuePosts(store, publisher);
        return sendJson(res, 200, { publishedCount });
      }

      return sendJson(res, 404, { error: 'Route not found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const status = message.includes('not found') ? 404 : message.includes('must') || message.includes('required') ? 400 : 500;
      return sendJson(res, status, { error: message });
    }
  });
}
