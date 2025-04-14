import { encryptStorage } from "@/utils/encryptStorage";

export const useAuth = async () => {
    const isLogged = (await encryptStorage.getItem("accessToken")) ? true : false;

    return { isLogged };
};

export type AuthContext = ReturnType<typeof useAuth>;
