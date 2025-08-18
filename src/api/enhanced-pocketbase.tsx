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
  public switchToVMS(vmsUrl: string, vmsToken: string, projectInfo: any) {
    // เปลี่ยน base URL ไป VMS
    this.baseUrl = vmsUrl;

    // เก็บ VMS config
    this.vmsConfig = { vmsUrl, vmsToken, projectInfo };
    this.isExternalMode = true;

    // Override token ใน authStore
    this.authStore.save(vmsToken, null);

    // เก็บใน storage
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
  protected async beforeSend(url: string, options: any) {
    // เรียก parent beforeSend ก่อน
    const result = await super.beforeSend(url, options);

    // ถ้าใช้ VMS mode ให้ใส่ VMS token
    if (this.isExternalMode && this.vmsConfig?.vmsToken) {
      result.options.headers = result.options.headers || {};
      result.options.headers["Authorization"] =
        `Bearer ${this.vmsConfig.vmsToken}`;
    }

    return result;
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
      return localStorage.getItem("role") || "guest";
    } else {
      return this.authStore.record?.role || "guest";
    }
  }

  // Helper สำหรับตรวจสอบการ login
  public isLoggedIn(): boolean {
    if (this.isExternalMode) {
      return localStorage.getItem("isLogged") === "true";
    } else {
      return this.authStore.isValid;
    }
  }
}

// Export instance เดียวให้ทั้งระบบใช้
const Pb = new EnhancedPocketBase(import.meta.env.VITE_POCKETBASE_URL);

export default Pb;
