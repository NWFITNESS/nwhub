import { redirect } from 'next/navigation'

export default function NewBlogRedirectPage() {
  redirect('/blog/manage/new')
}
