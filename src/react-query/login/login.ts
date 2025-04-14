import { useMutation } from "@tanstack/react-query";
import { authRequest, authResponse, login } from "@/api/auth/auth";
import { encryptStorage } from "@/utils/encryptStorage";
export const useLoginMutation = () =>
    useMutation<authResponse, Error, authRequest>({
        mutationFn: login,
        onSuccess: (data) => {
            console.log("data:", data);
            localStorage.setItem("isLogged", "true");
            localStorage.setItem("role", data.record.role);
            encryptStorage.setItem("accessToken", data.token);
            encryptStorage.setItem("user", data.record);
        },
    });
