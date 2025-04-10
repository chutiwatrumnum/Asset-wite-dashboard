import axios from "axios";

const login = async (email: string, password: string) => {
    axios.post("/api/collections/admin/auth-with-password", { email, password });
};
export { login };
