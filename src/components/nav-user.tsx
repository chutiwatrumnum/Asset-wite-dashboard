// src/components/nav-user.tsx (External Only)
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Settings2,
  LogOut,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import DynamicPocketBase from "@/api/dynamic-pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const vmsConfig = DynamicPocketBase.getVMSConfig();

  const handleLogout = async () => {
    try {
      // ล้างข้อมูล External login
      DynamicPocketBase.clearVMSConfig();
      encryptStorage.removeItem("externalAuth");
      localStorage.removeItem("loginMethod");
      localStorage.removeItem("isLogged");
      localStorage.removeItem("role");
      encryptStorage.removeItem("user");

      await navigate({ to: "/login", replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs">{user.email}</span>
                  <Badge variant="outline" className="text-xs h-4">
                    <Globe className="h-2 w-2 mr-1" />
                    VMS
                  </Badge>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs">{user.email}</span>
                    <Badge variant="outline" className="text-xs h-4">
                      <Globe className="h-2 w-2 mr-1" />
                      VMS
                    </Badge>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* แสดงข้อมูล VMS */}
            {vmsConfig && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    <Globe className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        Project:{" "}
                        {vmsConfig.projectInfo?.projectName || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Role: {vmsConfig.projectInfo?.roleName || "Unknown"}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
