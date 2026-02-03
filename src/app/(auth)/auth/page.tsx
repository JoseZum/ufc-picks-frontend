import type { Metadata } from 'next'
import { LoginPageV2 } from '@/components/design-system-v2/pages/LoginPageV2'

export const metadata: Metadata = {
  title: 'Sign In - UFC Picks',
  description: 'Sign in to make your fight predictions',
}

export default function Page() {
  return <LoginPageV2 />
}
