import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// POST — generate content for a single page or batch of pages
// Body: { page_ids: string[] } or { template_id: string } (generate all draft pages in template)
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json()
  const supabase = createAdminClient()

  // Resolve which pages to generate
  let pageIds: string[] = body.page_ids ?? []
  if (body.template_id && pageIds.length === 0) {
    const { data: pages } = await supabase
      .from('seo_pages')
      .select('id')
      .eq('template_id', body.template_id)
      .in('status', ['draft', 'live'])
    pageIds = (pages ?? []).map(p => p.id)
  }

  if (pageIds.length === 0) {
    return NextResponse.json({ error: 'No pages to generate' }, { status: 400 })
  }

  // Create pipeline run
  const { data: pages } = await supabase
    .from('seo_pages')
    .select('*, seo_templates(*)')
    .in('id', pageIds)

  if (!pages?.length) {
    return NextResponse.json({ error: 'Pages not found' }, { status: 404 })
  }

  const templateId = pages[0].template_id
  const { data: run } = await supabase
    .from('seo_pipeline_runs')
    .insert({
      template_id: templateId,
      status: 'running',
      current_step: 'generate',
      cells_planned: pages.length,
      cells_passed: 0,
      cells_generated: 0,
      steps: [
        { name: 'generate', status: 'running', started_at: new Date().toISOString() },
      ],
    })
    .select('id')
    .single()

  const runId = run?.id

  let generated = 0
  const results: Array<{ page_id: string; status: string; error?: string }> = []

  for (const page of pages) {
    try {
      const template = page.seo_templates
      if (!template?.master_prompt) {
        results.push({ page_id: page.id, status: 'skipped', error: 'No master prompt on template' })
        continue
      }

      // Substitute variables into the prompt
      const prompt = substituteVariables(template.master_prompt, page.variables, page.data_row)

      // Generate with Claude
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      })

      const content = response.content
        .filter(b => b.type === 'text')
        .map(b => b.type === 'text' ? b.text : '')
        .join('\n')

      if (!content) {
        results.push({ page_id: page.id, status: 'error', error: 'Empty response from Claude' })
        continue
      }

      // Get current version
      const nextVersion = (page.version ?? 0) + 1

      // Save brief
      const { data: brief } = await supabase
        .from('seo_briefs')
        .insert({
          page_id: page.id,
          version: nextVersion,
          prompt_used: prompt,
          data_snapshot: page.data_row,
          generated_content: content,
          model: 'claude-sonnet-4-6',
        })
        .select('id')
        .single()

      // Update page version and brief_id
      await supabase
        .from('seo_pages')
        .update({
          version: nextVersion,
          brief_id: brief?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)

      generated++
      results.push({ page_id: page.id, status: 'success' })

      // Update pipeline run progress
      if (runId) {
        await supabase
          .from('seo_pipeline_runs')
          .update({ cells_generated: generated })
          .eq('id', runId)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ page_id: page.id, status: 'error', error: msg })
    }
  }

  // Finalise pipeline run
  if (runId) {
    await supabase
      .from('seo_pipeline_runs')
      .update({
        status: generated === pages.length ? 'succeeded' : 'failed',
        current_step: 'complete',
        cells_generated: generated,
        cells_passed: generated,
        finished_at: new Date().toISOString(),
        steps: [
          { name: 'generate', status: 'done', started_at: new Date().toISOString(), finished_at: new Date().toISOString() },
        ],
      })
      .eq('id', runId)
  }

  return NextResponse.json({ generated, total: pages.length, run_id: runId, results })
}

/** Replace {{variable}} and {{data.field}} placeholders in the prompt */
function substituteVariables(
  prompt: string,
  variables: Record<string, string>,
  dataRow: Record<string, unknown>,
): string {
  let result = prompt

  // Replace {{var_name}} with variables
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
  }

  // Replace {{data.field}} with data row values
  for (const [key, value] of Object.entries(dataRow)) {
    result = result.replace(new RegExp(`\\{\\{data\\.${key}\\}\\}`, 'g'), String(value ?? ''))
  }

  return result
}
