// src/react-query/manage/resident/resident.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createResident,
    deleteResident,
    editResident,
    getAllResident,
    getResident,
    newResidentRequest,
    residentItem,
    residentRequest,
    residentResponse
} from "@/api/resident/resident";
import { toast } from "sonner";

export const useResidentListQuery = (payloadQuery: residentRequest) => {
    const query = useQuery<residentResponse, Error>({
        queryKey: ["residentList", payloadQuery],
        queryFn: () => getResident(payloadQuery),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

export const useResidentAllListQuery = () => {
    const query = useQuery<residentItem[], Error>({
        queryKey: ["residentList"],
        queryFn: () => getAllResident(),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

export const useDeleteResidentMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: (residentId) => deleteResident(residentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["residentList"] });
        },
    });

    return mutation;
};

export const useCreateResidentMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, newResidentRequest>({
        mutationFn: createResident,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["residentList"] });
        },
        onError(error: Error, variables, context) {
            console.log("error:", error);
            console.log("variables:", variables);
            console.log("context:", context);
        },
    });

    return mutation;
};

export const useEditResidentMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, newResidentRequest>({
        mutationFn: editResident,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["residentList"] });
        },
        onError(error: Error, variables, context) {
            console.log("error:", error);
            console.log("variables:", variables);
            console.log("context:", context);
        },
    });

    return mutation;
};

// Bulk delete mutation for residents
export const useBulkDeleteResidentMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: async (residentIds: string[]) => {
            const results = await Promise.allSettled(
                residentIds.map(id => deleteResident(id))
            );

            const successful: string[] = [];
            const failed: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successful.push(residentIds[index]);
                } else {
                    failed.push(residentIds[index]);
                }
            });

            return { successful, failed };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["residentList"] });

            if (data.successful.length > 0) {
                toast.success(`ลบข้อมูลสำเร็จ ${data.successful.length} รายการ`);
            }

            if (data.failed.length > 0) {
                toast.error(`เกิดข้อผิดพลาดในการลบ ${data.failed.length} รายการ`);
            }
        },
        onError: (error) => {
            console.error("Bulk delete error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        },
    });

    return mutation;
};