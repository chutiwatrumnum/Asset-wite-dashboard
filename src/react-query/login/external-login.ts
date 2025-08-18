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
                console.log('🔐 Logging into external system...');
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

                console.log('🔄 Switching to VMS PocketBase...');
                Pb.switchToVMS(vmsUrl, vmsToken, {
                    myProjectId,
                    projectName,
                    roleName
                });

                try {
                    console.log('🧪 Testing VMS connection...');
                    await Pb.collection('_').getList(1, 1);
                    console.log('✅ VMS connection successful');
                } catch (testError) {
                    console.warn('⚠️ VMS connection test failed, but continuing...', testError);
                }

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
            console.log("✅ External login successful:", data);

            localStorage.setItem("isLogged", "true");
            localStorage.setItem("loginMethod", "external");
            localStorage.setItem("role", data.projectInfo.roleName);

            encryptStorage.setItem("externalAuth", {
                accessToken: data.accessToken,
                vmsUrl: data.vmsUrl,
                vmsToken: data.vmsToken,
                projectInfo: data.projectInfo,
                loginTime: new Date().toISOString()
            });

            const userRecord = {
                id: "external-user",
                email: data.projectInfo.roleName + "@external.vms",
                first_name: data.projectInfo.projectName || "External",
                last_name: "User",
                role: data.projectInfo.roleName,
                house_id: data.projectInfo.myProjectId,
                isExternal: true,
                collectionName: "external_users",
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                verified: true,
                emailVisibility: false
            };

            encryptStorage.setItem("user", userRecord);
        },
        onError: (error) => {
            console.error("❌ External login error:", error);

            Pb.switchToDefault();
            localStorage.removeItem("isLogged");
            localStorage.removeItem("loginMethod");
            localStorage.removeItem("role");
            encryptStorage.removeItem("externalAuth");
            encryptStorage.removeItem("user");
        }
    });

    return mutation;
};