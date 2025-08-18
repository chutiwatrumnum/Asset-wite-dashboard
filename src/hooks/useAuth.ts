// src/hooks/useAuth.ts - ตรวจสอบการใช้ encryptStorage
export const useAuth = () => {
    const isLogged = () => {
        return localStorage.getItem("isLogged");
    }

    const role = () => {
        return localStorage.getItem("role");
    }

    return { isLogged, role };
};

export type AuthContext = ReturnType<typeof useAuth>;