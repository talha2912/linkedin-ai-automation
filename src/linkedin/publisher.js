import { assertPublishingConfig, config } from '../config.js';

export class LinkedInPublisher {
  async publishTextPost(text) {
    assertPublishingConfig();

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.linkedInAccessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': config.linkedInVersion,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: config.linkedInAuthorUrn,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      })
    });

    const responseText = await response.text();
    const raw = responseText ? safeJson(responseText) : {};

    if (!response.ok) {
      throw new Error(`LinkedIn publish failed (${response.status}): ${responseText}`);
    }

    const id = response.headers.get('x-restli-id') ?? extractPostId(raw) ?? 'published-without-id';
    return { id, raw };
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function extractPostId(raw) {
  if (raw && typeof raw === 'object' && typeof raw.id === 'string') return raw.id;
  return undefined;
}
