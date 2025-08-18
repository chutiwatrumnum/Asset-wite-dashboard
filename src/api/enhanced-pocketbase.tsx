// src/api/enhanced-pocketbase.tsx - แก้ไขปัญหา export
import PocketBase from "pocketbase";
import { encryptStorage } from "@/utils/encryptStorage";

class EnhancedPocketBase extends PocketBase {
  private vmsConfig: any = null;
  private isExternalMode: boolean = false;

  constructor(baseUrl?: string) {
    super(baseUrl);
    this.checkAndRestoreVMSConfig();
  }

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
      this.switchToDefault();
    }
  }

  public switchToVMS(vmsUrl: string, vmsToken: string, projectInfo: any) {
    try {
      this.baseUrl = vmsUrl;
      this.vmsConfig = { vmsUrl, vmsToken, projectInfo };
      this.isExternalMode = true;

      // ✅ ตั้งค่าเฉพาะ token ก่อน (ไม่ส่ง user record)
      this.authStore.save(vmsToken, null);

      this.beforeSend = (url, options) => {
        if (this.isExternalMode && vmsToken) {
          options.headers = options.headers || {};
          options.headers["Authorization"] = vmsToken;
        }
        return { url, options };
      };

      try {
        encryptStorage.setItem("vmsConfig", { vmsUrl, vmsToken, projectInfo });
      } catch (storageError) {
        console.warn(
          "Warning: Could not save VMS config to storage:",
          storageError
        );
      }

      console.log("✅ Switched to VMS mode:", vmsUrl);
    } catch (error) {
      console.error("Error switching to VMS:", error);
      throw error;
    }
  }

  public switchToDefault() {
    try {
      this.baseUrl = import.meta.env.VITE_POCKETBASE_URL;
      this.vmsConfig = null;
      this.isExternalMode = false;
      this.beforeSend = undefined;
      this.authStore.clear();

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

  public isUsingVMS(): boolean {
    return this.isExternalMode;
  }

  public getVMSConfig() {
    return this.vmsConfig;
  }

  public getProjectInfo() {
    return this.vmsConfig?.projectInfo || null;
  }

  public getCurrentUser() {
    if (this.isExternalMode) {
      // ✅ ลำดับความสำคัญ: authStore.record > storage > null
      if (this.authStore.record) {
        return this.authStore.record;
      }

      // ✅ ลองดึงจาก storage
      try {
        const userRecord = encryptStorage.getItem("user");
        if (userRecord) {
          console.log("📋 Retrieved user from storage:", userRecord);
          return userRecord;
        }
      } catch (storageError) {
        console.warn(
          "Warning: Could not access storage for user data:",
          storageError
        );
      }

      // ✅ หากไม่มีข้อมูลใดๆ ให้ return null
      console.warn("No user record found in VMS mode");
      return null;
    } else {
      return this.authStore.record;
    }
  }

  public setCurrentUser(userRecord: any) {
    if (this.isExternalMode && userRecord) {
      console.log("🔧 Setting current user:", userRecord);

      // ✅ ตั้งค่า authStore ด้วยข้อมูลใหม่
      this.authStore.save(this.authStore.token, userRecord);

      // ✅ บันทึกลง storage ด้วย
      try {
        encryptStorage.setItem("user", userRecord);
        console.log("✅ User saved to storage");
      } catch (error) {
        console.warn("Could not save user to storage:", error);
      }
    }
  }

  public debugLoginStatus() {
    console.log("=== Login Status Debug ===");
    console.log("Mode:", this.isExternalMode ? "VMS" : "PocketBase");
    console.log("isLoggedIn():", this.isLoggedIn());
    console.log("getCurrentUser():", this.getCurrentUser());
    console.log("authStore.isValid:", this.authStore.isValid);
    console.log(
      "authStore.token:",
      this.authStore.token ? "exists" : "missing"
    );
    console.log(
      "authStore.record:",
      this.authStore.record ? "exists" : "missing"
    );
    console.log("localStorage.isLogged:", localStorage.getItem("isLogged"));
    console.log(
      "localStorage.loginMethod:",
      localStorage.getItem("loginMethod")
    );

    if (this.isExternalMode) {
      console.log("VMS Config:", this.vmsConfig ? "exists" : "missing");
      try {
        const externalAuth = encryptStorage.getItem("externalAuth");
        const userRecord = encryptStorage.getItem("user");
        console.log(
          "encryptStorage.externalAuth:",
          externalAuth ? "exists" : "missing"
        );
        console.log("encryptStorage.user:", userRecord ? "exists" : "missing");
        if (userRecord) {
          console.log("User details:", {
            id: userRecord.id,
            email: userRecord.email,
            role: userRecord.role,
            house_id: userRecord.house_id,
          });
        }
      } catch (error) {
        console.log("encryptStorage error:", error);
      }
    }
    console.log("========================");
  }

  public getHouseId(): string {
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      console.warn("No current user found");
      return "";
    }

    const houseId = currentUser.house_id || "";
    console.log("Getting house_id:", houseId);
    return houseId;
  }

  public debugHouseId() {
    console.log("=== House ID Debug Info ===");
    console.log("Is External Mode:", this.isExternalMode);
    console.log("Current User:", this.getCurrentUser());
    console.log("House ID:", this.getHouseId());

    if (this.isExternalMode) {
      console.log("VMS Project Info:", this.vmsConfig?.projectInfo);
      console.log("Project ID:", this.vmsConfig?.projectInfo?.myProjectId);
    }

    console.log("==============================");
  }

  public getCurrentRole(): string {
    if (this.isExternalMode) {
      const role =
        this.authStore.record?.role ||
        localStorage.getItem("role") ||
        this.vmsConfig?.projectInfo?.roleName ||
        "staff";
      console.log("VMS Role:", role);
      return role;
    } else {
      const role = this.authStore.record?.role || "staff";
      console.log("PocketBase Role:", role);
      return role;
    }
  }

  public isLoggedIn(): boolean {
    if (this.isExternalMode) {
      const isLogged = localStorage.getItem("isLogged") === "true";
      const hasValidToken = !!this.authStore.token;
      const currentUser = this.getCurrentUser();
      const hasValidRecord = !!currentUser;

      console.log("VMS Login Check:", {
        isLogged,
        hasValidToken,
        hasValidRecord,
        tokenLength: this.authStore.token?.length || 0,
        userId: currentUser?.id || "none",
      });

      // ✅ ตรวจสอบให้ครบทุกเงื่อนไข
      const result = isLogged && hasValidToken && hasValidRecord;
      console.log("VMS isLoggedIn result:", result);

      return result;
    } else {
      const isValid = this.authStore.isValid;
      console.log("PocketBase Login Status:", isValid);
      return isValid;
    }
  }
  protected async request(url: string, options: any = {}) {
    if (this.isExternalMode && this.vmsConfig?.vmsToken) {
      options.headers = options.headers || {};
      options.headers["Authorization"] = this.vmsConfig.vmsToken;
      options.headers["Content-Type"] =
        options.headers["Content-Type"] || "application/json";

      console.log("🔗 VMS Request:", {
        url: `${this.baseUrl}${url}`,
        method: options.method || "GET",
        hasAuth: !!options.headers["Authorization"],
        headers: options.headers,
      });

      try {
        const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
        const response = await fetch(fullUrl, {
          method: options.method || "GET",
          headers: options.headers,
          body: options.body
            ? typeof options.body === "string"
              ? options.body
              : JSON.stringify(options.body)
            : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log("✅ VMS Request successful");
        return result;
      } catch (error) {
        console.error("❌ VMS Request failed:", error);
        throw error;
      }
    } else {
      try {
        const result = await super.request(url, options);
        console.log("✅ PocketBase Request successful");
        return result;
      } catch (error) {
        console.error("❌ PocketBase Request failed:", error);
        throw error;
      }
    }
  }

  public collection(idOrName: string) {
    if (this.isExternalMode) {
      console.log("Creating VMS collection wrapper for:", idOrName);
      return new VMSCollectionWrapper(this, idOrName);
    } else {
      return super.collection(idOrName);
    }
  }

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

class VMSCollectionWrapper {
  private pb: EnhancedPocketBase;
  private collectionName: string;

  constructor(pb: EnhancedPocketBase, collectionName: string) {
    this.pb = pb;
    this.collectionName = collectionName;
  }

  async create(data: any) {
    console.log(
      `Creating record in VMS collection: ${this.collectionName}`,
      data
    );

    const url = `/api/collections/${this.collectionName}/records`;
    return await this.pb.request(url, {
      method: "POST",
      body: data,
    });
  }

  async getList(page = 1, perPage = 30, options: any = {}) {
    console.log(`Getting list from VMS collection: ${this.collectionName}`, {
      page,
      perPage,
      options,
    });

    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });

    if (options.sort) params.append("sort", options.sort);
    if (options.filter) params.append("filter", options.filter);
    if (options.expand) params.append("expand", options.expand);
    if (options.requestKey) params.append("requestKey", options.requestKey);

    const url = `/api/collections/${this.collectionName}/records?${params}`;
    return await this.pb.request(url);
  }

  async getFullList(options: any = {}) {
    console.log(
      `Getting full list from VMS collection: ${this.collectionName}`,
      options
    );

    const params = new URLSearchParams({
      perPage: "500",
    });

    if (options.sort) params.append("sort", options.sort);
    if (options.filter) params.append("filter", options.filter);
    if (options.expand) params.append("expand", options.expand);
    if (options.requestKey) params.append("requestKey", options.requestKey);

    const url = `/api/collections/${this.collectionName}/records?${params}`;
    const result = await this.pb.request(url);

    return result.items || [];
  }

  async getOne(id: string, options: any = {}) {
    console.log(
      `Getting one record from VMS collection: ${this.collectionName}`,
      { id, options }
    );

    const params = new URLSearchParams();
    if (options.expand) params.append("expand", options.expand);

    const url = `/api/collections/${this.collectionName}/records/${id}${params.toString() ? `?${params}` : ""}`;
    return await this.pb.request(url);
  }

  async update(id: string, data: any) {
    console.log(`Updating record in VMS collection: ${this.collectionName}`, {
      id,
      data,
    });

    const url = `/api/collections/${this.collectionName}/records/${id}`;
    return await this.pb.request(url, {
      method: "PATCH",
      body: data,
    });
  }

  async delete(id: string) {
    console.log(`Deleting record from VMS collection: ${this.collectionName}`, {
      id,
    });

    const url = `/api/collections/${this.collectionName}/records/${id}`;
    return await this.pb.request(url, {
      method: "DELETE",
    });
  }
}

// สร้าง instance และ export
const Pb = new EnhancedPocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Export both named and default
export { EnhancedPocketBase, VMSCollectionWrapper };
export default Pb;
