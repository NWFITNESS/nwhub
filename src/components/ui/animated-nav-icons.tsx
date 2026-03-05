"use client";

import { motion } from "framer-motion";

interface NavIconProps {
  size?: number;
  className?: string;
}

const ease = [0.32, 0.72, 0, 1] as const;

/* ─── DASHBOARD ── 4 squares scale inward with stagger */
export function DashboardNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      {([
        { x: 3, y: 3, delay: 0 },
        { x: 14, y: 3, delay: 0.05 },
        { x: 3, y: 14, delay: 0.1 },
        { x: 14, y: 14, delay: 0.15 },
      ] as const).map(({ x, y, delay }, i) => (
        <motion.rect
          key={i} x={x} y={y} width={7} height={7} rx={1}
          stroke="currentColor" strokeWidth={1.75}
          variants={{ idle: { scale: 1, opacity: 1 }, hovered: { scale: 0.78, opacity: 0.7 } }}
          transition={{ duration: 0.25, ease, delay }}
          style={{ transformOrigin: `${x + 3.5}px ${y + 3.5}px` }}
        />
      ))}
    </motion.svg>
  );
}

/* ─── FILE TEXT ── page lifts on hover */
export function FileNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <motion.g variants={{ idle: { y: 0 }, hovered: { y: -1.5 } }} transition={{ duration: 0.3, ease }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
        <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}

/* ─── PEN SQUARE ── pen rotates on hover */
export function PenNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        variants={{ idle: { rotate: 0 }, hovered: { rotate: -15 } }}
        transition={{ duration: 0.3, ease }}
        style={{ transformOrigin: "19px 3px" }}
      />
    </motion.svg>
  );
}

/* ─── IMAGE ── mountain rises, sun pulses */
export function ImageNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.75} />
      <motion.g variants={{ idle: { y: 0 }, hovered: { y: -1.5 } }} transition={{ duration: 0.3, ease }}>
        <polyline points="3 15 8 10 13 14 16 11 21 15"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      <motion.circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"
        variants={{ idle: { scale: 1 }, hovered: { scale: 1.5 } }}
        transition={{ duration: 0.25, ease }}
        style={{ transformOrigin: "8.5px 8.5px" }}
      />
    </motion.svg>
  );
}

/* ─── MAIL ── chevron lifts like envelope flap opening */
export function MailNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth={1.75} />
      <motion.polyline points="2 7 12 13 22 7"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        variants={{ idle: { y: 0 }, hovered: { y: -2.5 } }}
        transition={{ duration: 0.3, ease }}
      />
    </motion.svg>
  );
}

/* ─── MESSAGE CIRCLE ── bubble bounces with spring */
export function ChatNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <motion.path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        variants={{ idle: { scale: 1 }, hovered: { scale: 1.1 } }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ transformOrigin: "12px 11px" }}
      />
    </motion.svg>
  );
}

/* ─── USERS ── second person slides in from right */
export function UsersNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.75} />
      <motion.path d="M23 21v-2a4 4 0 00-3-3.87"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        variants={{ idle: { x: 4, opacity: 0 }, hovered: { x: 0, opacity: 1 } }}
        transition={{ duration: 0.3, ease }}
      />
      <motion.path d="M16 3.13a4 4 0 010 7.75"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        variants={{ idle: { x: 4, opacity: 0 }, hovered: { x: 0, opacity: 1 } }}
        transition={{ duration: 0.3, ease, delay: 0.05 }}
      />
    </motion.svg>
  );
}

/* ─── BABY ── gentle bounce */
export function BabyNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <motion.g
        variants={{ idle: { y: 0 }, hovered: { y: [-2, 1.5, -1, 0] } }}
        transition={{ duration: 0.5, ease }}>
        <circle cx="12" cy="6" r="3.5" stroke="currentColor" strokeWidth={1.75} />
        <path d="M5 21c0-3.87 3.13-7 7-7s7 3.13 7 7"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}

/* ─── STAR ── fills with scale bounce on hover */
export function StarNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <motion.path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        fill="currentColor"
        variants={{ idle: { fillOpacity: 0, scale: 1 }, hovered: { fillOpacity: 1, scale: 1.15 } }}
        transition={{ duration: 0.25, ease }}
        style={{ transformOrigin: "12px 12px" }}
      />
    </motion.svg>
  );
}

/* ─── SETTINGS ── gear rotates 90deg on hover */
export function SettingsNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <motion.g
        variants={{ idle: { rotate: 0 }, hovered: { rotate: 90 } }}
        transition={{ duration: 0.5, ease }}
        style={{ transformOrigin: "12px 12px" }}>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.75} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </motion.svg>
  );
}

/* ─── LOG OUT ── arrow slides right on hover */
export function LogOutNavIcon({ size = 17, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.g
        variants={{ idle: { x: 0 }, hovered: { x: 3 } }}
        transition={{ duration: 0.3, ease }}>
        <polyline points="16 17 21 12 16 7"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12"
          stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}

/* ─── PANEL LEFT CLOSE ── chevron slides left on hover */
export function PanelCloseNavIcon({ size = 15, className }: NavIconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" className={className}
      style={{ width: size, height: size }} whileHover="hovered" initial="idle" animate="idle">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.75} />
      <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth={1.75} />
      <motion.polyline points="15 9 12 12 15 15"
        stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        variants={{ idle: { x: 0 }, hovered: { x: -2 } }}
        transition={{ duration: 0.3, ease }}
      />
    </motion.svg>
  );
}
