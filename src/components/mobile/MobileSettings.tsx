'use client'

import { MobileAppBar } from './MobileAppBar'

export function MobileSettings() {
  return (
    <div className="lg:hidden flex flex-col bg-[#0f0f0f] min-h-[100dvh]">
      <MobileAppBar title="Settings" showBack={false} />

      <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
        {/* Gym Profile */}
        <div className="mx-3 mt-3 bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a1a]">
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold mb-0.5">Gym Profile</p>
            <p className="text-[12px] text-[#888]">Name, address and contact details</p>
          </div>
          <a href="#gym-profile" className="flex items-center justify-between px-4 py-3.5 active:bg-[#1a1a1a]">
            <span className="text-[14px] text-white">Edit Profile</span>
            <span className="text-[#555]">›</span>
          </a>
        </div>

        {/* Integrations */}
        <div className="mx-3 mt-3 bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a1a]">
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Integrations</p>
          </div>
          {[
            { name: 'Gmail',      connected: true },
            { name: 'Xero',       connected: false },
            { name: 'Mailchimp',  connected: false },
            { name: 'Twilio',     connected: false },
          ].map((item, i, arr) => (
            <div key={item.name} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}>
              <span className="text-[14px] text-white">{item.name}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                item.connected
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-white/[0.05] text-white/30 border-white/[0.08]'
              }`}>
                {item.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          ))}
        </div>

        {/* Digest Preferences */}
        <div className="mx-3 mt-3 bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a1a]">
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Digest Preferences</p>
          </div>
          <a
            href="/settings#digest-preferences"
            className="flex items-center justify-between px-4 py-3.5 active:bg-[#1a1a1a]"
          >
            <span className="text-[14px] text-white">Morning Digest Settings</span>
            <span className="text-[#555]">›</span>
          </a>
        </div>

        {/* Account */}
        <div className="mx-3 mt-3 mb-6 bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a1a]">
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Account</p>
          </div>
          <a href="/settings" className="flex items-center justify-between px-4 py-3.5 border-b border-[#1a1a1a] active:bg-[#1a1a1a]">
            <span className="text-[14px] text-white">Security & Password</span>
            <span className="text-[#555]">›</span>
          </a>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full flex items-center px-4 py-3.5 active:bg-[#1a1a1a]">
              <span className="text-[14px] text-red-400">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
