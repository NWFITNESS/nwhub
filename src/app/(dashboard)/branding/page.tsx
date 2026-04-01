import { Suspense } from 'react'
import { PostStudio } from '@/components/branding/PostStudio'

export default function PostStudioPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-white/30">Loading Post Studio...</div>
        </div>
      }>
        <PostStudio />
      </Suspense>
    </div>
  )
}
