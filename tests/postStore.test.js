import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { PostStore } from '../src/storage/postStore.js';

const draft = {
  hook: 'A practical hook about system design.',
  body: 'A useful body with practical context, trade-offs, and a clear lesson for engineers building SaaS systems.',
  callToAction: 'What would you add?',
  hashtags: ['#SoftwareEngineering', '#SaaS', '#BackendDevelopment'],
  fullText: 'A practical hook about system design.\n\nA useful body with practical context, trade-offs, and a clear lesson for engineers building SaaS systems.\n\nWhat would you add?\n\n#SoftwareEngineering #SaaS #BackendDevelopment',
  rationale: 'Test draft.'
};

test('PostStore creates posts and finds due scheduled posts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'linkedin-store-'));
  const store = new PostStore(join(dir, 'posts.json'));

  try {
    const post = await store.create({
      topic: 'Payment webhook reliability',
      draft,
      scheduledAt: new Date(Date.now() - 60_000).toISOString()
    });

    assert.equal(post.status, 'scheduled');
    assert.equal((await store.list()).length, 1);

    await store.setStatus(post.id, 'approved');
    const due = await store.dueForPublishing(new Date());

    assert.equal(due.length, 1);
    assert.equal(due[0].id, post.id);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
