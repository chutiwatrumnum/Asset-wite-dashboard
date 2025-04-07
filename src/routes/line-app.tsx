import { createFileRoute } from '@tanstack/react-router'
import LineApp from "@/pages/naver";

export const Route = createFileRoute('/line-app')({
  component: LineApp,
})
