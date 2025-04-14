import ForbiddenPage from '@/pages/403'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Forbidden')({
  component: ForbiddenPage,
})

