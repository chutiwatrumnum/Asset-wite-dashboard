import { useQuery } from "@tanstack/react-query";
import {
    getAllPassageLog,
    getPassageLog,
    getPassageLogById,
    getRecentPassageLogs,
    getActiveEntries,
    searchPassageLogs,
    PassageLogItem,
    PassageLogRequest,
    PassageLogResponse
} from "@/api/passage_log/passage_log";

// Query hooks เท่านั้น
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

export const useRecentPassageLogsQuery = (withinHours: number = 24) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["recentPassageLogs", withinHours],
        queryFn: () => getRecentPassageLogs(withinHours),
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

export const useActiveEntriesQuery = () => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["activeEntries"],
        queryFn: () => getActiveEntries(),
        retry: false,
        staleTime: 60000, // 1 minute
    });
    return { ...query };
};

export const useSearchPassageLogsQuery = (searchParams: {
    visitorName?: string;
    passageType?: "entry" | "exit";
    locationArea?: string;
    verificationMethod?: string;
    staffVerifiedBy?: string;
    invitationId?: string;
    vehicleId?: string;
    houseId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
}) => {
    const query = useQuery<PassageLogItem[], Error>({
        queryKey: ["searchPassageLogs", searchParams],
        queryFn: () => searchPassageLogs(searchParams),
        enabled: Object.values(searchParams).some(value =>
            value !== undefined && value !== null && value !== ""
        ),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};