import { config } from './config.js';
import { createApp } from './app.js';
import { LinkedInPublisher } from './linkedin/publisher.js';
import { startPublisherScheduler } from './scheduler/publisherWorker.js';
import { PostStore } from './storage/postStore.js';

const store = new PostStore(config.dataFile);
const publisher = new LinkedInPublisher();
const app = createApp(store, publisher);

app.listen(config.port, () => {
  console.log(`LinkedIn AI content automation API running on http://localhost:${config.port}`);
});

startPublisherScheduler(store, publisher);
