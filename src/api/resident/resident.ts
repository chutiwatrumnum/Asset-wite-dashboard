// src/api/resident/resident.ts
import Pb from "../pocketbase";

const collectionName = "resident";

// Types
export interface newResidentRequest {
    id?: string;
    email: string;
    password: string;
    passwordConfirm: string;
    role: string; // primary, co-resident
    house_id: string | string[]; // resident can have multiple houses
    authorized_area?: string[];
    first_name?: string;
    last_name?: string;
    avatar?: File;
}

export interface residentItem {
    collectionId: string;
    collectionName: string;
    id: string;
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    first_name: string;
    last_name: string;
    avatar: string;
    role: string; // primary, co-resident
    house_id: string | string[]; // can be array for residents
    authorized_area: string[];
    created: string;
    updated: string;
}

export interface residentRequest {
    page?: number;
    perPage?: number;
    sort?: string;
}

export interface residentResponse {
    items: residentItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

// API Functions
const getResident = async (request: residentRequest): Promise<residentResponse> => {
    const residentList = await Pb.collection(collectionName).getList<residentItem>(
        request.page || 1,
        request.perPage || 10,
        {
            filter: `id!="${Pb.authStore.record?.id}"`,
            sort: request.sort || "-created",
        }
    );
    return residentList;
};

const getAllResident = async (): Promise<residentItem[]> => {
    const residentList = await Pb.collection(collectionName).getFullList<residentItem>({
        filter: `id!="${Pb.authStore.record?.id}"`,
        sort: "-created",
    });
    return residentList;
};

const deleteResident = async (id: string): Promise<null> => {
    await Pb.collection(collectionName).delete(id);
    return null;
};

const createResident = async (newResidentReq: newResidentRequest): Promise<null> => {
    const formData = new FormData();

    formData.append("email", newResidentReq.email);
    formData.append("password", newResidentReq.password);
    formData.append("passwordConfirm", newResidentReq.passwordConfirm);
    formData.append("role", newResidentReq.role);
    formData.append("emailVisibility", "true");

    // Handle house_id - can be string or array
    if (Array.isArray(newResidentReq.house_id)) {
        formData.append("house_id", JSON.stringify(newResidentReq.house_id));
    } else {
        formData.append("house_id", JSON.stringify([newResidentReq.house_id]));
    }

    // Handle authorized_area
    if (newResidentReq.authorized_area) {
        formData.append("authorized_area", JSON.stringify(newResidentReq.authorized_area));
    } else {
        formData.append("authorized_area", "[]");
    }

    if (newResidentReq.first_name) {
        formData.append("first_name", newResidentReq.first_name);
    }
    if (newResidentReq.last_name) {
        formData.append("last_name", newResidentReq.last_name);
    }
    if (newResidentReq.avatar) {
        formData.append("avatar", newResidentReq.avatar);
    }

    await Pb.collection(collectionName).create(formData);
    return null;
};

const editResident = async (residentReq: newResidentRequest): Promise<null> => {
    const formData = new FormData();

    formData.append("email", residentReq.email);
    formData.append("role", residentReq.role);
    formData.append("first_name", residentReq.first_name || "");
    formData.append("last_name", residentReq.last_name || "");

    // Handle house_id
    if (Array.isArray(residentReq.house_id)) {
        formData.append("house_id", JSON.stringify(residentReq.house_id));
    } else {
        formData.append("house_id", JSON.stringify([residentReq.house_id]));
    }

    // Handle authorized_area
    if (residentReq.authorized_area) {
        formData.append("authorized_area", JSON.stringify(residentReq.authorized_area));
    } else {
        formData.append("authorized_area", "[]");
    }

    if (residentReq.avatar) {
        formData.append("avatar", residentReq.avatar);
    }

    await Pb.collection(collectionName).update(residentReq.id!, formData);
    return null;
};

export {
    getResident,
    getAllResident,
    deleteResident,
    createResident,
    editResident
};