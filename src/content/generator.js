import { config } from '../config.js';
import { buildLinkedInPrompt } from './prompts.js';

export function validateGenerateInput(input) {
  if (!input || typeof input !== 'object') throw new Error('Request body must be an object.');
  if (!input.topic || typeof input.topic !== 'string' || input.topic.trim().length < 3) {
    throw new Error('topic must be at least 3 characters.');
  }
  return {
    ...input,
    topic: input.topic.trim(),
    audience: input.audience ?? undefined,
    tone: input.tone ?? undefined,
    goal: input.goal ?? undefined,
    profile: input.profile ?? undefined
  };
}

export async function generateLinkedInPost(input) {
  const parsedInput = validateGenerateInput(input);

  if (!config.openaiApiKey) {
    return createFallbackDraft(parsedInput);
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.openaiModel,
      input: [
        {
          role: 'system',
          content: 'You are a senior B2B content strategist who writes authentic LinkedIn posts for software engineers. Always produce safe, truthful, non-spammy content.'
        },
        { role: 'user', content: buildLinkedInPrompt(parsedInput) }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'linkedin_post_draft',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              hook: { type: 'string' },
              body: { type: 'string' },
              callToAction: { type: 'string' },
              hashtags: { type: 'array', items: { type: 'string' } },
              fullText: { type: 'string' },
              rationale: { type: 'string' }
            },
            required: ['hook', 'body', 'callToAction', 'hashtags', 'fullText', 'rationale']
          }
        }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI generation failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((content) => content.type === 'output_text')?.text;
  if (!outputText) throw new Error('OpenAI did not return output text.');

  return validateDraft(JSON.parse(outputText));
}

export function validateDraft(draft) {
  const required = ['hook', 'body', 'callToAction', 'hashtags', 'fullText', 'rationale'];
  for (const key of required) {
    if (!(key in draft)) throw new Error(`draft.${key} is required.`);
  }
  if (!Array.isArray(draft.hashtags) || draft.hashtags.length < 3 || draft.hashtags.length > 5) {
    throw new Error('draft.hashtags must include 3-5 hashtags.');
  }
  return draft;
}

export function createFallbackDraft(input) {
  const topic = input.topic.trim();
  const audience = input.audience ?? 'backend and full-stack engineering teams';
  const hook = `The best engineering content starts with one real lesson: ${topic}.`;
  const body = [
    `When I think about ${topic}, I try to turn the idea into something practical for ${audience}.`,
    'A strong post should share context, a specific lesson, and one takeaway someone can apply today.',
    'For technical topics, that means explaining the trade-off, the implementation decision, and the business impact without overclaiming results.'
  ].join('\n\n');
  const callToAction = 'What would you add from your own experience?';
  const hashtags = ['#SoftwareEngineering', '#BackendDevelopment', '#SaaS', '#AI'];

  return {
    hook,
    body,
    callToAction,
    hashtags,
    fullText: `${hook}\n\n${body}\n\n${callToAction}\n\n${hashtags.join(' ')}`,
    rationale: 'Fallback draft generated locally so the workflow can be tested without an OpenAI API key.'
  };
}
