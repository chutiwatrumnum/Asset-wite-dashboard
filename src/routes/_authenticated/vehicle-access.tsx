// src/routes/_authenticated/vehicle-access.tsx
import Pb from "@/api/pocketbase";
import VehicleAccessPage from "@/pages/vehicle_access";
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff", "Project Super Admin"];

export const Route = createFileRoute("/_authenticated/vehicle-access")({
  beforeLoad: async () => {
     const currentRole = Pb.getCurrentRole();
     if (!accessRoleLst.includes(currentRole)) {
       console.log("Access denied - redirecting to Forbidden");
       throw redirect({ to: "/Forbidden", replace: true });
     }
  },
  component: VehicleAccessPage,
});
