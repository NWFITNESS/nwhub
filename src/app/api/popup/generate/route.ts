import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a popup designer for Northern Warrior, a functional fitness gym in Egremont, Cumbria. Design a promotional popup layout.

The popup uses a block-based grid system:
- 12 columns wide
- Row height: 20px per row
- Each block has: x (0-11), y (row), w (columns), h (rows)

Available block types:
- "text": text content with font styling
- "image": image URL (leave content empty, user will add)
- "button": CTA button. Put the destination in style.buttonLink (NOT a top-level "link" field). Use a REAL site path only — one of: /start-here, /membership, /training, /timetable, /contact, /kids-teens, /hyrox, /physio, /personal-training. For a free-trial / "claim my 2 weeks" CTA use /start-here. Never invent paths.
- "badge": small pill label
- "divider": horizontal line
- "icon": emoji/symbol

Brand colours:
- Gold: #c9a70a (primary accent)
- Dark bg: #0e0e0e
- White text: #ffffff
- Muted text: rgba(255,255,255,0.6)
- Gold gradient for buttons: linear-gradient(135deg, #967705, #c4a015)

The user wants: ${prompt}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "backgroundColor": "#0e0e0e",
  "width": 420,
  "height": 540,
  "borderRadius": 16,
  "dismiss_text": "No thanks, I'll look around first",
  "blocks": [
    {
      "id": "block_1",
      "type": "text",
      "x": 0, "y": 0, "w": 12, "h": 3,
      "content": "Your text here",
      "style": {
        "fontSize": 28,
        "fontWeight": 700,
        "color": "#ffffff",
        "textAlign": "center",
        "fontFamily": "Rajdhani"
      }
    }
  ]
}

Design 5-8 blocks that create an attractive, professional popup. Use the brand colours. Make text compelling and action-oriented. Include at least: a heading, description text, and a CTA button.`,
      }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.type === 'text' ? b.text : '')
      .join('')
      .trim()

    // Parse JSON — handle markdown code blocks
    const jsonStr = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
    const design = JSON.parse(jsonStr)

    // Validate blocks exist
    if (!Array.isArray(design.blocks)) {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 })
    }

    // Normalise button links: the manual builder + public renderer use style.buttonLink,
    // but the AI sometimes emits a top-level "link" field. Fold it in so the link is
    // always editable in the StylePanel and never lost. Default to /start-here.
    for (const block of design.blocks) {
      if (block?.type !== 'button') continue
      block.style = block.style ?? {}
      const link = block.link ?? block.style.buttonLink ?? block.style.link
      block.style.buttonLink = link && link !== '#' ? link : '/start-here'
      delete block.link
      delete block.style.link
    }

    return NextResponse.json(design)
  } catch (err) {
    console.error('[popup/generate]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
