// ===== วิธีที่ดีที่สุด: Transparent Wrapper =====

// src/api/enhanced-pocketbase.tsx
import PocketBase from "pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";

class EnhancedPocketBase extends PocketBase {
  private vmsConfig: any = null;
  private isExternalMode: boolean = false;

  constructor(baseUrl?: string) {
    super(baseUrl);
    this.checkAndRestoreVMSConfig();
  }

  // ตรวจสอบและเรียกคืน VMS config
  private checkAndRestoreVMSConfig() {
    const vmsConfig = encryptStorage.getItem("vmsConfig");
    const externalAuth = encryptStorage.getItem("externalAuth");

    if (vmsConfig && externalAuth) {
      this.switchToVMS(
        vmsConfig.vmsUrl,
        vmsConfig.vmsToken,
        externalAuth.projectInfo
      );
    }
  }

  // สลับไป VMS mode
  // ลบ beforeSend ออกหมด และใช้แค่ authStore.save
  public switchToVMS(vmsUrl: string, vmsToken: string, projectInfo: any) {
    this.baseUrl = vmsUrl;
    this.vmsConfig = { vmsUrl, vmsToken, projectInfo };
    this.isExternalMode = true;

    // ✅ ใช้แค่ authStore.save (ไม่ต้อง beforeSend)
    this.authStore.save(vmsToken, null);

    encryptStorage.setItem("vmsConfig", { vmsUrl, vmsToken, projectInfo });
    console.log("✅ Switched to VMS mode:", vmsUrl);
  }

  // กลับ default mode
  public switchToDefault() {
    this.baseUrl = import.meta.env.VITE_POCKETBASE_URL;
    this.vmsConfig = null;
    this.isExternalMode = false;
    this.authStore.clear();
    encryptStorage.removeItem("vmsConfig");
    console.log("✅ Switched to default PocketBase");
  }

  // Override beforeSend เพื่อใส่ VMS token

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

  // Helper สำหรับเข้าถึงข้อมูล user
  public getCurrentUser() {
    if (this.isExternalMode) {
      // ดึงข้อมูลจาก external auth
      const externalAuth = encryptStorage.getItem("externalAuth");
      const userRecord = encryptStorage.getItem("user");

      return {
        id: "external-user",
        email: externalAuth?.projectInfo?.roleName + "@external.vms" || "",
        role: localStorage.getItem("role") || "guest",
        first_name: externalAuth?.projectInfo?.projectName || "External",
        last_name: "User",
        house_id: externalAuth?.projectInfo?.myProjectId || "",
        isExternal: true,
        ...userRecord,
        ...externalAuth?.projectInfo,
      };
    } else {
      // PocketBase user ปกติ
      return this.authStore.record;
    }
  }

  // Helper สำหรับตรวจสอบ role
  public getCurrentRole(): string {
    if (this.isExternalMode) {
      // ลำดับการตรวจสอบ role สำหรับ VMS
      const role =
        localStorage.getItem("role") ||
        this.vmsConfig?.projectInfo?.roleName ||
        "guest";
      console.log("VMS Role:", role);
      return role;
    } else {
      // PocketBase ปกติ
      const role = this.authStore.record?.role || "guest";
      console.log("PocketBase Role:", role);
      return role;
    }
  }
  // Helper สำหรับตรวจสอบการ login
  public isLoggedIn(): boolean {
    if (this.isExternalMode) {
      const isLogged = localStorage.getItem("isLogged") === "true";
      console.log("VMS Login Status:", isLogged);
      return isLogged;
    } else {
      const isValid = this.authStore.isValid;
      console.log("PocketBase Login Status:", isValid);
      return isValid;
    }
  }

  // เพิ่ม method สำหรับ debug
  public debugAuth() {
    console.log("=== Auth Debug Info ===");
    console.log("Is External Mode:", this.isExternalMode);
    console.log("Current User:", this.getCurrentUser());
    console.log("Current Role:", this.getCurrentRole());
    console.log("Is Logged In:", this.isLoggedIn());
    console.log("VMS Config:", this.vmsConfig);
    console.log("AuthStore Valid:", this.authStore.isValid);
    console.log("AuthStore Record:", this.authStore.record);
    console.log("LocalStorage isLogged:", localStorage.getItem("isLogged"));
    console.log("LocalStorage role:", localStorage.getItem("role"));
    console.log("======================");
  }
}

// Export instance เดียวให้ทั้งระบบใช้
const Pb = new EnhancedPocketBase(import.meta.env.VITE_POCKETBASE_URL);

export default Pb;
