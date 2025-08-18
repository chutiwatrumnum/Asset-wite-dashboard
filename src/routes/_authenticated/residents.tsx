// src/routes/_authenticated/residents.tsx
import Pb from "@/api/pocketbase";
import Residents from "@/pages/residents";
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff", "Project Super Admin"];

export const Route = createFileRoute("/_authenticated/residents")({
  beforeLoad: async () => {
      const currentRole = Pb.getCurrentRole();
      if (!accessRoleLst.includes(currentRole)) {
        console.log("Access denied - redirecting to Forbidden");
        throw redirect({ to: "/Forbidden", replace: true });
      }
  },
  component: Residents,
});
