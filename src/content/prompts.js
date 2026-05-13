export function buildLinkedInPrompt(input) {
  const profile = input.profile ?? {};
  const pillars = profile.pillars?.join(', ') || 'backend engineering, SaaS architecture, payments, integrations, AI systems';

  return `Create one high-quality LinkedIn post for a software engineer personal brand.

Profile:
- Name: ${profile.name ?? 'Mohd Talha Khan'}
- Role: ${profile.role ?? 'Software Engineer'}
- Audience: ${input.audience ?? profile.audience ?? 'engineering leaders, founders, and backend/full-stack hiring teams'}
- Voice: ${profile.voice ?? 'clear, practical, credible, concise'}
- Content pillars: ${pillars}

Post brief:
- Topic: ${input.topic}
- Tone: ${input.tone ?? 'professional and insightful'}
- Goal: ${input.goal ?? 'build authority and invite meaningful conversations'}

Rules:
- Do not invent fake metrics, employers, credentials, clients, or testimonials.
- Avoid engagement bait, spam, auto-commenting, pods, or manipulative growth language.
- Keep the post readable on mobile with short paragraphs.
- Include a strong opening hook, practical body, one clear call-to-action, and 3-5 relevant hashtags.
- Return JSON only with keys: hook, body, callToAction, hashtags, fullText, rationale.`;
}
