// src/api/enhanced-pocketbase.tsx - แก้ไขปัญหา encryptStorage import
import PocketBase from "pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";

class EnhancedPocketBase extends PocketBase {
  private vmsConfig: any = null;
  private isExternalMode: boolean = false;

  constructor(baseUrl?: string) {
    super(baseUrl);
    this.checkAndRestoreVMSConfig();
  }

  // ✅ แก้ไข checkAndRestoreVMSConfig ให้ใช้ encryptStorage อย่างปลอดภัย
  private checkAndRestoreVMSConfig() {
    try {
      const vmsConfig = encryptStorage.getItem("vmsConfig");
      const externalAuth = encryptStorage.getItem("externalAuth");

      console.log("Checking VMS config:", { vmsConfig, externalAuth });

      if (vmsConfig && externalAuth) {
        console.log("Restoring VMS config...");
        this.switchToVMS(
          vmsConfig.vmsUrl,
          vmsConfig.vmsToken,
          vmsConfig.projectInfo
        );
      } else {
        console.log("No VMS config found, using default PocketBase");
      }
    } catch (error) {
      console.error("Error restoring VMS config:", error);
      // ถ้า error ให้ใช้ default mode
      this.switchToDefault();
    }
  }

  // switchToVMS ให้ใช้ encryptStorage อย่างปลอดภัย
  public switchToVMS(vmsUrl: string, vmsToken: string, projectInfo: any) {
    try {
      this.baseUrl = vmsUrl;
      this.vmsConfig = { vmsUrl, vmsToken, projectInfo };
      this.isExternalMode = true;

      // สร้าง mock user record สำหรับ authStore
      const mockUser = {
        id: `external-${projectInfo.myProjectId}`,
        email: `${projectInfo.roleName}@${projectInfo.projectName}.vms`,
        role: projectInfo.roleName,
        house_id: projectInfo.myProjectId,
        first_name: projectInfo.projectName || "External",
        last_name: "User",
        isExternal: true,
        collectionName: "external_users",
        collectionId: "external_collection",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        verified: true,
        emailVisibility: false,
        avatar: "",
        authorized_area: [],
      };

      // ใช้ save() แทนการตั้งค่าโดยตรง
      this.authStore.save(vmsToken, mockUser);

      // ตั้งค่า beforeSend สำหรับ VMS
      this.beforeSend = (url, options) => {
        if (this.isExternalMode && vmsToken) {
          options.headers = options.headers || {};
          options.headers["Authorization"] = vmsToken;
        }
        return { url, options };
      };

      // ✅ ใช้ encryptStorage อย่างปลอดภัย
      try {
        encryptStorage.setItem("vmsConfig", { vmsUrl, vmsToken, projectInfo });
      } catch (storageError) {
        console.warn(
          "Warning: Could not save VMS config to storage:",
          storageError
        );
      }

      console.log("✅ Switched to VMS mode:", vmsUrl);
      console.log("✅ Mock user saved to authStore:", mockUser);
      console.log("✅ AuthStore isValid:", this.authStore.isValid);
    } catch (error) {
      console.error("Error switching to VMS:", error);
      throw error;
    }
  }

  // กลับ default mode
  public switchToDefault() {
    try {
      this.baseUrl = import.meta.env.VITE_POCKETBASE_URL;
      this.vmsConfig = null;
      this.isExternalMode = false;

      // ล้าง beforeSend callback
      this.beforeSend = undefined;

      this.authStore.clear();

      // ✅ ใช้ encryptStorage อย่างปลอดภัย
      try {
        encryptStorage.removeItem("vmsConfig");
      } catch (storageError) {
        console.warn(
          "Warning: Could not clear VMS config from storage:",
          storageError
        );
      }

      console.log("✅ Switched to default PocketBase");
    } catch (error) {
      console.error("Error switching to default:", error);
    }
  }

  // Helper methods
  public isUsingVMS(): boolean {
    return this.isExternalMode;
  }

  public getVMSConfig() {
    return this.vmsConfig;
  }

  public getProjectInfo() {
    return this.vmsConfig?.projectInfo || null;
  }

  // ✅ ปรับปรุง getCurrentUser ให้ใช้ fallback ที่ปลอดภัย
  public getCurrentUser() {
    if (this.isExternalMode) {
      // ใช้ข้อมูลจาก authStore ที่เราสร้างไว้
      if (this.authStore.record) {
        return this.authStore.record;
      }

      // Fallback: ดึงจาก storage อย่างปลอดภัย
      try {
        const externalAuth = encryptStorage.getItem("externalAuth");
        const userRecord = encryptStorage.getItem("user");

        return {
          id: `external-${this.vmsConfig?.projectInfo?.myProjectId || "unknown"}`,
          email: this.vmsConfig?.projectInfo?.roleName + "@external.vms" || "",
          role:
            localStorage.getItem("role") ||
            this.vmsConfig?.projectInfo?.roleName ||
            "guest",
          first_name: this.vmsConfig?.projectInfo?.projectName || "External",
          last_name: "User",
          house_id: this.vmsConfig?.projectInfo?.myProjectId || "",
          isExternal: true,
          ...userRecord,
          ...externalAuth?.projectInfo,
        };
      } catch (storageError) {
        console.warn(
          "Warning: Could not access storage for user data:",
          storageError
        );

        // Ultimate fallback
        return {
          id: `external-${this.vmsConfig?.projectInfo?.myProjectId || "unknown"}`,
          email: this.vmsConfig?.projectInfo?.roleName + "@external.vms" || "",
          role: this.vmsConfig?.projectInfo?.roleName || "guest",
          first_name: this.vmsConfig?.projectInfo?.projectName || "External",
          last_name: "User",
          house_id: this.vmsConfig?.projectInfo?.myProjectId || "",
          isExternal: true,
        };
      }
    } else {
      // PocketBase user ปกติ
      return this.authStore.record;
    }
  }

  // getCurrentRole
  public getCurrentRole(): string {
    if (this.isExternalMode) {
      const role =
        this.authStore.record?.role ||
        localStorage.getItem("role") ||
        this.vmsConfig?.projectInfo?.roleName ||
        "guest";
      console.log("VMS Role:", role);
      return role;
    } else {
      const role = this.authStore.record?.role || "guest";
      console.log("PocketBase Role:", role);
      return role;
    }
  }

  // isLoggedIn
  public isLoggedIn(): boolean {
    if (this.isExternalMode) {
      const isLogged = localStorage.getItem("isLogged") === "true";
      const hasValidToken = !!this.authStore.token;
      const hasValidRecord = !!this.authStore.record;
      const authStoreValid = this.authStore.isValid;

      console.log("VMS Login Check:", {
        isLogged,
        hasValidToken,
        hasValidRecord,
        authStoreValid,
      });

      return isLogged && hasValidToken && hasValidRecord;
    } else {
      const isValid = this.authStore.isValid;
      console.log("PocketBase Login Status:", isValid);
      return isValid;
    }
  }

  // ✅ Override request method แทนการ override collection
  protected async request(url: string, options: any = {}) {
    if (this.isExternalMode && this.vmsConfig?.vmsToken) {
      options.headers = options.headers || {};
      options.headers["Authorization"] = this.vmsConfig.vmsToken;

      console.log("🔗 VMS Request:", {
        url: `${this.baseUrl}${url}`,
        method: options.method || "GET",
        hasAuth: !!options.headers["Authorization"],
        headers: options.headers,
      });
    }

    try {
      const result = await super.request(url, options);
      console.log("✅ Request successful");
      return result;
    } catch (error) {
      console.error("❌ Request failed:", error);
      throw error;
    }
  }

  // เพิ่ม method สำหรับ debug
  public debugAuth() {
    console.log("=== Enhanced Auth Debug Info ===");
    console.log("Is External Mode:", this.isExternalMode);
    console.log("Current User:", this.getCurrentUser());
    console.log("Current Role:", this.getCurrentRole());
    console.log("Is Logged In:", this.isLoggedIn());
    console.log("VMS Config:", this.vmsConfig);
    console.log("AuthStore Valid:", this.authStore.isValid);
    console.log("AuthStore Record:", this.authStore.record);
    console.log("AuthStore Token:", this.authStore.token);
    console.log("LocalStorage isLogged:", localStorage.getItem("isLogged"));
    console.log("LocalStorage role:", localStorage.getItem("role"));

    if (this.isExternalMode) {
      console.log("VMS Specific Debug:");
      console.log("- VMS URL:", this.baseUrl);
      console.log("- VMS Token exists:", !!this.vmsConfig?.vmsToken);
      console.log("- Project Info:", this.vmsConfig?.projectInfo);
    }

    console.log("=================================");
  }
}

// Export instance เดียวให้ทั้งระบบใช้
const Pb = new EnhancedPocketBase(import.meta.env.VITE_POCKETBASE_URL);

export default Pb;
