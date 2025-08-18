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
  UserCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

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
      title: "ยานพาหนะภายนอก",
      url: "/external-vehicles",
      icon: UserCheck,
    },
    {
      title: "ระบบเข้าออกยานพาหนะ",
      url: "/vehicle-access",
      icon: Camera,
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
  const authRecord = Pb.getCurrentUser();
  if (!authRecord) {
    return null;
  }

  const { first_name, last_name, email } = authRecord;
  const user = {
    name: first_name + " " + last_name,
    email: email,
    avatar: authRecord.avatar
      ? Pb.files.getURL(authRecord, authRecord.avatar)
      : "",
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
