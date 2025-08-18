// src/routes/_authenticated/external-vehicles.tsx
import Pb from "@/api/pocketbase";
import ExternalVehicles from "@/pages/external_vehicle";
import { createFileRoute, redirect } from "@tanstack/react-router";


const accessRoleLst = ["master", "staff", "Project Super Admin"];
export const Route = createFileRoute("/_authenticated/external-vehicles")({
  beforeLoad: async () => {
     const currentRole = Pb.getCurrentRole();
     if (!accessRoleLst.includes(currentRole)) {
       console.log("Access denied - redirecting to Forbidden");
       throw redirect({ to: "/Forbidden", replace: true });
     }
  },
  component: ExternalVehicles,
});
