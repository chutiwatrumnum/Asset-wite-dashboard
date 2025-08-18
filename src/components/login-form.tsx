// src/react-query/login/external-login.ts (Updated with roleName)
import { useMutation } from "@tanstack/react-query";
import { encryptStorage } from "@/utils/encryptStorage";
import {
  externalLogin,
  getProjectConfig,
  ExternalLoginRequest,
} from "@/api/external-auth/external-auth";
import DynamicPocketBase from "@/api/dynamic-pocketbase";

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
  const mutation = useMutation<
    ExternalAuthResponse,
    Error,
    ExternalLoginRequest
  >({
    mutationFn: async (authReq: ExternalLoginRequest) => {
      try {
        // Step 1: Login ที่ระบบแรก
        console.log("🔐 Logging into external system...");
        const loginResponse = await externalLogin(authReq);

        if (!loginResponse.access_token) {
          throw new Error("No access token received from external system");
        }

        // Step 2: ดึง project config
        console.log("📁 Getting project configuration...");
        const projectResponse = await getProjectConfig(
          loginResponse.access_token
        );

        if (!projectResponse.data?.vmsUrl || !projectResponse.data?.vmsToken) {
          throw new Error("Invalid project configuration received");
        }

        const { vmsUrl, vmsToken, myProjectId, projectName, roleName } =
          projectResponse.data;

        // Step 3: สลับ PocketBase ไปใช้ VMS
        console.log("🔄 Switching to VMS PocketBase...");
        DynamicPocketBase.switchToVMS(vmsUrl, vmsToken, {
          projectInfo: {
            myProjectId,
            projectName,
            roleName,
          },
          externalToken: loginResponse.access_token,
        });

        // Step 4: Test VMS connection
        try {
          console.log("🧪 Testing VMS connection...");
          const pb = DynamicPocketBase.getPb();

          // ทดสอบเรียก API ด้วย VMS token
          await pb.collection("_").getList(1, 1);
          console.log("✅ VMS connection successful");
        } catch (testError) {
          console.warn(
            "⚠️ VMS connection test failed, but continuing...",
            testError
          );
        }

        return {
          accessToken: loginResponse.access_token,
          vmsUrl,
          vmsToken,
          projectInfo: {
            myProjectId,
            projectName,
            roleName,
          },
        };
      } catch (error) {
        console.error("❌ External login failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ External login successful:", data);

      // เก็บข้อมูลการ login
      localStorage.setItem("isLogged", "true");
      localStorage.setItem("loginMethod", "external");
      localStorage.setItem("role", data.projectInfo.roleName); // ใช้ roleName จาก external

      encryptStorage.setItem("externalAuth", {
        accessToken: data.accessToken,
        vmsUrl: data.vmsUrl,
        vmsToken: data.vmsToken,
        projectInfo: data.projectInfo,
        loginTime: new Date().toISOString(),
      });

      // สร้าง user object โดยใช้ roleName จาก external
      const userObject = {
        id: "external-user",
        email: data.projectInfo.roleName + "@external.com",
        first_name: data.projectInfo.projectName || "External",
        last_name: "User",
        role: data.projectInfo.roleName, // ใช้ roleName จาก external
        house_id: data.projectInfo.myProjectId,
        avatar: "",
        collectionName: "external_users",
        // เพิ่มข้อมูล project
        project_id: data.projectInfo.myProjectId,
        project_name: data.projectInfo.projectName,
        authorized_area: [], // อาจต้องดึงจาก API อื่น
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        verified: true,
        emailVisibility: false,
      };

      encryptStorage.setItem("user", userObject);
    },
    onError: (error) => {
      console.error("❌ External login error:", error);

      // ล้างข้อมูลที่อาจเหลือค้าง
      DynamicPocketBase.clearVMSConfig();
      localStorage.removeItem("isLogged");
      localStorage.removeItem("loginMethod");
      localStorage.removeItem("role");
      encryptStorage.removeItem("externalAuth");
      encryptStorage.removeItem("user");
    },
  });

  return mutation;
};
