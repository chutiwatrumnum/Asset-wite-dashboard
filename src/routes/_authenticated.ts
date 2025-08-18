import Pb from "@/api/pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";
import Main from "@/pages/main";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: async () => {
        if (!Pb.isLoggedIn()) {
            throw redirect({ to: "/login", replace: true });
        }

        // Restore VMS config ถ้าจำเป็น
        if (localStorage.getItem("loginMethod") === "external") {
            const externalAuth = encryptStorage.getItem("externalAuth");
            if (externalAuth) {
                Pb.switchToVMS(
                    externalAuth.vmsUrl,
                    externalAuth.vmsToken,
                    externalAuth.projectInfo
                );
            }
        }
    },
    component: Main,
});