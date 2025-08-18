// src/routes/_authenticated.ts (External Only)
import DynamicPocketBase from "@/api/dynamic-pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";
import Main from "@/pages/main";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: async () => {
        // ตรวจสอบ External Auth เท่านั้น
        const externalAuth = encryptStorage.getItem("externalAuth");
        const isLogged = localStorage.getItem("isLogged");

        if (!isLogged || !externalAuth?.vmsToken) {
            throw redirect({ to: "/login", replace: true });
        }

        // Restore VMS configuration
        try {
            DynamicPocketBase.switchToVMS(
                externalAuth.vmsUrl,
                externalAuth.vmsToken,
                externalAuth.projectInfo
            );
            console.log('🔄 VMS configuration restored');
        } catch (error) {
            console.error('❌ Failed to restore VMS configuration:', error);
            throw redirect({ to: "/login", replace: true });
        }
    },
    component: Main,
});