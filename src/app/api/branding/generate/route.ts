import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const NW_BRAND = `
NORTHERN WARRIOR FITNESS — BRAND GUIDELINES FOR SOCIAL MEDIA

Colours:
- Primary gold: #C9A70A
- Dark gold: #967705
- Background dark: #0a0a0a
- Card dark: #111111 / #161616

Business details:
- Name: Northern Warrior Fitness
- Location: Egremont, Cumbria
- Instagram: @northernwarriorfitness

Brand aesthetic:
- Dark, bold, premium — gym culture meets Cumbrian grit
- Gold accents for emphasis
- Community-first, authentic, never corporate
- Celebrates real people and real results
- Strength & Conditioning / Functional Fitness focused
`

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { review, prompt, style } = await req.json()

  if (!review && !prompt) {
    return NextResponse.json({ error: 'review or prompt is required' }, { status: 400 })
  }

  const contextBlock = review
    ? `A member has left a ${review.rating}-star Google review. Create social media post copy in the "${style}" style to showcase this review.

Review author: ${review.author_name}
Review text: "${review.text}"`
    : `Create a social media post for Northern Warrior Fitness in the "${style}" style.

Post brief: ${prompt}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a social media content creator for Northern Warrior Fitness, a gym in Egremont, Cumbria.

${NW_BRAND}

${contextBlock}

Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "headline": "3–6 punchy words (e.g. Results That Speak Volumes)",
  "subheadline": "Optional one-line supporting statement, or empty string",
  "caption": "Instagram caption, 2–3 sentences max, brand voice",
  "hashtags": ["array", "of", "8", "to", "10", "relevant", "hashtags"]
}

Style guidance:
- quote: poetic, emphasises the member's voice
- bold: high-energy, gym culture, strong action words
- minimal: clean, understated, lets the result speak`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

  let data: { headline: string; subheadline: string; caption: string; hashtags: string[] }
  try {
    data = JSON.parse(raw)
  } catch {
    const cleaned = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    data = JSON.parse(cleaned)
  }

  return NextResponse.json(data)
}
