import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSaff, getSaff, saffRequest, saffResponse } from "@/api/auth/auth";

export const useSaffListQuery = (payloadQuery: saffRequest) => {
    const query = useQuery<saffResponse, Error>({
        queryKey: ["saffList", payloadQuery],
        queryFn: () => getSaff(payloadQuery),
        select(dataList) {
         return dataList
        },
        retry: false,
    });
    return { ...query };
};

export const useDeleteSaffMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: (adminId) => deleteSaff(adminId),
        onSuccess: (data) => {
            console.log('data:', data);
            queryClient.invalidateQueries({ queryKey: ["saffList"] });
        },
    });

    return mutation;
};