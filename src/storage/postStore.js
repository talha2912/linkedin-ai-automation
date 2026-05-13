import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export class PostStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async list() {
    return this.#readAll();
  }

  async findById(id) {
    return (await this.#readAll()).find((post) => post.id === id);
  }

  async create(input) {
    const now = new Date().toISOString();
    const post = {
      id: randomUUID(),
      topic: input.topic,
      audience: input.audience ?? 'engineering leaders and hiring teams',
      tone: input.tone ?? 'professional',
      goal: input.goal ?? 'build authority',
      draft: input.draft,
      status: input.status ?? (input.scheduledAt ? 'scheduled' : 'draft'),
      scheduledAt: input.scheduledAt,
      createdAt: now,
      updatedAt: now
    };

    const posts = await this.#readAll();
    posts.push(post);
    await this.#writeAll(posts);
    return post;
  }

  async update(id, patch) {
    const posts = await this.#readAll();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) throw new Error(`Post not found: ${id}`);

    posts[index] = { ...posts[index], ...patch, updatedAt: new Date().toISOString() };
    await this.#writeAll(posts);
    return posts[index];
  }

  async dueForPublishing(now = new Date()) {
    return (await this.#readAll()).filter((post) => {
      if (!post.scheduledAt || !['approved', 'scheduled'].includes(post.status)) return false;
      return new Date(post.scheduledAt).getTime() <= now.getTime();
    });
  }

  async setStatus(id, status, extra = {}) {
    return this.update(id, { ...extra, status });
  }

  async #readAll() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async #writeAll(posts) {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(posts, null, 2));
  }
}
