// src/lib/api.ts
import { encryptStorage } from "@/utils/encryptStorage";
import axios from "axios";
axios.defaults.baseURL = import.meta.env.VITE_POCKETBASE_URL;
// axios.defaults.headers.post["Content-Type"] = "application/json";
axios.interceptors.request.use(
    async (request) => {
        const accessToken = await encryptStorage.getItem("accessToken");
        if (accessToken !== undefined) {
            request.headers.Authorization = `Bearer ${accessToken}`;
        }
        return request;
    },
    (error) => {
        return Promise.reject(error);
    }
);
