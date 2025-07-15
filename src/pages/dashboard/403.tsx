
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldAlert className="h-12 w-12 text-red-600" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">403 Forbidden</h1>

        <p className="text-lg text-muted-foreground">
          Sorry, you don't have permission to access this page. Please check your credentials or contact the
          administrator if you believe this is an error.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/" to={"/"}>Return Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact" to={""}>Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
