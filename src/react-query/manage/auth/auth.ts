import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStaff, deleteSaff, editStaff, getSaff, newSaffRequest, saffRequest, saffResponse } from "@/api/auth/auth";

export const useSaffListQuery = (payloadQuery: saffRequest) => {
    const query = useQuery<saffResponse, Error>({
        queryKey: ["saffList", payloadQuery],
        queryFn: () => getSaff(payloadQuery),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

export const useDeleteSaffMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: (adminId) => deleteSaff(adminId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saffList"] });
        },
    });

    return mutation;
};

export const useCreateSaffMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, newSaffRequest>({
        mutationFn: createStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saffList"] });
        },
        onError(error: Error, variables, context) {
            console.log("error:", error);
            console.log("variables:", variables);
            console.log("context:", context);
        },
    });

    return mutation;
};
export const useEditSaffMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, newSaffRequest>({
        mutationFn: editStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saffList"] });
        },
        onError(error: Error, variables, context) {
            console.log("error:", error);
            console.log("variables:", variables);
            console.log("context:", context);
        },
    });

    return mutation;
};
