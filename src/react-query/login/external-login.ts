// src/react-query/login/external-login.ts - แก้ไขปัญหา encryptStorage
import { useMutation } from "@tanstack/react-query";
import { encryptStorage } from "@/utils/encryptStorage";
import { externalLogin, getProjectConfig, ExternalLoginRequest } from "@/api/external-auth/external-auth";
import Pb from "@/api/pocketbase";

export interface ExternalAuthResponse {
    accessToken: string;
    vmsUrl: string;
    vmsToken: string;
    projectInfo: {
        myProjectId: string;
        projectName: string;
        roleName: string;
    };
}

export const useExternalLoginMutation = () => {
    const mutation = useMutation<ExternalAuthResponse, Error, ExternalLoginRequest>({
        mutationFn: async (authReq: ExternalLoginRequest) => {
            try {
                console.log('🔐 Starting external login...');
                const loginResponse = await externalLogin(authReq);

                if (!loginResponse.access_token) {
                    throw new Error('No access token received from external system');
                }

                console.log('📁 Getting project configuration...');
                const projectResponse = await getProjectConfig(loginResponse.access_token);

                if (!projectResponse.data?.vmsUrl || !projectResponse.data?.vmsToken) {
                    throw new Error('Invalid project configuration received');
                }

                const { vmsUrl, vmsToken, myProjectId, projectName, roleName } = projectResponse.data;

                console.log('🔄 Configuring VMS PocketBase...');
                console.log('VMS Data:', { vmsUrl, myProjectId, projectName, roleName });

                return {
                    accessToken: loginResponse.access_token,
                    vmsUrl,
                    vmsToken,
                    projectInfo: {
                        myProjectId,
                        projectName,
                        roleName
                    }
                };

            } catch (error) {
                console.error('❌ External login failed:', error);
                throw error;
            }
        },
        onSuccess: (data) => {
            console.log("=== External Login Success ===");
            console.log("Full response:", data);

            try {
                // ✅ ตั้งค่า localStorage ก่อน
                localStorage.setItem("isLogged", "true");
                localStorage.setItem("loginMethod", "external");
                localStorage.setItem("role", data.projectInfo.roleName || "guest");

                console.log("✅ LocalStorage set:", {
                    isLogged: localStorage.getItem("isLogged"),
                    loginMethod: localStorage.getItem("loginMethod"),
                    role: localStorage.getItem("role"),
                });

                // ✅ เก็บข้อมูล external auth อย่างปลอดภัย
                try {
                    encryptStorage.setItem("externalAuth", {
                        accessToken: data.accessToken,
                        vmsUrl: data.vmsUrl,
                        vmsToken: data.vmsToken,
                        projectInfo: data.projectInfo,
                        loginTime: new Date().toISOString()
                    });
                    console.log("✅ External auth saved to encrypted storage");
                } catch (storageError) {
                    console.warn("⚠️ Could not save to encrypted storage:", storageError);
                    // ไม่ต้อง throw error เพราะยังสามารถทำงานได้
                }

                // ✅ สร้าง complete user record
                const userRecord = {
                    id: `external-${data.projectInfo.myProjectId}`,
                    email: `${data.projectInfo.roleName}@${data.projectInfo.projectName}.vms`,
                    first_name: data.projectInfo.projectName || "External",
                    last_name: "User",
                    role: data.projectInfo.roleName,
                    house_id: data.projectInfo.myProjectId,
                    authorized_area: [],
                    isExternal: true,
                    collectionName: "external_users",
                    collectionId: "external_collection",
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    verified: true,
                    emailVisibility: false,
                    avatar: "",
                    projectInfo: data.projectInfo
                };

                try {
                    encryptStorage.setItem("user", userRecord);
                    console.log("✅ User record saved to encrypted storage");
                } catch (storageError) {
                    console.warn("⚠️ Could not save user record:", storageError);
                }

                console.log("✅ User record created:", userRecord);

                // ✅ สลับไป VMS mode หลังจากตั้งค่าเสร็จ
                try {
                    Pb.switchToVMS(data.vmsUrl, data.vmsToken, data.projectInfo);

                    // ✅ ทดสอบการทำงานของ auth system
                    console.log("=== Testing Auth System ===");
                    console.log("getCurrentUser():", Pb.getCurrentUser());
                    console.log("getCurrentRole():", Pb.getCurrentRole());
                    console.log("isLoggedIn():", Pb.isLoggedIn());
                    console.log("authStore.isValid:", Pb.authStore.isValid);
                    console.log("authStore.record:", Pb.authStore.record);
                    console.log("authStore.token:", Pb.authStore.token);

                    // ✅ ทดสอบการเชื่อมต่อ VMS (optional)
                    setTimeout(async () => {
                        try {
                            console.log('🧪 Testing VMS connection...');
                            await Pb.collection('_').getList(1, 1);
                            console.log('✅ VMS connection test successful');
                        } catch (testError) {
                            console.warn('⚠️ VMS connection test failed:', testError);
                        }
                    }, 100);

                } catch (switchError) {
                    console.error("❌ Error switching to VMS:", switchError);
                    throw switchError;
                }

                console.log("✅ External login setup complete");

            } catch (error) {
                console.error("❌ Error in onSuccess handler:", error);
                // ล้างข้อมูลทั้งหมดเมื่อ error
                this.onError(error as Error);
                throw error;
            }
        },
        onError: (error) => {
            console.error("❌ External login error:", error);

            // ✅ ล้างข้อมูลทั้งหมดเมื่อ error อย่างปลอดภัย
            try {
                Pb.switchToDefault();
            } catch (switchError) {
                console.error("Error switching back to default:", switchError);
            }

            // ล้าง localStorage
            localStorage.removeItem("isLogged");
            localStorage.removeItem("loginMethod");
            localStorage.removeItem("role");

            // ล้าง encryptStorage อย่างปลอดภัย
            try {
                encryptStorage.removeItem("externalAuth");
                encryptStorage.removeItem("user");
                encryptStorage.removeItem("vmsConfig");
            } catch (storageError) {
                console.warn("Warning: Could not clear encrypted storage:", storageError);
            }
        }
    });

    return mutation;
};