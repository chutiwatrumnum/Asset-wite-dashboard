import * as React from "react"
import Pb from "@/api/pocketbase.tsx";
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Frame, Map, PieChart,
  LayoutDashboard, LucideCalendar, LucideCar,
  LucideCctv, LucideFileClock,
  LucideUserRound, LucideHome, GlassesIcon
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

const data = {
  teams: [
    {
      name: "AiTAN Tech.",
      logo: LayoutDashboard,
      plan: "Visitor Management",
    },
    {
      name: "Acme Corp.",
      logo: LucideCctv,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "แดชบอร์ด",
      url: "#",
      icon: LucideHome,
      isActive: true,
    },
    {
      title: "เจ้าหน้าที่",
      url: "#",
      icon: GlassesIcon,
      isActive: true,
    },
    {
      title: "ลูกบ้าน",
      url: "#",
      icon: LucideUserRound,
    },
    {
      title: "นัดหมาย",
      url: "#",
      icon: LucideCalendar,
    },
    {
      title: "ยานพาหนะ",
      url: "#",
      icon: LucideCar,
      items: [
        {
          title: "ลูกบ้าน & เจ้าหน้าที่",
          url: "#",
        },
        {
          title: "บุคคลภายนอก",
          url: "#",
        },
      ],
    },
    {
      title: "ประวัติการเข้าออก",
      url: "#",
      icon: LucideFileClock,
      items: [
        {
          title: "การนัดหมาย",
          url: "#",
        },
        {
          title: "ยานพาหนะ",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authRecord = Pb.authStore.record!;
  const { first_name, last_name, email } = authRecord;
  console.log(Pb.files.getURL(authRecord, authRecord.avatar));
  const user = {
    name: first_name + " " + last_name,
    email: email,
    avatar: Pb.files.getURL(authRecord, authRecord.avatar),
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams}/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain}/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user}/>
      </SidebarFooter>
      <SidebarRail/>
    </Sidebar>
  )
}
