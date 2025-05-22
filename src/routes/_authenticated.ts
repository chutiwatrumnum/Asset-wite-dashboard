import Pb from "@/api/pocketbase";
import Main from "@/pages/main";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: async () => {
        if (!Pb.authStore.token) {
            throw redirect({ to: "/login", replace: true });
        }
    },
    component: Main,
});
