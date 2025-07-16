// src/components/app-sidebar.tsx (อัปเดต - เพิ่มเมนู vehicle-access)
import * as React from "react";
import Pb from "@/api/pocketbase.tsx";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Frame,
  Map,
  PieChart,
  LayoutDashboard,
  LucideCalendar,
  LucideCar,
  LucideCctv,
  LucideFileClock,
  LucideUserRound,
  LucideHome,
  GlassesIcon,
  Camera,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { encryptStorage } from "@/utils/encryptStorage";

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
      url: "/dashboard",
      icon: LucideHome,
      isActive: true,
    },
    {
      title: "เจ้าหน้าที่",
      url: "/saff",
      icon: GlassesIcon,
      isActive: true,
    },
    {
      title: "ลูกบ้าน",
      url: "/residents",
      icon: LucideUserRound,
    },
    {
      title: "บัตรเชิญ (E-invitation)",
      url: "/invitations",
      icon: LucideCalendar,
    },
    {
      title: "จัดการยานพาหนะ",
      url: "/vehicles",
      icon: LucideCar,
    },
    {
      title: "ระบบเข้าออกยานพาหนะ",
      url: "/vehicle-access",
      icon: Camera,
    },
    {
      title: "ประวัติการเข้าออก",
      url: "/history-in-out",
      icon: LucideFileClock,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/design-engineering",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "/sales-marketing",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "/travel",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authRecord = encryptStorage.getItem("user");
  if (!authRecord) {
    return;
  }
  const { first_name, last_name, email } = authRecord;
  const user = {
    name: first_name + " " + last_name,
    email: email,
    avatar: Pb.files.getURL(authRecord, authRecord.avatar),
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
