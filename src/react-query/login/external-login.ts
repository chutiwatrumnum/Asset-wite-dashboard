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
      onSuccess: async (data) => {
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
    }

    // ✅ สลับไป VMS mode ก่อน (ไม่สร้าง mock user)
    try {
      Pb.switchToVMS(data.vmsUrl, data.vmsToken, data.projectInfo);
      console.log("✅ Switched to VMS mode");
    } catch (switchError) {
      console.error("❌ Error switching to VMS:", switchError);
      throw switchError;
    }

    // ✅ ดึงข้อมูล user จริงจาก VMS API (เปลี่ยนเป็น await)
    const userRecord = await fetchUserData();
    
    if (userRecord) {
      console.log("🎉 External login complete with real data");
      console.log("Final house_id:", userRecord.house_id);
      
      // ✅ ตั้งค่า authStore ด้วยข้อมูลจริง
      Pb.authStore.save(data.vmsToken, userRecord);
      
      console.log("✅ Auth setup complete, ready for redirect");
    } else {
      console.warn("⚠️ Could not fetch user data, using minimal setup");
      
      // ✅ หากไม่ได้ข้อมูล user ให้สร้างข้อมูลขั้นต่ำสำหรับ login
      const minimalUser = {
        id: `external-user`,
        email: `${data.projectInfo.roleName}@vms.local`,
        role: data.projectInfo.roleName,
        first_name: data.projectInfo.projectName || "VMS",
        last_name: "User",
        house_id: "", // ✅ เว้นว่างไว้หากไม่มีข้อมูล
        isExternal: true,
        projectInfo: data.projectInfo,
      };
      
      Pb.authStore.save(data.vmsToken, minimalUser);
      console.log("✅ Minimal auth setup complete");
    }

    console.log("✅ External login setup complete");

    // ✅ ฟังก์ชันดึงข้อมูล user จริง (ย้ายมาเป็น async function)
    async function fetchUserData() {
      try {
        console.log("🔍 Fetching real user data from VMS...");
        
        // ✅ เรียก API เพื่อดึงข้อมูล user จริง
        const userResponse = await fetch(`${data.vmsUrl}/api/collections/admin/records`, {
          method: 'GET',
          headers: {
            'Authorization': data.vmsToken,
            'Accept': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("📋 User data from VMS:", userData);

          // ✅ หาข้อมูล user ที่ตรงกับ role ปัจจุบัน
          let currentUserRecord = null;
          
          if (userData.items && userData.items.length > 0) {
            // ลองหา user ที่มี role ตรงกัน
            currentUserRecord = userData.items.find((user: any) => 
              user.role === data.projectInfo.roleName
            ) || userData.items[0]; // ถ้าไม่เจอให้ใช้คนแรก
          }

          if (currentUserRecord) {
            console.log("✅ Found user record:", currentUserRecord);

            // ✅ บันทึกข้อมูล user จริง
            const realUserRecord = {
              ...currentUserRecord,
              isExternal: true,
              projectInfo: data.projectInfo,
              vmsUrl: data.vmsUrl,
              vmsToken: data.vmsToken,
            };

            // ✅ บันทึกลง storage
            try {
              encryptStorage.setItem("user", realUserRecord);
              console.log("✅ Real user record saved");
            } catch (storageError) {
              console.warn("⚠️ Could not save user record:", storageError);
            }

            console.log("✅ Real user data setup complete");
            console.log("House ID:", realUserRecord.house_id);
            
            return realUserRecord;
          } else {
            console.warn("⚠️ No user record found in VMS response");
          }
        } else {
          console.warn("⚠️ Failed to fetch user data from VMS:", userResponse.status);
        }
      } catch (fetchError) {
        console.error("❌ Error fetching user data:", fetchError);
      }

      return null;
    }

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