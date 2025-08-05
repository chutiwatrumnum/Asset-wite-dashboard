// src/react-query/manage/vehicle_access/vehicle_access.ts (เพิ่ม mutation functions)

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getPassageLog,
    getAllPassageLog,
    getPassageLogById,
    getPassageLogByLicensePlate,
    getPassageLogsBySuccess,
    getPassageLogsByTier,
    getPassageLogsByHouse,
    getRecentPassageLogs,
    searchPassageLogs,
    PassageLogRequest,
    PassageLogResponse,
    PassageLogItem
} from "@/api/vehicle_access/vehicle_access";
import Pb from "@/api/pocketbase";

// เพิ่ม delete function ใน API layer
const deletePassageLog = async (id: string): Promise<void> => {
    try {
        await Pb.collection("passage_log").delete(id);
    } catch (error) {
        console.error(`Error deleting passage log ${id}:`, error);
        throw error;
    }
};

// เพิ่ม bulk delete function
const bulkDeletePassageLogs = async (ids: string[]): Promise<{
    successful: string[];
    failed: string[];
}> => {
    const results = await Promise.allSettled(
        ids.map(id => deletePassageLog(id))
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
};

// Query hooks (existing ones)
export const usePassageLogListQuery = (payloadQuery: PassageLogRequest) => {
    const query = useQuery<PassageLogResponse, Error>({
        queryKey: ["passageLogList", payloadQuery],
        queryFn: () => getPassageLog(payloadQuery),
        retry: false,
        staleTime: 30000, // 30 seconds
    });
    return { ...query };
};

export const usePassageLogAllListQuery = () => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["passageLogList"],
        queryFn: () => getAllPassageLog(),
        retry: (failureCount, error) => {
            // ถ้าเป็น auto-cancellation ให้ retry
            if (error.message?.includes('autocancelled') || error.message?.includes('aborted')) {
                return failureCount < 3;
            }
            // Error อื่นๆ ให้ retry แค่ 1 ครั้ง
            return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 30000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
    });
    return { ...query };
};

export const usePassageLogByIdQuery = (id: string) => {
    const query = useQuery<PassageLogItem, Error>({
        queryKey: ["passageLog", id],
        queryFn: () => getPassageLogById(id),
        enabled: !!id,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const usePassageLogByLicensePlateQuery = (licensePlate: string) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["passageLogByLicensePlate", licensePlate],
        queryFn: () => getPassageLogByLicensePlate(licensePlate),
        enabled: !!licensePlate && licensePlate.trim().length > 0,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const usePassageLogsBySuccessQuery = (isSuccess: boolean) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["passageLogsBySuccess", isSuccess],
        queryFn: () => getPassageLogsBySuccess(isSuccess),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const usePassageLogsByTierQuery = (tier: string) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["passageLogsByTier", tier],
        queryFn: () => getPassageLogsByTier(tier),
        enabled: !!tier,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const usePassageLogsByHouseQuery = (houseId: string) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["passageLogsByHouse", houseId],
        queryFn: () => getPassageLogsByHouse(houseId),
        enabled: !!houseId,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useRecentPassageLogQuery = (withinHours: number = 24) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["recentPassageLog", withinHours],
        queryFn: () => getRecentPassageLogs(withinHours),
        retry: (failureCount, error) => {
            // ถ้าเป็น auto-cancellation ให้ retry
            if (error.message?.includes('autocancelled') || error.message?.includes('aborted')) {
                return failureCount < 3;
            }
            return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 60000, // 1 minute สำหรับข้อมูลล่าสุด
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchInterval: 30000, // Auto refetch ทุก 30 วินาที
    });
    return { ...query };
};

// เพิ่ม alias สำหรับ backward compatibility
export const useRecentVehicleAccessQuery = useRecentPassageLogQuery;

export const useSearchPassageLogQuery = (searchParams: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    houseId?: string;
    isSuccess?: boolean;
    gateState?: string;
    startDate?: string;
    endDate?: string;
}) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["searchPassageLog", searchParams],
        queryFn: () => searchPassageLogs(searchParams),
        enabled: Object.values(searchParams).some(value =>
            value !== undefined && value !== null && value !== ""
        ),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

// NEW: Mutation hooks
export const useDeleteVehicleAccessMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<void, Error, string>({
        mutationFn: (id: string) => deletePassageLog(id),
        onSuccess: (_, deletedId) => {
            // Invalidate and refetch all related queries
            queryClient.invalidateQueries({ queryKey: ["passageLogList"] });
            queryClient.invalidateQueries({ queryKey: ["recentPassageLog"] });
            queryClient.invalidateQueries({ queryKey: ["searchPassageLog"] });

            // Remove the deleted item from specific queries
            queryClient.removeQueries({ queryKey: ["passageLog", deletedId] });

            toast.success("ลบข้อมูลสำเร็จ");
        },
        onError: (error) => {
            console.error("Delete vehicle access error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        },
    });

    return mutation;
};

export const useBulkDeleteVehicleAccessMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: (ids: string[]) => bulkDeletePassageLogs(ids),
        onSuccess: (data) => {
            // Invalidate and refetch all related queries
            queryClient.invalidateQueries({ queryKey: ["passageLogList"] });
            queryClient.invalidateQueries({ queryKey: ["recentPassageLog"] });
            queryClient.invalidateQueries({ queryKey: ["searchPassageLog"] });

            // Remove deleted items from cache
            data.successful.forEach(id => {
                queryClient.removeQueries({ queryKey: ["passageLog", id] });
            });

            // Show appropriate toasts
            if (data.successful.length > 0) {
                toast.success(`ลบข้อมูลสำเร็จ ${data.successful.length} รายการ`);
            }

            if (data.failed.length > 0) {
                toast.error(`เกิดข้อผิดพลาดในการลบ ${data.failed.length} รายการ`);
            }
        },
        onError: (error) => {
            console.error("Bulk delete vehicle access error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        },
    });

    return mutation;
};

// Export for backward compatibility with existing components
export {
    deletePassageLog,
    bulkDeletePassageLogs,
};