// src/api/dynamic-pocketbase.tsx
import PocketBase from "pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";

class DynamicPocketBase {
  private static instance: DynamicPocketBase;
  private pb: PocketBase;
  private defaultUrl: string;

  private constructor() {
    this.defaultUrl = import.meta.env.VITE_POCKETBASE_URL;
    this.pb = new PocketBase(this.defaultUrl);
  }

  public static getInstance(): DynamicPocketBase {
    if (!DynamicPocketBase.instance) {
      DynamicPocketBase.instance = new DynamicPocketBase();
    }
    return DynamicPocketBase.instance;
  }

  // สลับไปใช้ VMS configuration
  public switchToVMS(vmsUrl: string, vmsToken: string, userInfo?: any) {
    try {
      // สร้าง PocketBase instance ใหม่ด้วย VMS URL
      this.pb = new PocketBase(vmsUrl);

      // ใช้ vmsToken แทน authStore ปกติ
      this.pb.authStore.save(vmsToken, userInfo || { id: "vms-user" });

      // เก็บ config ไว้ใน storage
      encryptStorage.setItem("vmsConfig", {
        vmsUrl,
        vmsToken,
        userInfo,
      });

      console.log("Switched to VMS PocketBase:", vmsUrl);
    } catch (error) {
      console.error("Failed to switch to VMS:", error);
      throw error;
    }
  }

  // กลับไปใช้ default PocketBase
  public switchToDefault() {
    this.pb = new PocketBase(this.defaultUrl);
    encryptStorage.removeItem("vmsConfig");
    console.log("Switched back to default PocketBase");
  }

  // ดึง PocketBase instance ปัจจุบัน
  public getPb(): PocketBase {
    return this.pb;
  }

  // เรียกใช้ API ด้วย VMS token
  public async apiCall(collection: string, action: string, ...args: any[]) {
    const vmsConfig = encryptStorage.getItem("vmsConfig");

    if (vmsConfig && vmsConfig.vmsToken) {
      // ใช้ VMS token สำหรับ request นี้
      const originalToken = this.pb.authStore.token;

      try {
        // Temporarily use VMS token
        this.pb.authStore.save(vmsConfig.vmsToken, this.pb.authStore.model);

        // ทำ API call
        const result = await this.pb.collection(collection)[action](...args);

        return result;
      } finally {
        // คืนค่า token เดิม
        this.pb.authStore.save(originalToken, this.pb.authStore.model);
      }
    } else {
      // ใช้ token ปกติ
      return await this.pb.collection(collection)[action](...args);
    }
  }

  // ส่ง custom headers ทุก request
  public setupVMSInterceptors() {
    const vmsConfig = encryptStorage.getItem("vmsConfig");

    if (vmsConfig && vmsConfig.vmsToken) {
      // Override beforeSend to use VMS token
      this.pb.beforeSend = function (url, options) {
        options.headers = options.headers || {};
        options.headers["Authorization"] = `Bearer ${vmsConfig.vmsToken}`;
        return { url, options };
      };
    }
  }

  // ตรวจสอบว่าใช้ VMS หรือไม่
  public isUsingVMS(): boolean {
    const vmsConfig = encryptStorage.getItem("vmsConfig");
    return !!vmsConfig?.vmsToken;
  }

  // ดึง VMS config
  public getVMSConfig() {
    return encryptStorage.getItem("vmsConfig");
  }

  // ล้าง VMS config
  public clearVMSConfig() {
    encryptStorage.removeItem("vmsConfig");
    this.switchToDefault();
  }
}

// Export singleton instance
export default DynamicPocketBase.getInstance();
