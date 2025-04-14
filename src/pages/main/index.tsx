import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Sheet } from "@/components/ui/sheet.tsx";
import { Outlet, useLocation } from "@tanstack/react-router";

export default function Main() {
  const location = useLocation();
  return (
    <SidebarProvider>
      <AppSidebar/>
      <Sheet>
        <SidebarInset>
          <header
            className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1"/>
              <Separator orientation="vertical" className="mr-2 h-2"/>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                     {location.pathname}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block"/>
                  {/*<BreadcrumbItem>*/}
                  {/*  <BreadcrumbPage>Data Fetching</BreadcrumbPage>*/}
                  {/*</BreadcrumbItem>*/}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col select-none gap-4 p-4 pt-0">
          <Outlet />
            {/* <DataTable/> */}
          </div>
        </SidebarInset>
      </Sheet>

    </SidebarProvider>
  )
}
