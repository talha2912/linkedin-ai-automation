import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { publishDuePosts } from '../src/scheduler/publisherWorker.js';
import { PostStore } from '../src/storage/postStore.js';

const draft = {
  hook: 'A practical hook about LinkedIn automation.',
  body: 'A useful body with approval workflows, truthful writing, scheduling, and safe publishing safeguards for professional content.',
  callToAction: 'What should be automated carefully?',
  hashtags: ['#LinkedIn', '#AI', '#ContentAutomation'],
  fullText: 'A practical hook about LinkedIn automation.\n\nA useful body with approval workflows, truthful writing, scheduling, and safe publishing safeguards for professional content.\n\nWhat should be automated carefully?\n\n#LinkedIn #AI #ContentAutomation',
  rationale: 'Test draft.'
};

test('publishDuePosts publishes approved due posts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'linkedin-worker-'));
  const store = new PostStore(join(dir, 'posts.json'));

  try {
    const post = await store.create({
      topic: 'AI content automation',
      draft,
      scheduledAt: new Date(Date.now() - 60_000).toISOString(),
      status: 'approved'
    });

    const count = await publishDuePosts(store, {
      publishTextPost: async (text) => ({ id: `mock-${text.length}`, raw: { ok: true } })
    });

    const updated = await store.findById(post.id);
    assert.equal(count, 1);
    assert.equal(updated?.status, 'published');
    assert.match(updated?.linkedInPostId ?? '', /^mock-/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
