import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Streaming keeps the connection alive — no Vercel timeout
export const maxDuration = 60

const NW_BRAND = `
NORTHERN WARRIOR FITNESS — BRAND GUIDELINES FOR EMAIL

Colours:
- Primary gold: #C9A70A
- Dark gold: #967705
- Background dark: #0a0a0a
- Card dark: #111111
- Text primary: #F0F0F0
- Text muted: #999999

Business details:
- Name: Northern Warrior Fitness
- Website: northernwarrior.co.uk
- Email: info@northernwarrior.co.uk
- Location: Egremont, Cumbria, CA22
- Instagram: @northernwarriorfitness
- Google Review Link: https://g.page/r/CdM6goa0gQ8TEAI/review

Brand voice:
- Community-first, never corporate
- Warm but direct — like a message from a trusted coach
- Proud of Cumbria and the Lake District
- Inclusive — all fitness levels welcome
- Authentic — real people, real results

Email structure (always follow this):
1. Dark header (#0a0a0a) with logo in the header — use the logo URL provided, or fallback to "NORTHERN WARRIOR" text in gold (#C9A70A) bold uppercase, "FITNESS" below in white
2. Hero section — if a hero image is provided, use it as a full-width banner below the header. If no image, use a bold headline with gold accent line
3. Body — clear sections with adequate spacing
4. One prominent gold CTA button (#C9A70A text-black, rounded, padding 14px 32px)
5. Footer — dark bg, address, unsubscribe placeholder, Instagram link

Technical requirements:
- Fully self-contained HTML + CSS (no external stylesheets)
- All CSS inline or in a <style> block in <head>
- Mobile responsive — single column on mobile, max-width 600px centered on desktop
- Web-safe fonts only: Arial, Georgia, serif, sans-serif
- Images: use actual <img> tags with the exact URLs provided — never placeholder or made-up URLs
- If no images provided, use CSS shapes/borders for decorative elements only
- Gold accent lines/borders to add visual structure
- Generous whitespace — never cramped
MERGE TAGS — Mailchimp replaces these automatically per subscriber when the campaign sends:
- *|FNAME|* = subscriber's first name
- *|LNAME|* = subscriber's last name
- *|EMAIL|* = subscriber's email address

Always use these exact tags (not {{first_name}} or any other format).
Example greeting: "Hey *|FNAME|*,"
`

const AUDIENCE_LABELS: Record<string, string> = {
  all_members:   'all current Northern Warrior members',
  adult_members: 'adult members only',
  kids_parents:  'parents of Kids & Teens programme members',
  trials:        'members currently on a 2-week free trial',
  inactive:      "members who haven't attended recently and need re-engaging",
  hyrox:         'members interested in or currently doing Hyrox training',
}

const TONE_LABELS: Record<string, string> = {
  warm:         "warm, personal and friendly — like a message from a trusted friend and coach",
  motivating:   'energetic, motivating and inspiring — fire them up',
  direct:       "clear, concise and direct — respect the reader's time, no fluff",
  professional: 'professional and polished, but still human',
  fun:          'fun, casual and light-hearted — keep it upbeat',
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  try {
    const { prompt, tone, audience, selectedImages, logoUrl } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

    const imageLines: string[] = []
    if (logoUrl) {
      imageLines.push(`LOGO URL (use in header): ${logoUrl}`)
    } else {
      imageLines.push('No logo URL provided — use text "NORTHERN WARRIOR FITNESS" styled in gold in the header')
    }
    if (selectedImages && selectedImages.length > 0) {
      imageLines.push('', 'IMAGES TO USE IN THIS EMAIL (use real <img> tags with exact URLs below):')
      selectedImages.forEach((img: { url: string; alt: string | null; category: string | null }, i: number) => {
        imageLines.push(`Image ${i + 1}:`, `  URL: ${img.url}`, `  Alt text: ${img.alt ?? ''}`, `  Category: ${img.category ?? 'general'}`)
      })
      imageLines.push('', 'Image placement rules:', '- Image 1 should be used as a full-width hero/banner image directly below the header (max-width 600px, width 100%)', '- Additional images can be placed in relevant content sections', '- Always use the exact alt text provided for each image', '- Never invent or guess image URLs — only use the ones listed above')
    } else {
      imageLines.push('No additional images selected — use text-based design with CSS decorative elements only')
    }

    // Stream the response to avoid Vercel timeout
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are an expert email designer and copywriter for Northern Warrior Fitness, a gym in Egremont, Cumbria.

${NW_BRAND}

${imageLines.join('\n')}

Create a complete, production-ready HTML email based on the following brief.

BRIEF:
${prompt}

TONE: ${TONE_LABELS[tone] ?? tone}
AUDIENCE: ${AUDIENCE_LABELS[audience] ?? audience}

Return ONLY the raw HTML — no explanation, no markdown code fences, no backticks. Start your response with <!DOCTYPE html> and end with </html>. Nothing else.`,
      }],
    })

    // Collect all text chunks then return as JSON
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let html = ''
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            html += event.delta.text
          }
        }
        const json = JSON.stringify({ html: html.trim() })
        controller.enqueue(encoder.encode(json))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 })
  }
}
