// src/api/auth/auth.ts (VMS Only - Remove PB login)
import DynamicPocketBase from "../dynamic-pocketbase";

const collectionName = "admin";

// Remove the old login function - only use external login now

const getSaff = async (request: saffRequest): Promise<saffResponse> => {
    // Always use VMS API
    const userList = await DynamicPocketBase.apiCall(collectionName, 'getList',
        request.page,
        request.perPage,
        {
            filter: `id!="${DynamicPocketBase.getPb().authStore.record?.id}"`,
            sort: "-created",
        }
    );
    return userList;
};

const getAllSaff = async (): Promise<saffItem[]> => {
    // Always use VMS API
    const userList = await DynamicPocketBase.apiCall(collectionName, 'getFullList', {
        filter: `id!="${DynamicPocketBase.getPb().authStore.record?.id}"`,
        sort: "-created",
    });
    return userList;
};

const deleteSaff = async (id: string): Promise<null> => {
    await DynamicPocketBase.apiCall(collectionName, 'delete', id);
    setTimeout(async () => { }, 10000);
    return null;
};

const createStaff = async (newStaffReq: newSaffRequest): Promise<null> => {
    const formData = new FormData();
    formData.append("email", newStaffReq.email);
    formData.append("password", newStaffReq.password);
    formData.append("passwordConfirm", newStaffReq.passwordConfirm);
    formData.append("role", newStaffReq.role);
    formData.append("house_id", newStaffReq.house_id);
    formData.append("emailVisibility", "true");

    if (newStaffReq.first_name) {
        formData.append("first_name", newStaffReq.first_name);
    }
    if (newStaffReq.last_name) {
        formData.append("last_name", newStaffReq.last_name);
    }
    if (newStaffReq.avatar) {
        formData.append("avatar", newStaffReq.avatar);
    }

    await DynamicPocketBase.apiCall(collectionName, 'create', formData);
    return null;
};

const editStaff = async (newStaffReq: newSaffRequest): Promise<null> => {
    const formData = new FormData();
    formData.append("email", newStaffReq.email);
    formData.append("role", newStaffReq.role);
    formData.append("house_id", newStaffReq.house_id);
    formData.append("first_name", newStaffReq.first_name);
    formData.append("last_name", newStaffReq.last_name);
    formData.append("avatar", newStaffReq.avatar ? newStaffReq.avatar : "");

    await DynamicPocketBase.apiCall(collectionName, 'update', newStaffReq.id!, formData);
    return null;
};

export { getSaff, deleteSaff, createStaff, editStaff, getAllSaff };

// Remove authRequest and authResponse interfaces - no longer needed
// Keep only the interfaces that are still used

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