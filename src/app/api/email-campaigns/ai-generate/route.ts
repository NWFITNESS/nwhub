import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Streaming keeps the connection alive — no Vercel timeout
export const maxDuration = 60

const NW_BRAND = `
NORTHERN WARRIOR FITNESS — EMAIL DESIGN SYSTEM

You are a world-class email designer. Your emails look like they were designed by a premium agency — clean, modern, bold, with beautiful spacing and typography. Think Peloton, Gymshark, or Apple email quality.

═══ BRAND IDENTITY ═══

Business: Northern Warrior Fitness — a premium functional fitness gym in Egremont, Cumbria
Website: northernwarrior.co.uk
Email: info@northernwarrior.co.uk
Location: Egremont, Cumbria, CA22
Instagram: @northernwarriorfitness
Google Review: https://g.page/r/CdM6goa0gQ8TEAI/review

Voice: Community-first, warm but direct, like a trusted coach texting a friend. Never corporate. Proud of Cumbria. Inclusive — all levels welcome. Real people, real results.

═══ DESIGN RULES ═══

LAYOUT:
- Max width: 600px, centered with margin: 0 auto
- Single column — NEVER use multi-column layouts (they break on mobile)
- Generous padding: 40px horizontal on desktop, 20px on mobile
- Section spacing: 32-48px between sections
- Use tables for layout (email client compatibility), NOT divs with flexbox

COLOUR PALETTE:
- Background: #0a0a0a (near black)
- Card/section bg: #111111 or #161616 (dark charcoal)
- Primary accent: #C9A70A (gold)
- Bright gold: #f2ca50 (for highlights, stars, emphasis)
- Text primary: #F0F0F0 (near white)
- Text secondary: #999999 (gray)
- Text muted: #666666 (dark gray)
- White: #FFFFFF (for bold headings on dark bg)

TYPOGRAPHY:
- Headings: Arial Black or Arial bold, uppercase where impactful
- Body: Arial, 16px line-height 1.6, color #999
- Small text: 13-14px
- NEVER use fonts that won't render in email clients

BUTTONS — THIS IS CRITICAL, ALWAYS INCLUDE AT LEAST ONE:
- Style: background-color: #C9A70A; color: #000000; font-weight: bold; padding: 16px 40px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 15px; letter-spacing: 0.5px;
- Wrap in a center-aligned table cell for email client compatibility:
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr><td style="background-color:#C9A70A; border-radius:8px;"><a href="URL" style="color:#000; font-weight:bold; padding:16px 40px; display:inline-block; text-decoration:none; font-size:15px;">BUTTON TEXT</a></td></tr></table>
- Button text: short, action-oriented, uppercase or title case
- If the user mentions ANY action (book, sign up, review, visit, buy, register, join), create a button for it

IMAGES:
- Full width (width: 100%, max-width: 600px)
- Use exact URLs provided — NEVER invent image URLs
- Always include alt text
- If no images provided, use bold typography and gold accent lines instead
- Images should have border-radius: 8px where appropriate

HEADER:
- Background: #0a0a0a
- If logo URL provided: <img> centered, max-height 50px
- If no logo: "NORTHERN WARRIOR" in gold (#C9A70A) bold uppercase, 22px, letter-spacing 4px. Below: "FITNESS" in white, 12px, letter-spacing 6px
- Padding: 30px

HERO SECTION:
- If hero image: full-width below header, no padding
- If no hero image: large bold headline (28-36px, white, uppercase), gold accent line (3px height, 60px width, #C9A70A, centered), subtitle in #999

CONTENT SECTIONS:
- Each section: padding 32px 40px
- Use gold horizontal rules between sections: <hr style="border:none; height:2px; background:linear-gradient(90deg, transparent, #C9A70A, transparent); margin:32px 0;">
- Bullet points: use gold bullet character "▸" or emoji
- Important numbers/stats: make them BIG (32-48px), gold (#C9A70A), bold
- Names/people: bold white text
- Quotes: italic, larger font, gold left border

FOOTER:
- Background: #0a0a0a
- Padding: 30px 40px
- Instagram link with icon or text
- Address: Northern Warrior Fitness, Egremont, Cumbria, CA22
- Unsubscribe: <a href="*|UNSUB|*" style="color:#666;">Unsubscribe</a>
- Small text: 12px, color #666

EMOJI:
- Use emoji throughout for energy and personality (🔥💪🏆🚀👏🏋️⚡)
- Place them in headings and key callouts
- Don't overdo body text with emoji

═══ MERGE TAGS (Mailchimp) ═══
- *|FNAME|* = first name — use in greeting: "Hey *|FNAME|*,"
- *|LNAME|* = last name
- *|EMAIL|* = email
- *|UNSUB|* = unsubscribe URL (use in footer)
Always use these exact tags, not {{first_name}} format.

═══ QUALITY CHECKLIST ═══
Before outputting, verify:
✓ At least ONE gold CTA button with proper table-based structure
✓ Every action mentioned by the user has a corresponding button
✓ Fully self-contained HTML (all CSS inline or in <style>)
✓ Mobile responsive (single column, max-width 600px)
✓ Gold accent lines/dividers for visual structure
✓ Generous whitespace — never cramped
✓ Footer with unsubscribe link
✓ Greeting uses *|FNAME|*
✓ All provided image URLs used with <img> tags
✓ No invented/placeholder image URLs
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

    const userContent = `${NW_BRAND}

═══ IMAGES FOR THIS EMAIL ═══
${imageLines.join('\n')}

═══ BRIEF ═══
${prompt}

TONE: ${TONE_LABELS[tone] ?? tone}
AUDIENCE: This email is for ${AUDIENCE_LABELS[audience] ?? audience}

═══ IMPORTANT INSTRUCTIONS ═══
1. Read the brief carefully. If the user mentions ANY call-to-action (book, sign up, review, visit, join, register, buy, learn more, check out, etc.) — you MUST create a prominent gold CTA button for it.
2. If no specific action is mentioned, still include a relevant button (e.g. "Visit Our Website", "Follow Us on Instagram").
3. Include ALL content the user asked for. Don't skip details.
4. Make it visually stunning — use the gold accent system, big numbers, emoji, and bold typography.

═══ OUTPUT FORMAT ═══
Return your response in EXACTLY this format — three lines then the HTML:

TITLE: Short catchy campaign title (max 60 chars)
PREVIEW: Email preview text for inbox (max 150 chars)
HTML:
<!DOCTYPE html>
...complete production-ready HTML email...
</html>

Start with TITLE: on line 1. No markdown, no code fences, no explanation.`

    // Stream to keep the Vercel connection alive, collect into final text
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: userContent }],
    })

    let raw = ''
    try {
      const finalMessage = await stream.finalMessage()
      raw = finalMessage.content[0].type === 'text' ? finalMessage.content[0].text.trim() : ''
    } catch (streamErr) {
      const msg = streamErr instanceof Error ? streamErr.message : String(streamErr)
      return NextResponse.json({ error: `AI stream failed: ${msg}` }, { status: 500 })
    }

    if (!raw) {
      return NextResponse.json({ error: 'AI returned empty response. Try again.' }, { status: 500 })
    }

    // Parse the structured response — be very forgiving
    let html = '', title = '', preview_text = ''

    const titleMatch = raw.match(/^TITLE:\s*(.+)/m)
    const previewMatch = raw.match(/^PREVIEW:\s*(.+)/m)

    // Try to find HTML in the response
    const htmlMatch = raw.match(/<!DOCTYPE\s+html[\s\S]*<\/html>/i)
      ?? raw.match(/<html[\s\S]*<\/html>/i)

    if (htmlMatch) {
      html = htmlMatch[0].trim()
      // Strip any metadata lines the AI left inside
      html = html.replace(/^TITLE:.*$/gm, '').replace(/^PREVIEW:.*$/gm, '').replace(/^HTML:\s*$/gm, '').trim()
    } else if (raw.includes('<') && raw.includes('>')) {
      // Looks like HTML even without DOCTYPE
      html = raw.replace(/^TITLE:.*$/gm, '').replace(/^PREVIEW:.*$/gm, '').replace(/^HTML:\s*$/gm, '').trim()
    } else {
      return NextResponse.json({ error: 'AI did not return valid HTML. Try again with a clearer prompt.' }, { status: 500 })
    }

    title = titleMatch?.[1]?.trim() ?? prompt.slice(0, 60)
    preview_text = previewMatch?.[1]?.trim() ?? prompt.slice(0, 150)

    return NextResponse.json({ html, title, preview_text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 })
  }
}
