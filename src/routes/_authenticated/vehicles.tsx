import Pb from "@/api/pocketbase";
import Vehicles from "@/pages/vehicle";
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff","Project Super Admin"];

export const Route = createFileRoute("/_authenticated/vehicles")({
  beforeLoad: async () => {
    // Debug auth info
    console.log("=== Vehicles Route Debug ===");
    Pb.debugAuth?.(); // เรียก debug method

    const currentRole = Pb.getCurrentRole();
    console.log("Checking access for role:", currentRole);
    console.log("Allowed roles:", accessRoleLst);

    if (!accessRoleLst.includes(currentRole)) {
      console.log("Access denied - redirecting to Forbidden");
      throw redirect({ to: "/Forbidden", replace: true });
    }

    console.log("Access granted");
  },
  component: Vehicles,
});
