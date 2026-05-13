import { config as loadEnv } from './env.js';

loadEnv();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  linkedInAccessToken: process.env.LINKEDIN_ACCESS_TOKEN,
  linkedInAuthorUrn: process.env.LINKEDIN_AUTHOR_URN,
  linkedInVersion: process.env.LINKEDIN_VERSION ?? '202601',
  dataFile: process.env.DATA_FILE ?? '.data/posts.json'
};

export function assertPublishingConfig() {
  const missing = [
    ['LINKEDIN_ACCESS_TOKEN', config.linkedInAccessToken],
    ['LINKEDIN_AUTHOR_URN', config.linkedInAuthorUrn]
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`Missing LinkedIn publishing config: ${missing.map(([key]) => key).join(', ')}`);
  }
}
