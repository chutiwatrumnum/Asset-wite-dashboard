import axios from "axios";
import Pb from "../pocketbase";

const login = async (authReq: authRequest): Promise<authResponse> => {
    //  const response= await axios.post<authResponse>("/api/collections/admin/auth-with-password", authReq)
    //  return response.data
    const authData = await Pb.collection('admin').authWithPassword<authResponse>(authReq.identity, authReq.password);
    return authData.record;
};
const getSaff = async (request: saffRequest): Promise<saffResponse> => {
    // let baseUrl = '/api/collections/admin/records';
    // const user = await encryptStorage.getItem("user");

    // if (user?.id) {
    //     baseUrl = `/api/collections/admin/records?filter!=id="${user.id}"`;
    // }

    // const response = await axios.get<saffResponse>(baseUrl, { params: request });
    // return response.data;
    // fetch a paginated records list
const userList = await Pb.collection('admin').getList<saffItem>(request.page, request.perPage, {
    filter: `id!="${Pb.authStore.record?.id}"`,
});
return userList
};

const deleteSaff = async (id: string): Promise<null> => {
    setTimeout(() => {
        return null
    }, 3000);
    return null
   await axios.delete(`/api/collections/admin/records/${id}`);
    
}

const createStaff = async (newStaffReq: newSaffRequest): Promise<null> => {

//   return await Pb.collection('admin').create(newStaffReq);
    
         const response= await axios.post("/api/collections/admin/records", newStaffReq)
         console.log("response:",response);
         
     return null
}
export { login,getSaff,deleteSaff,createStaff };
// export interface authResponse {
//     record: Record;
//     token: string;
// }

export interface newSaffRequest {
    email: string
    password: string
    passwordConfirm: string
    role: string
    house_id: string
    first_name: string
    last_name: string
    image?: File
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
    collectionId: string
    collectionName: string
    id: string
    email: string
    emailVisibility: boolean
    verified: boolean
    first_name: string
    last_name: string
    avatar: string
    role: string
    house_id: string
    authorized_area: string[]
    created: string
    updated: string
}