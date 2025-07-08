// src/react-query/manage/invitation/invitation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createInvitation,
    deleteInvitation,
    editInvitation,
    getAllInvitation,
    getInvitation,
    getInvitationById,
    getMyInvitations,
    getActiveInvitations,
    getExpiringInvitations,
    bulkDeleteInvitations,
    searchInvitations,
    patchInvitation,
    deactivateInvitation,
    activateInvitation,
    newInvitationRequest,
    InvitationItem,
    InvitationRequest,
    InvitationResponse
} from "@/api/invitation/invitation";
import { toast } from "sonner";

// Query hooks
export const useInvitationListQuery = (payloadQuery: InvitationRequest) => {
    const query = useQuery<InvitationResponse, Error>({
        queryKey: ["invitationList", payloadQuery],
        queryFn: () => getInvitation(payloadQuery),
        retry: false,
        staleTime: 30000, // 30 seconds
    });
    return { ...query };
};

export const useInvitationAllListQuery = () => {
    const query = useQuery<InvitationItem[], Error>({
        queryKey: ["invitationList"],
        queryFn: () => getAllInvitation(),
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

export const useMyInvitationsQuery = () => {
    const query = useQuery<InvitationItem[], Error>({
        queryKey: ["myInvitations"],
        queryFn: () => getMyInvitations(),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useInvitationByIdQuery = (id: string) => {
    const query = useQuery<InvitationItem, Error>({
        queryKey: ["invitation", id],
        queryFn: () => getInvitationById(id),
        enabled: !!id,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useActiveInvitationsQuery = () => {
    const query = useQuery<InvitationItem[], Error>({
        queryKey: ["activeInvitations"],
        queryFn: () => getActiveInvitations(),
        retry: false,
        staleTime: 60000, // 1 minute
    });
    return { ...query };
};

export const useExpiringInvitationsQuery = (withinHours: number = 24) => {
    const query = useQuery<InvitationItem[], Error>({
        queryKey: ["expiringInvitations", withinHours],
        queryFn: () => getExpiringInvitations(withinHours),
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

export const useSearchInvitationsQuery = (searchParams: {
    visitorName?: string;
    houseId?: string;
    issuerId?: string;
    active?: boolean;
    startDate?: string;
    endDate?: string;
    isExpired?: boolean;
    isActive?: boolean;
}) => {
    const query = useQuery<InvitationItem[], Error>({
        queryKey: ["searchInvitations", searchParams],
        queryFn: () => searchInvitations(searchParams),
        enabled: Object.values(searchParams).some(value =>
            value !== undefined && value !== null && value !== ""
        ),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

// Mutation hooks
const invalidateInvitationQueries = (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ["invitationList"] });
    queryClient.invalidateQueries({ queryKey: ["invitation"] });
    queryClient.invalidateQueries({ queryKey: ["myInvitations"] });
    queryClient.invalidateQueries({ queryKey: ["activeInvitations"] });
    queryClient.invalidateQueries({ queryKey: ["expiringInvitations"] });
    queryClient.invalidateQueries({ queryKey: ["searchInvitations"] });
};

export const useCreateInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<InvitationItem, Error, newInvitationRequest>({
        mutationFn: createInvitation,
        onSuccess: (data) => {
            invalidateInvitationQueries(queryClient);

            toast.success("สร้างบัตรเชิญสำเร็จ", {
                description: `สร้างบัตรเชิญสำหรับ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Create invitation error:", error);

            toast.error("ไม่สามารถสร้างบัตรเชิญได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useEditInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<InvitationItem, Error, newInvitationRequest>({
        mutationFn: editInvitation,
        onSuccess: (data) => {
            invalidateInvitationQueries(queryClient);

            toast.success("อัปเดตบัตรเชิญสำเร็จ", {
                description: `อัปเดตข้อมูลบัตรเชิญของ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Edit invitation error:", error);

            toast.error("ไม่สามารถอัปเดตบัตรเชิญได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const usePatchInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        InvitationItem,
        Error,
        { id: string; data: Partial<Omit<newInvitationRequest, 'id'>> }
    >({
        mutationFn: ({ id, data }) => patchInvitation(id, data),
        onSuccess: (data) => {
            invalidateInvitationQueries(queryClient);

            toast.success("อัปเดตข้อมูลสำเร็จ", {
                description: `อัปเดตข้อมูลบางส่วนของบัตรเชิญ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Patch invitation error:", error);

            toast.error("ไม่สามารถอัปเดตข้อมูลได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useDeactivateInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<InvitationItem, Error, string>({
        mutationFn: deactivateInvitation,
        onSuccess: (data) => {
            invalidateInvitationQueries(queryClient);

            toast.success("ปิดใช้งานบัตรเชิญสำเร็จ", {
                description: `ปิดใช้งานบัตรเชิญของ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Deactivate invitation error:", error);

            toast.error("ไม่สามารถปิดใช้งานบัตรเชิญได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useActivateInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<InvitationItem, Error, string>({
        mutationFn: activateInvitation,
        onSuccess: (data) => {
            invalidateInvitationQueries(queryClient);

            toast.success("เปิดใช้งานบัตรเชิญสำเร็จ", {
                description: `เปิดใช้งานบัตรเชิญของ ${data.visitor_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Activate invitation error:", error);

            toast.error("ไม่สามารถเปิดใช้งานบัตรเชิญได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useDeleteInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: deleteInvitation,
        onSuccess: () => {
            invalidateInvitationQueries(queryClient);

            toast.success("ลบบัตรเชิญสำเร็จ", {
                description: "ข้อมูลบัตรเชิญถูกลบออกจากระบบเรียบร้อยแล้ว",
            });
        },
        onError: (error: Error) => {
            console.error("Delete invitation error:", error);

            toast.error("ไม่สามารถลบบัตรเชิญได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

// Bulk delete mutation for invitations
export const useBulkDeleteInvitationMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: bulkDeleteInvitations,
        onMutate: async (invitationIds) => {
            // Show loading toast
            toast.loading(`กำลังลบบัตรเชิญ ${invitationIds.length} ใบ...`, {
                id: "bulk-delete-loading",
            });
        },
        onSuccess: (data, variables) => {
            // Dismiss loading toast
            toast.dismiss("bulk-delete-loading");

            invalidateInvitationQueries(queryClient);

            if (data.successful.length > 0) {
                toast.success(`ลบบัตรเชิญสำเร็จ ${data.successful.length} ใบ`, {
                    description: data.failed.length > 0
                        ? `มีข้อผิดพลาดในการลบ ${data.failed.length} ใบ`
                        : "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
                });
            }

            if (data.failed.length > 0 && data.successful.length === 0) {
                toast.error(`ไม่สามารถลบบัตรเชิญได้ทั้งหมด`, {
                    description: `เกิดข้อผิดพลาดในการลบ ${data.failed.length} ใบ`,
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