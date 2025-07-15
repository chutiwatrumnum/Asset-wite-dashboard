
// src/react-query/manage/vehicle_access/vehicle_access.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getAllVehicleAccess,
    getVehicleAccess,
    getVehicleAccessById,
    getRecentVehicleAccess,
    createVehicleAccess,
    updateVehicleAccess,
    deleteVehicleAccess,
    searchVehicleAccess,
    VehicleAccessItem,
    VehicleAccessRequest,
    VehicleAccessResponse,
    NewVehicleAccessRequest,
} from "@/api/vehicle_access/vehicle_access";

// Query hooks
export const useVehicleAccessListQuery = (payloadQuery: VehicleAccessRequest) => {
    const query = useQuery<VehicleAccessResponse, Error>({
        queryKey: ["vehicleAccessList", payloadQuery],
        queryFn: () => getVehicleAccess(payloadQuery),
        retry: false,
        staleTime: 30000, // 30 seconds
    });
    return { ...query };
};

export const useVehicleAccessAllListQuery = () => {
    const query = useQuery<VehicleAccessItem[], Error>({
        queryKey: ["vehicleAccessList"],
        queryFn: () => getAllVehicleAccess(),
        retry: (failureCount, error) => {
            // If auto-cancellation, retry
            if (error.message?.includes('autocancelled') || error.message?.includes('aborted')) {
                return failureCount < 3;
            }
            return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 30000,
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
    });
    return { ...query };
};

export const useVehicleAccessByIdQuery = (id: string) => {
    const query = useQuery<VehicleAccessItem, Error>({
        queryKey: ["vehicleAccess", id],
        queryFn: () => getVehicleAccessById(id),
        enabled: !!id,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useRecentVehicleAccessQuery = (withinHours: number = 24) => {
    const query = useQuery<VehicleAccessItem[], Error>({
        queryKey: ["recentVehicleAccess", withinHours],
        queryFn: () => getRecentVehicleAccess(withinHours),
        retry: (failureCount, error) => {
            if (error.message?.includes('autocancelled') || error.message?.includes('aborted')) {
                return failureCount < 3;
            }
            return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 300000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
    });
    return { ...query };
};

export const useSearchVehicleAccessQuery = (searchParams: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    gateState?: string;
    gate?: string;
    reader?: string;
    houseId?: string;
    startDate?: string;
    endDate?: string;
    isSuccess?: boolean;
}) => {
    const query = useQuery<VehicleAccessItem[], Error>({
        queryKey: ["searchVehicleAccess", searchParams],
        queryFn: () => searchVehicleAccess(searchParams),
        enabled: Object.values(searchParams).some(value =>
            value !== undefined && value !== null && value !== ""
        ),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

// Mutation hooks
export const useCreateVehicleAccessMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<VehicleAccessItem, Error, NewVehicleAccessRequest>({
        mutationFn: createVehicleAccess,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["vehicleAccessList"] });
            queryClient.invalidateQueries({ queryKey: ["recentVehicleAccess"] });
            toast.success("บันทึกข้อมูลการเข้าออกยานพาหนะสำเร็จ", {
                description: `บันทึกข้อมูล ${data.license_plate} เรียบร้อยแล้ว`,
            });
        },
        onError: (error) => {
            console.error("Create vehicle access error:", error);
            toast.error("ไม่สามารถบันทึกข้อมูลได้", {
                description: error.message || "กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
            });
        },
    });

    return mutation;
};

export const useEditVehicleAccessMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<VehicleAccessItem, Error, NewVehicleAccessRequest>({
        mutationFn: updateVehicleAccess,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["vehicleAccessList"] });
            queryClient.invalidateQueries({ queryKey: ["vehicleAccess", data.id] });
            queryClient.invalidateQueries({ queryKey: ["recentVehicleAccess"] });
            toast.success("อัปเดตข้อมูลสำเร็จ", {
                description: `อัปเดตข้อมูล ${data.license_plate} เรียบร้อยแล้ว`,
            });
        },
        onError: (error) => {
            console.error("Update vehicle access error:", error);
            toast.error("ไม่สามารถอัปเดตข้อมูลได้", {
                description: error.message || "กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
            });
        },
    });

    return mutation;
};

export const useDeleteVehicleAccessMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<null, Error, string>({
        mutationFn: deleteVehicleAccess,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicleAccessList"] });
            queryClient.invalidateQueries({ queryKey: ["recentVehicleAccess"] });
            toast.success("ลบข้อมูลสำเร็จ");
        },
        onError: (error) => {
            console.error("Delete vehicle access error:", error);
            toast.error("ไม่สามารถลบข้อมูลได้", {
                description: error.message || "กรุณาลองใหม่อีกครั้ง",
            });
        },
    });

    return mutation;
};

// Bulk delete mutation
export const useBulkDeleteVehicleAccessMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: async (ids: string[]) => {
            const results = await Promise.allSettled(
                ids.map(id => deleteVehicleAccess(id))
            );

            const successful: string[] = [];
            const failed: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successful.push(ids[index]);
                } else {
                    failed.push(ids[index]);
                }
            });

            return { successful, failed };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["vehicleAccessList"] });
            queryClient.invalidateQueries({ queryKey: ["recentVehicleAccess"] });

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