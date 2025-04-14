// src/hooks/useAxiosInterceptors.ts
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { encryptStorage } from "@/utils/encryptStorage";

// Define error response shape (adjust based on your API)
interface ApiErrorResponse {
    message?: string;
    status?: number;
}

export const useAxiosInterceptors = () => {
    const navigate = useNavigate();
    const interceptorId = useRef<number | null>(null);

    useEffect(() => {
        // Request Interceptor
        const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
            const accessToken = await encryptStorage.getItem("accessToken");
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        };

        const requestErrorHandler = (error: AxiosError) => Promise.reject(error);

        axios.interceptors.request.use(requestInterceptor, requestErrorHandler);

        // Response Interceptor
        const responseInterceptor = (response: AxiosResponse) => response;

        const responseErrorHandler = (error: AxiosError<ApiErrorResponse>) => {
            if (error.response?.status === 401) {
                // Clear auth data
                encryptStorage.clear();

                // Redirect to login, replacing history
                navigate({ to: "/login", replace: true });
            }
            return Promise.reject(error);
        };

        interceptorId.current = axios.interceptors.response.use(responseInterceptor, responseErrorHandler);

        // Cleanup interceptors on unmount
        return () => {
            if (interceptorId.current !== null) {
                axios.interceptors.response.eject(interceptorId.current);
            }
        };
    }, [navigate]);

    return null;
};
