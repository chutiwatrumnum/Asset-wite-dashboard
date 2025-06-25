import Pb from "../pocketbase";
const collectionName = "admin";
const login = async (authReq: authRequest): Promise<authResponse> => {
    const authData = await Pb.collection(collectionName).authWithPassword<authResponse>(authReq.identity, authReq.password);
    return authData.record;
};
const getSaff = async (request: saffRequest): Promise<saffResponse> => {
    const userList = await Pb.collection(collectionName).getList<saffItem>(request.page, request.perPage, {
        filter: `id!="${Pb.authStore.record?.id}"`,
        sort: "-created",
    });
    return userList;
};

const getAllSaff = async (): Promise<saffItem[]> => {
    const userList = await Pb.collection(collectionName).getFullList<saffItem>({
        filter: `id!="${Pb.authStore.record?.id}"`,
        sort: "-created",
    });
    return userList
};

const deleteSaff = async (id: string): Promise<null> => {
    await Pb.collection(collectionName).delete(id);
    setTimeout(async () => {}, 10000);

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
    await Pb.collection(collectionName).create(formData);

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
    await Pb.collection(collectionName).update(newStaffReq.id!, formData);

    return null;
};
export { login, getSaff, deleteSaff, createStaff, editStaff,getAllSaff };

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
