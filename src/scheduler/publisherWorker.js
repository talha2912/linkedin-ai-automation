export async function publishDuePosts(store, publisher) {
  const duePosts = await store.dueForPublishing();

  for (const post of duePosts) {
    try {
      await store.setStatus(post.id, 'publishing');
      const result = await publisher.publishTextPost(post.draft.fullText);
      await store.setStatus(post.id, 'published', {
        linkedInPostId: result.id,
        publishedAt: new Date().toISOString(),
        error: undefined
      });
    } catch (error) {
      await store.setStatus(post.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown publishing error'
      });
    }
  }

  return duePosts.length;
}

export function startPublisherScheduler(store, publisher) {
  const timer = setInterval(() => {
    publishDuePosts(store, publisher).catch((error) => {
      console.error('Scheduled publishing failed', error);
    });
  }, 60_000);

  return () => clearInterval(timer);
}
