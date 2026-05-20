import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ────────────────────────────────────────────────────────────────────

export interface RuleCondition {
  field: 'from' | 'subject' | 'body' | 'from_domain' | 'has_attachment' | 'attachment_type'
  op: 'contains' | 'equals' | 'not_contains' | 'starts_with' | 'ends_with' | 'regex'
  value: string | boolean
}

export interface RuleAction {
  category?: string
  flag?: boolean
  destination?: 'inbox' | 'archive' | 'junk'
  extract_invoice?: boolean
  create_task?: boolean
  task_priority?: 'low' | 'medium' | 'high'
}

export interface InboxRule {
  id: string
  name: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  action: RuleAction
  match_type: 'all' | 'any'
}

export interface NormalizedEmail {
  from: string
  from_domain: string
  subject: string
  body: string
  has_attachment: boolean
  attachment_types: string[]
}

export interface Classification {
  category: string
  flagged: boolean
  create_task: boolean
  task_title?: string
  task_detail?: string
  task_due_date?: string
  task_priority?: string
  ai_summary: string
  extract_invoice?: boolean
  destination?: string
}

// ── Engine ───────────────────────────────────────────────────────────────────

export interface ApplyRulesResult {
  classification: Classification
  matchedRuleId: string | null
}

/**
 * Load enabled rules and apply the first matching one to the AI classification.
 * Rules override specific fields only — unset fields keep the AI's decision.
 * First match wins (ordered by priority ASC).
 * Returns the merged classification + the ID of the matched rule (if any).
 */
export async function applyRules(
  email: NormalizedEmail,
  aiClassification: Classification,
): Promise<ApplyRulesResult> {
  const supabase = createAdminClient()
  const { data: rules } = await supabase
    .from('inbox_rules')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: true })

  if (!rules?.length) return { classification: aiClassification, matchedRuleId: null }

  for (const rule of rules) {
    const conditions = rule.conditions as RuleCondition[]
    const matchType = rule.match_type as 'all' | 'any'
    const action = rule.action as RuleAction

    const matched = matchType === 'all'
      ? conditions.every(c => evaluateCondition(c, email))
      : conditions.some(c => evaluateCondition(c, email))

    if (matched) {
      // Merge rule action into classification — rule overrides AI for present fields
      const merged = { ...aiClassification }

      if (action.category !== undefined) merged.category = action.category
      if (action.flag !== undefined) merged.flagged = action.flag
      if (action.destination !== undefined) merged.destination = action.destination
      if (action.extract_invoice !== undefined) merged.extract_invoice = action.extract_invoice
      if (action.create_task !== undefined) merged.create_task = action.create_task
      if (action.task_priority !== undefined) merged.task_priority = action.task_priority

      return { classification: merged, matchedRuleId: rule.id } // First match wins
    }
  }

  return { classification: aiClassification, matchedRuleId: null }
}

// ── Condition evaluator ──────────────────────────────────────────────────────

function evaluateCondition(condition: RuleCondition, email: NormalizedEmail): boolean {
  const { field, op, value } = condition

  // Get the field value from the email
  let fieldValue: string | boolean
  switch (field) {
    case 'from':           fieldValue = email.from; break
    case 'from_domain':    fieldValue = email.from_domain; break
    case 'subject':        fieldValue = email.subject; break
    case 'body':           fieldValue = email.body; break
    case 'has_attachment':  fieldValue = email.has_attachment; break
    case 'attachment_type': fieldValue = email.attachment_types.join(','); break
    default: return false
  }

  // Boolean comparison
  if (typeof value === 'boolean') {
    return fieldValue === value
  }

  // String comparison
  const strField = String(fieldValue).toLowerCase()
  const strValue = String(value).toLowerCase()

  switch (op) {
    case 'contains':     return strField.includes(strValue)
    case 'equals':       return strField === strValue
    case 'not_contains': return !strField.includes(strValue)
    case 'starts_with':  return strField.startsWith(strValue)
    case 'ends_with':    return strField.endsWith(strValue)
    case 'regex':
      try { return new RegExp(String(value), 'i').test(String(fieldValue)) }
      catch { return false }
    default: return false
  }
}
