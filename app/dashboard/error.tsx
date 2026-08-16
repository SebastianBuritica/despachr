'use client'

import { SectionError } from '@/components/layout/SectionError'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError error={error} reset={reset} section="la operación" />
}
