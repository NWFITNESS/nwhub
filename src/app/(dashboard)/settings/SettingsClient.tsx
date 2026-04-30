'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountSecuritySettings } from '@/components/content/AccountSecuritySettings'
import { SocialConnections } from '@/components/settings/SocialConnections'
import { DigestPreferences } from '@/components/settings/DigestPreferences'
import { GDPRPanel } from '@/components/settings/GDPRPanel'
import { Panel, PanelHeader } from '@/components/ui/Card'
import {
  Shield, Bell, Share2, ShieldCheck,
} from 'lucide-react'

const TABS = [
  { key: 'account',       label: 'Account & Security',  icon: Shield },
  { key: 'notifications', label: 'Notifications',       icon: Bell },
  { key: 'social',        label: 'Social Connections',   icon: Share2 },
  { key: 'gdpr',          label: 'GDPR & Privacy',      icon: ShieldCheck },
] as const

type TabKey = typeof TABS[number]['key']

interface Props {
  initialDigestRecipient: string
  initialDigestEnabled: boolean
  initialDigestSendHour: number
  initialProcessInterval: number
}

export function SettingsClient({
  initialDigestRecipient,
  initialDigestEnabled,
  initialDigestSendHour,
  initialProcessInterval,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('account')

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="System" title="Settings" />

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <nav
          className="hidden lg:flex flex-col flex-shrink-0 rounded-xl border border-white/8 bg-nw-800/50 self-start sticky top-4"
          style={{ width: 220, padding: '8px' }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all text-left w-full ${
                activeTab === key
                  ? 'bg-[rgba(212,160,23,0.1)] text-gold-400 border border-[rgba(212,160,23,0.2)]'
                  : 'text-nw-400 hover:text-nw-200 hover:bg-white/[0.03] border border-transparent'
              }`}
              style={{ padding: '10px 12px' }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="flex lg:hidden gap-1 mb-2 overflow-x-auto no-scrollbar flex-shrink-0 -mx-4 px-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === key
                  ? 'bg-[rgba(212,160,23,0.12)] text-gold-400 border border-[rgba(212,160,23,0.2)]'
                  : 'text-nw-400 border border-white/8 hover:text-nw-200'
              }`}
              style={{ padding: '8px 12px' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'account' && <AccountSecuritySettings />}

          {activeTab === 'notifications' && (
            <Panel>
              <PanelHeader eyebrow="Automation" title="Digest & Notifications" />
              <div style={{ padding: 20 }}>
                <p className="text-xs font-medium text-nw-400 mb-4">
                  Configure your daily morning digest email — who receives it and whether it&apos;s enabled.
                </p>
                <DigestPreferences
                  initialRecipient={initialDigestRecipient}
                  initialEnabled={initialDigestEnabled}
                  initialSendHour={initialDigestSendHour}
                  initialProcessInterval={initialProcessInterval}
                />
              </div>
            </Panel>
          )}

          {activeTab === 'social' && (
            <Panel>
              <PanelHeader eyebrow="Integrations" title="Social Media Connections" />
              <div style={{ padding: 20 }}>
                <p className="text-xs font-medium text-nw-400 mb-4">
                  Connect Facebook, Instagram, and LinkedIn to publish branded posts directly from the Branding Studio.
                </p>
                <SocialConnections />
              </div>
            </Panel>
          )}

          {activeTab === 'gdpr' && (
            <Panel>
              <PanelHeader eyebrow="Compliance" title="GDPR & Data Requests" />
              <div style={{ padding: 20 }}>
                <p className="text-xs font-medium text-nw-400 mb-4">
                  Search, export, or delete all personal data held for a person. For Subject Access Requests and right to erasure.
                </p>
                <GDPRPanel />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
