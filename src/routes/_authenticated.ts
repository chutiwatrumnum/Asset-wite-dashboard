// src/routes/_authenticated.ts - แก้ไขการใช้ encryptStorage
import Pb from "@/api/pocketbase";
import { encryptStorage } from "@/utils/encryptStorage"; // ✅ เพิ่ม import
import Main from "@/pages/main";
import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated")({
    beforeLoad: async () => {
        console.log("🔒 Checking authentication...");

        // ✅ ตรวจสอบการล็อกอินหลายครั้งเพื่อให้แน่ใจ
        let retryCount = 0;
        const maxRetries = 5;

        while (retryCount < maxRetries) {
            const isLoggedIn = Pb.isLoggedIn();
            const currentUser = Pb.getCurrentUser();

            console.log(`Auth check attempt ${retryCount + 1}:`, {
                isLoggedIn,
                hasUser: !!currentUser,
                userId: currentUser?.id,
                userRole: currentUser?.role,
            });

            if (isLoggedIn && currentUser) {
                console.log("✅ Authentication verified");

                // ✅ Restore VMS config ถ้าจำเป็น อย่างปลอดภัย
                try {
                    if (localStorage.getItem("loginMethod") === "external") {
                        if (!Pb.isUsingVMS()) {
                            console.log("🔄 Restoring VMS mode...");
                            const externalAuth = encryptStorage.getItem("externalAuth");
                            if (externalAuth) {
                                Pb.switchToVMS(
                                    externalAuth.vmsUrl,
                                    externalAuth.vmsToken,
                                    externalAuth.projectInfo
                                );
                                console.log("✅ VMS mode restored");
                            }
                        }
                    }
                } catch (error) {
                    console.warn("Warning: Could not restore VMS config:", error);
                    // ไม่ต้อง throw error เพราะอาจทำให้ระบบ crash
                }

                return; // ผ่านการตรวจสอบแล้ว
            }

            // ✅ รอนิดหนึ่งก่อนลองใหม่
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
        }

        // ✅ หากลองหลายครั้งแล้วยังไม่ได้ ให้ redirect ไป login
        console.warn("❌ Authentication failed after retries, redirecting to login");
        throw redirect({ to: "/login", replace: true });
    },
    component: Main,
});