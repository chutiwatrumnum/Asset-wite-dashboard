import Pb from "../pocketbase";

const login = async (authReq: authRequest): Promise<authResponse> => {
    const authData = await Pb.collection("admin").authWithPassword<authResponse>(authReq.identity, authReq.password);
    console.log("authData:", Pb.authStore.token);

    return authData.record;
};
const getSaff = async (request: saffRequest): Promise<saffResponse> => {
    const userList = await Pb.collection("admin").getList<saffItem>(request.page, request.perPage, {
        filter: `id!="${Pb.authStore.record?.id}"`,
        sort: "-created",
    });
    return userList;
};

const deleteSaff = async (id: string): Promise<null> => {
    setTimeout(async() => {
        await Pb.collection("admin").delete(id);
    }, 10000);
   
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
    await Pb.collection("admin").create(formData);

    return null;
};
export { login, getSaff, deleteSaff, createStaff };

export interface newSaffRequest {
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
