import { ChatWidget } from '@/components/chat/ChatWidget'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  )
}
