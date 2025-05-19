import Saff from "@/pages/saff";
import { createFileRoute, redirect } from "@tanstack/react-router";
const accessRoleLst = ["master", "staff"];
export const Route = createFileRoute("/_authenticated/saff")({
    beforeLoad: async ({ context }) => {
        const { role } = context.authentication;
        if (!accessRoleLst.find((item) => item === role())) {
            throw redirect({ to: "/Forbidden", replace: true });
        }
    },
    component: Saff,
});
