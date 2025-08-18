// src/routes/_authenticated.ts - แก้ไขการใช้ encryptStorage
import Pb from "@/api/pocketbase";
import { encryptStorage } from "@/utils/encryptStorage"; // ✅ เพิ่ม import
import Main from "@/pages/main";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: async () => {
        if (!Pb.isLoggedIn()) {
            throw redirect({ to: "/login", replace: true });
        }

        // ✅ Restore VMS config ถ้าจำเป็น อย่างปลอดภัย
        try {
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
        } catch (error) {
            console.warn("Warning: Could not restore VMS config:", error);
            // ไม่ต้อง throw error เพราะอาจทำให้ระบบ crash
        }
    },
    component: Main,
});