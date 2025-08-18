// src/hooks/interceptors.ts - แก้ไขการใช้ encryptStorage
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { encryptStorage } from "@/utils/encryptStorage"; // ✅ เพิ่ม import

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
            try {
                const accessToken = await encryptStorage.getItem("accessToken");
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
            } catch (error) {
                console.warn("Warning: Could not get access token from storage:", error);
            }
            return config;
        };

        const requestErrorHandler = (error: AxiosError) => Promise.reject(error);

        axios.interceptors.request.use(requestInterceptor, requestErrorHandler);

        // Response Interceptor
        const responseInterceptor = (response: AxiosResponse) => response;

        const responseErrorHandler = (error: AxiosError<ApiErrorResponse>) => {
            if (error.response?.status === 401) {
                // Clear auth data safely
                try {
                    encryptStorage.clear();
                } catch (clearError) {
                    console.warn("Warning: Could not clear storage:", clearError);
                }

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