import type { Metadata } from 'next'
import { AuthPage } from './AuthPage'

export const metadata: Metadata = {
  title: 'Sign In - UFC Picks',
  description: 'Sign in to make your fight predictions',
}

export default function Page() {
  return <AuthPage />
}
