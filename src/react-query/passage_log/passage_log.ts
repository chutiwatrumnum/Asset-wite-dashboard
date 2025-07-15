// src/react-query/manage/passage_log/passage_log.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createPassageLog,
    deletePassageLog,
    editPassageLog,
    getAllPassageLog,
    getPassageLog,
    getPassageLogById,
    getRecentPassageLogs,
    getActiveEntries,
    bulkDeletePassageLogs,
    searchPassageLogs,
    patchPassageLog,
    NewPassageLogRequest,
    PassageLogItem,
    PassageLogRequest,
    PassageLogResponse
} from "@/api/passage_log/passage_log";
import { toast } from "sonner";

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

// Mutation hooks
const invalidatePassageLogQueries = (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ["passageLogList"] });
    queryClient.invalidateQueries({ queryKey: ["passageLog"] });
    queryClient.invalidateQueries({ queryKey: ["recentPassageLogs"] });
    queryClient.invalidateQueries({ queryKey: ["activeEntries"] });
    queryClient.invalidateQueries({ queryKey: ["searchPassageLogs"] });
};

export const useCreatePassageLogMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<PassageLogItem, Error, NewPassageLogRequest>({
        mutationFn: createPassageLog,
        onSuccess: (data) => {
            invalidatePassageLogQueries(queryClient);

            toast.success("สร้างประวัติการเข้าออกสำเร็จ", {
                description: `บันทึกการ${data.passage_type === 'entry' ? 'เข้า' : 'ออก'}ของ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Create passage log error:", error);

            toast.error("ไม่สามารถสร้างประวัติการเข้าออกได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useEditPassageLogMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<PassageLogItem, Error, NewPassageLogRequest>({
        mutationFn: editPassageLog,
        onSuccess: (data) => {
            invalidatePassageLogQueries(queryClient);

            toast.success("อัปเดตประวัติการเข้าออกสำเร็จ", {
                description: `อัปเดตข้อมูลการ${data.passage_type === 'entry' ? 'เข้า' : 'ออก'}ของ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Edit passage log error:", error);

            toast.error("ไม่สามารถอัปเดตประวัติการเข้าออกได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const usePatchPassageLogMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        PassageLogItem,
        Error,
        { id: string; data: Partial<Omit<NewPassageLogRequest, 'id'>> }
    >({
        mutationFn: ({ id, data }) => patchPassageLog(id, data),
        onSuccess: (data) => {
            invalidatePassageLogQueries(queryClient);

            toast.success("อัปเดตข้อมูลสำเร็จ", {
                description: `อัปเดตข้อมูลบางส่วนของประวัติการเข้าออก ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Patch passage log error:", error);

            toast.error("ไม่สามารถอัปเดตข้อมูลได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useDeletePassageLogMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: deletePassageLog,
        onSuccess: () => {
            invalidatePassageLogQueries(queryClient);

            toast.success("ลบประวัติการเข้าออกสำเร็จ", {
                description: "ข้อมูลประวัติการเข้าออกถูกลบออกจากระบบเรียบร้อยแล้ว",
            });
        },
        onError: (error: Error) => {
            console.error("Delete passage log error:", error);

            toast.error("ไม่สามารถลบประวัติการเข้าออกได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

// Bulk delete mutation for passage logs
export const useBulkDeletePassageLogMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: bulkDeletePassageLogs,
        onMutate: async (passageLogIds) => {
            // Show loading toast
            toast.loading(`กำลังลบประวัติการเข้าออก ${passageLogIds.length} รายการ...`, {
                id: "bulk-delete-loading",
            });
        },
        onSuccess: (data, variables) => {
            // Dismiss loading toast
            toast.dismiss("bulk-delete-loading");

            invalidatePassageLogQueries(queryClient);

            if (data.successful.length > 0) {
                toast.success(`ลบประวัติการเข้าออกสำเร็จ ${data.successful.length} รายการ`, {
                    description: data.failed.length > 0
                        ? `มีข้อผิดพลาดในการลบ ${data.failed.length} รายการ`
                        : "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
                });
            }

            if (data.failed.length > 0 && data.successful.length === 0) {
                toast.error(`ไม่สามารถลบประวัติการเข้าออกได้ทั้งหมด`, {
                    description: `เกิดข้อผิดพลาดในการลบ ${data.failed.length} รายการ`,
                });
            }
        },
        onError: (error) => {
            // Dismiss loading toast
            toast.dismiss("bulk-delete-loading");

            console.error("Bulk delete error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
                description: error.message,
            });
        },
    });

    return mutation;
};