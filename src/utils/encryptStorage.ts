// src/utils/encryptStorage.ts - แก้ไขให้ปลอดภัยจาก SSR และ build issues
import { EncryptStorage } from "encrypt-storage";

// ✅ สร้าง safe wrapper สำหรับ encryptStorage
class SafeEncryptStorage {
  private storage: EncryptStorage | null = null;

  constructor() {
    // ตรวจสอบว่าอยู่ใน browser environment
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        this.storage = new EncryptStorage("@tFYElZZE7onx4SgJ4h+hYAe+betta", {
          prefix: "betta",
        });
      } catch (error) {
        console.warn("Could not initialize EncryptStorage:", error);
      }
    }
  }

  getItem<T = any>(key: string): T | null {
    if (!this.storage) {
      console.warn("EncryptStorage not available, using localStorage fallback");
      try {
        const item = localStorage.getItem(`betta_${key}`);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    }

    try {
      return this.storage.getItem<T>(key);
    } catch (error) {
      console.warn(`Error getting item ${key} from EncryptStorage:`, error);
      return null;
    }
  }

  setItem(key: string, value: any): void {
    if (!this.storage) {
      console.warn("EncryptStorage not available, using localStorage fallback");
      try {
        localStorage.setItem(`betta_${key}`, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting item ${key} to localStorage:`, error);
      }
      return;
    }

    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn(`Error setting item ${key} to EncryptStorage:`, error);
      // Fallback to localStorage
      try {
        localStorage.setItem(`betta_${key}`, JSON.stringify(value));
      } catch (fallbackError) {
        console.warn(`Error setting item ${key} to localStorage fallback:`, fallbackError);
      }
    }
  }

  removeItem(key: string): void {
    if (!this.storage) {
      console.warn("EncryptStorage not available, using localStorage fallback");
      try {
        localStorage.removeItem(`betta_${key}`);
      } catch (error) {
        console.warn(`Error removing item ${key} from localStorage:`, error);
      }
      return;
    }

    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing item ${key} from EncryptStorage:`, error);
      // Fallback to localStorage
      try {
        localStorage.removeItem(`betta_${key}`);
      } catch (fallbackError) {
        console.warn(`Error removing item ${key} from localStorage fallback:`, fallbackError);
      }
    }
  }

  clear(): void {
    if (!this.storage) {
      console.warn("EncryptStorage not available, clearing localStorage with prefix");
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('betta_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("Error clearing localStorage:", error);
      }
      return;
    }

    try {
      this.storage.clear();
    } catch (error) {
      console.warn("Error clearing EncryptStorage:", error);
      // Fallback to localStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('betta_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (fallbackError) {
        console.warn("Error clearing localStorage fallback:", fallbackError);
      }
    }
  }

  // ✅ เพิ่ม method สำหรับตรวจสอบว่า storage พร้อมใช้งานหรือไม่
  isAvailable(): boolean {
    return this.storage !== null;
  }
}

// ✅ Export instance เดียวให้ทั้งระบบใช้
export const encryptStorage = new SafeEncryptStorage();