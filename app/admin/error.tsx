'use client'

import { SectionError } from '@/components/layout/SectionError'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError error={error} reset={reset} section="esta vista" />
}
