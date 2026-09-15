// ─────────────────────────────────────────────────────────────────────────────
// Kids & Teens — registration export helpers
//
// Pure functions (no browser or Node APIs) so they can be imported by both the
// CSV route handler (server) and the Registrations client component (browser).
//   • buildRegistrationsCsv    → full CSV incl. parent + emergency phone numbers
//   • registrationsPrintHtml   → a printable HTML document, one form per page,
//                                which the browser's print dialog saves as PDF.
// ─────────────────────────────────────────────────────────────────────────────

import type { RegistrationFull } from './types'
import { CATEGORY_LABEL, CATEGORY_AGE_RANGE, ageFromDob } from './constants'

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pending',
  link_sent: 'Payment link sent',
  paid: 'Paid',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

// ── Date formatting ──────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ageLabel(dob: string): string {
  if (!dob) return ''
  const age = ageFromDob(dob)
  return Number.isFinite(age) && age >= 0 ? `${age}` : ''
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const CSV_HEADERS = [
  'Registration Date',
  'Block',
  'Category',
  'Child Name',
  'Date of Birth',
  'Age',
  'Medical Notes / Allergies',
  'Authorised Pickups',
  'Photo Consent',
  'Parent / Guardian Name',
  'Parent Email',
  'Parent Phone',
  'Emergency Contact Name',
  'Emergency Contact Phone',
  'Emergency Contact Relation',
  'Payment Status',
  'Waiver Signed',
  'Waiver Signed At',
  'Paid At',
]

/** Build a full CSV of the given registrations. Leads with a UTF-8 BOM so Excel
 *  opens phone numbers / accents correctly. */
export function buildRegistrationsCsv(regs: RegistrationFull[]): string {
  const lines = [CSV_HEADERS.map(csvCell).join(',')]
  for (const r of regs) {
    lines.push(
      [
        fmtDateTime(r.created_at),
        r.block_name,
        CATEGORY_LABEL[r.category],
        r.child_name,
        fmtDate(r.date_of_birth),
        ageLabel(r.date_of_birth),
        r.medical_notes,
        r.authorised_pickups,
        r.photo_consent ? 'Yes' : 'No',
        r.parent_name,
        r.parent_email,
        r.parent_phone,
        r.emergency_contact_name,
        r.emergency_contact_phone,
        r.emergency_contact_relation,
        PAYMENT_LABEL[r.payment_status] ?? r.payment_status,
        r.waiver_signed ? 'Yes' : 'No',
        fmtDateTime(r.waiver_signed_at),
        fmtDateTime(r.paid_at),
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return '﻿' + lines.join('\r\n')
}

// ── Printable HTML (→ PDF via the browser print dialog) ───────────────────────

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label: string, value: string | null | undefined): string {
  return `<tr><th>${label}</th><td>${esc(value)}</td></tr>`
}

function formSection(r: RegistrationFull): string {
  const categoryLine = `${CATEGORY_LABEL[r.category]} · ages ${CATEGORY_AGE_RANGE[r.category]}`
  const dobLine = r.date_of_birth ? `${fmtDate(r.date_of_birth)} (age ${ageLabel(r.date_of_birth)})` : '—'
  const waiverLine = r.waiver_signed
    ? `Signed${r.waiver_signed_at ? ` · ${fmtDateTime(r.waiver_signed_at)}` : ''}`
    : 'Not signed'

  return `
  <section class="form">
    <header class="form-head">
      <div>
        <div class="brand">Northern Warrior</div>
        <div class="sub">Kids &amp; Teens — Registration Form</div>
      </div>
      <div class="meta">
        <div><strong>${esc(r.block_name)}</strong></div>
        <div>${esc(categoryLine)}</div>
        <div class="muted">Registered ${esc(fmtDateTime(r.created_at))}</div>
      </div>
    </header>

    <h2>Child details</h2>
    <table>
      ${row('Full name', r.child_name)}
      ${row('Date of birth', dobLine)}
      ${row('Group', categoryLine)}
      ${row('Photo consent', r.photo_consent ? 'Given' : 'Not given')}
      ${row('Medical notes / allergies', r.medical_notes)}
      ${row('Authorised pickups', r.authorised_pickups)}
    </table>

    <h2>Parent / guardian</h2>
    <table>
      ${row('Name', r.parent_name)}
      ${row('Email', r.parent_email)}
      ${row('Phone', r.parent_phone)}
    </table>

    <h2>Emergency contact</h2>
    <table>
      ${row('Name', r.emergency_contact_name)}
      ${row('Phone', r.emergency_contact_phone)}
      ${row('Relation', r.emergency_contact_relation)}
    </table>

    <h2>Booking</h2>
    <table>
      ${row('Payment status', PAYMENT_LABEL[r.payment_status] ?? r.payment_status)}
      ${row('Paid at', r.paid_at ? fmtDateTime(r.paid_at) : null)}
      ${row('Waiver', waiverLine)}
    </table>
  </section>`
}

/** Build a full, self-contained printable HTML document for the given
 *  registrations — one form per page. The document auto-triggers the print
 *  dialog on load so the user can "Save as PDF". */
export function registrationsPrintHtml(regs: RegistrationFull[]): string {
  const title =
    regs.length === 1
      ? `Registration — ${regs[0].child_name}`
      : `Registrations (${regs.length})`

  const body = regs.map(formSection).join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a; background: #fff; font-size: 13px; line-height: 1.5;
  }
  .form { padding: 32px 36px; page-break-after: always; }
  .form:last-child { page-break-after: auto; }
  .form-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #967705; padding-bottom: 14px; margin-bottom: 20px;
  }
  .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
  .sub { font-size: 12px; color: #967705; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
  .meta { text-align: right; font-size: 12px; }
  .meta .muted { color: #888; margin-top: 3px; }
  h2 {
    font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #967705;
    margin: 22px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
  th { width: 34%; color: #666; font-weight: 600; }
  td { color: #1a1a1a; }
  @media print {
    .form { padding: 0 6mm; }
    @page { margin: 14mm; }
  }
</style>
</head>
<body>
${body}
<script>
  window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });
  window.onafterprint = function () { window.close(); };
</script>
</body>
</html>`
}
