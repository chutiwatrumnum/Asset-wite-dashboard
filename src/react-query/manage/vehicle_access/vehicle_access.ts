// src/react-query/manage/vehicle_access/vehicle_access.ts
import { useQuery } from "@tanstack/react-query";
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

// Query hooks
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