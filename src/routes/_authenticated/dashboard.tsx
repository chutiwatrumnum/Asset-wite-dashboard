import dashboardPage from '@/pages/dashboard'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/dashboard')({

  component: dashboardPage,
})

