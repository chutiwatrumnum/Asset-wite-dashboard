import axios from "axios";

const login = async (authReq: authRequest): Promise<authResponse> => {
     const response= await axios.post<authResponse>("/api/collections/admin/auth-with-password", authReq)
     return response.data
};
const getSaff = async (saffReq: saffRequest): Promise<saffResponse> => {
    const response= await axios.get<saffResponse>("/api/collections/admin/records", {params:saffReq})
    return response.data
};
export { login,getSaff };
export interface authResponse {
    record: Record;
    token: string;
}
export interface authRequest {
    identity: string;
    password: string;
}
export interface Record {
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
    page?:       number;
    perPage?:    number;
    sort?:       string;
}
export interface saffResponse {
    items:      saffItem[];
    page:       number;
    perPage:    number;
    totalItems: number;
    totalPages: number;
}

export interface saffItem {
    authorized_area: string[];
    avatar?:          string;
    created:         Date;
    email:           string;
    emailVisibility: boolean;
    first_name:      string;
    house_id:        string;
    id:              string;
    last_name:       string;
    role:            string;
    updated:         string;
    verified:        boolean;
}