import { XeroClient } from 'xero-node'

export const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_CLIENT_SECRET!,
  redirectUris: [process.env.XERO_REDIRECT_URI!],
  scopes: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'accounting.invoices.read',
    'accounting.payments.read',
    'accounting.contacts.read',
    'accounting.reports.profitandloss.read',
    'accounting.settings.read',
  ],
})
