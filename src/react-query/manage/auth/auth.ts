import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStaff, deleteSaff, editStaff, getAllSaff, getSaff, newSaffRequest, saffItem, saffRequest, saffResponse } from "@/api/auth/auth";
import { toast } from "sonner";

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

export const useSaffAllListQuery = () => {
    const query = useQuery<saffItem[], Error>({
        queryKey: ["saffList"],
        queryFn: () => getAllSaff(),
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

// เพิ่ม bulk delete mutation
export const useBulkDeleteSaffMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: async (adminIds: string[]) => {
            const results = await Promise.allSettled(
                adminIds.map(id => deleteSaff(id))
            );

            const successful: string[] = [];
            const failed: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successful.push(adminIds[index]);
                } else {
                    failed.push(adminIds[index]);
                }
            });

            return { successful, failed };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["saffList"] });

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