import Pb from "../pocketbase";

const collectionName = "admin";

// ⚠️ หมายเหตุ: ฟังก์ชัน login นี้ใช้ได้แค่ default PocketBase เท่านั้น
// สำหรับ VMS login ให้ใช้ external-login.ts แทน
const login = async (authReq: authRequest): Promise<authResponse> => {
    try {
        // ตรวจสอบว่าอยู่ใน default mode หรือไม่
        if (Pb.isUsingVMS()) {
            throw new Error("Cannot use PocketBase login while in VMS mode. Use external login instead.");
        }

        const authData = await Pb.collection(collectionName).authWithPassword<authResponse>(
            authReq.identity,
            authReq.password
        );
        return authData.record;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

const getSaff = async (request: saffRequest): Promise<saffResponse> => {
    try {
        // ✅ ใช้ getCurrentUser() แทน authStore.record
        const currentUser = Pb.getCurrentUser();
        const currentUserId = currentUser?.id || "";

        const userList = await Pb.collection(collectionName).getList<saffItem>(
            request.page || 1,
            request.perPage || 50,
            {
                filter: `id!="${currentUserId}"`,
                sort: request.sort || "-created",
            }
        );
        return userList;
    } catch (error) {
        console.error("Error fetching staff list:", error);
        throw error;
    }
};

const getAllSaff = async (): Promise<saffItem[]> => {
    try {
        // ✅ ใช้ getCurrentUser() แทน authStore.record
        const currentUser = Pb.getCurrentUser();
        const currentUserId = currentUser?.id || "";

        const userList = await Pb.collection(collectionName).getFullList<saffItem>({
            filter: `id!="${currentUserId}"`,
            sort: "-created",
        });
        return userList;
    } catch (error) {
        console.error("Error fetching all staff:", error);
        throw error;
    }
};

const deleteSaff = async (id: string): Promise<null> => {
    try {
        if (!id) {
            throw new Error("Staff ID is required");
        }

        await Pb.collection(collectionName).delete(id);
        // ✅ ลบ setTimeout ที่ไม่จำเป็นออก
        return null;
    } catch (error) {
        console.error("Error deleting staff:", error);
        throw error;
    }
};

const createStaff = async (newStaffReq: newSaffRequest): Promise<null> => {
    try {
        // ✅ Validate required fields
        if (!newStaffReq.email || !newStaffReq.password) {
            throw new Error("Email and password are required");
        }

        const formData = new FormData();
        formData.append("email", newStaffReq.email);
        formData.append("password", newStaffReq.password);
        formData.append("passwordConfirm", newStaffReq.passwordConfirm);
        formData.append("role", newStaffReq.role);
        formData.append("house_id", newStaffReq.house_id);
        formData.append("emailVisibility", "true");

        // ✅ ตรวจสอบก่อนเพิ่ม optional fields
        if (newStaffReq.first_name?.trim()) {
            formData.append("first_name", newStaffReq.first_name);
        }
        if (newStaffReq.last_name?.trim()) {
            formData.append("last_name", newStaffReq.last_name);
        }
        if (newStaffReq.avatar) {
            formData.append("avatar", newStaffReq.avatar);
        }

        await Pb.collection(collectionName).create(formData);
        return null;
    } catch (error) {
        console.error("Error creating staff:", error);
        throw error;
    }
};

const editStaff = async (newStaffReq: newSaffRequest): Promise<null> => {
    try {
        // ✅ Validate required fields
        if (!newStaffReq.id) {
            throw new Error("Staff ID is required for editing");
        }
        if (!newStaffReq.email) {
            throw new Error("Email is required");
        }

        const formData = new FormData();
        formData.append("email", newStaffReq.email);
        formData.append("role", newStaffReq.role);
        formData.append("house_id", newStaffReq.house_id);

        // ✅ ใช้ empty string เป็น fallback แทน undefined
        formData.append("first_name", newStaffReq.first_name || "");
        formData.append("last_name", newStaffReq.last_name || "");

        // ✅ ตรวจสอบ avatar ก่อนเพิ่ม
        if (newStaffReq.avatar) {
            formData.append("avatar", newStaffReq.avatar);
        }

        await Pb.collection(collectionName).update(newStaffReq.id, formData);
        return null;
    } catch (error) {
        console.error("Error updating staff:", error);
        throw error;
    }
};

export { login, getSaff, deleteSaff, createStaff, editStaff, getAllSaff };

// Interfaces remain the same...
export interface newSaffRequest {
    id?: string;
    email: string;
    password: string;
    passwordConfirm: string;
    role: string;
    house_id: string;
    first_name: string;
    last_name: string;
    avatar?: File;
}

export interface authRequest {
    identity: string;
    password: string;
}

export interface authResponse {
    authorized_area: unknown[];
    avatar: string;
    collectionId: string;
    collectionName: string;
    created: Date;
    email: string;
    emailVisibility: boolean;
    first_name: string;
    house_id: string;
    id: string;
    last_name: string;
    role: string;
    updated: Date;
    verified: boolean;
}

export interface saffRequest {
    page?: number;
    perPage?: number;
    sort?: string;
}

export interface saffResponse {
    items: saffItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

export interface saffItem {
    collectionId: string;
    collectionName: string;
    id: string;
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    first_name: string;
    last_name: string;
    avatar: string;
    role: string;
    house_id: string;
    authorized_area: string[];
    created: string;
    updated: string;
}