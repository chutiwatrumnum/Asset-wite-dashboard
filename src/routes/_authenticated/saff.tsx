import Pb from "@/api/pocketbase";
import Saff from "@/pages/saff";
import { createFileRoute, redirect } from "@tanstack/react-router";
const accessRoleLst = ["master", "staff", "Project Super Admin"];
export const Route = createFileRoute("/_authenticated/saff")({
    beforeLoad: async () => {
         const currentRole = Pb.getCurrentRole();
         if (!accessRoleLst.includes(currentRole)) {
           console.log("Access denied - redirecting to Forbidden");
           throw redirect({ to: "/Forbidden", replace: true });
         }
    },
    component: Saff,
});
