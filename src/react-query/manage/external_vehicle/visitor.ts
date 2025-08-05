// src/react-query/manage/external_vehicle/visitor.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createVisitor,
    deleteVisitor,
    editVisitor,
    getAllVisitor,
    getVisitor,
    getVisitorById,
    getVisitorByLicensePlate,
    getVisitorsByHouse,
    getVisitorsByArea,
    getVisitorsByGender,
    bulkDeleteVisitors,
    searchVisitors,
    patchVisitor,
    stampVisitor,
    newVisitorRequest,
    VisitorItem,
    VisitorRequest,
    VisitorResponse
} from "@/api/external_vehicle/visitor";
import { toast } from "sonner";

// Query hooks
export const useVisitorListQuery = (payloadQuery: VisitorRequest) => {
    const query = useQuery<VisitorResponse, Error>({
        queryKey: ["visitorList", payloadQuery],
        queryFn: () => getVisitor(payloadQuery),
        retry: false,
        staleTime: 30000, // 30 seconds
    });
    return { ...query };
};

export const useVisitorAllListQuery = () => {
    const query = useQuery<VisitorItem[], Error>({
        queryKey: ["visitorList"],
        queryFn: () => getAllVisitor(),
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
        refetchOnWindowFocus: false, // ปิดการ refetch เมื่อ focus window
        refetchOnMount: 'always', // refetch เมื่อ mount component
    });
    return { ...query };
};

export const useVisitorByIdQuery = (id: string) => {
    const query = useQuery<VisitorItem, Error>({
        queryKey: ["visitor", id],
        queryFn: () => getVisitorById(id),
        enabled: !!id,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVisitorByLicensePlateQuery = (licensePlate: string) => {
    const query = useQuery<VisitorItem[], Error>({
        queryKey: ["visitorByLicensePlate", licensePlate],
        queryFn: () => getVisitorByLicensePlate(licensePlate),
        enabled: !!licensePlate && licensePlate.trim().length > 0,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVisitorsByHouseQuery = (houseId: string) => {
    const query = useQuery<VisitorItem[], Error>({
        queryKey: ["visitorsByHouse", houseId],
        queryFn: () => getVisitorsByHouse(houseId),
        enabled: !!houseId,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVisitorsByAreaQuery = (areaId: string) => {
    const query = useQuery<VisitorItem[], Error>({
        queryKey: ["visitorsByArea", areaId],
        queryFn: () => getVisitorsByArea(areaId),
        enabled: !!areaId,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVisitorsByGenderQuery = (gender: "male" | "female" | "other") => {
    const query = useQuery<VisitorItem[], Error>({
        queryKey: ["visitorsByGender", gender],
        queryFn: () => getVisitorsByGender(gender),
        enabled: !!gender,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useSearchVisitorsQuery = (searchParams: {
    firstName?: string;
    lastName?: string;
    licensePlate?: string;
    gender?: "male" | "female" | "other";
    houseId?: string;
    issuer?: string;
    stamper?: string;
    startDate?: string;
    endDate?: string;
    idCard?: string;
}) => {
    const query = useQuery<VisitorItem[], Error>({
        queryKey: ["searchVisitors", searchParams],
        queryFn: () => searchVisitors(searchParams),
        enabled: Object.values(searchParams).some(value =>
            value !== undefined && value !== null && value !== ""
        ),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

// Mutation hooks
const invalidateVisitorQueries = (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ["visitorList"] });
    queryClient.invalidateQueries({ queryKey: ["visitor"] });
    queryClient.invalidateQueries({ queryKey: ["visitorByLicensePlate"] });
    queryClient.invalidateQueries({ queryKey: ["visitorsByHouse"] });
    queryClient.invalidateQueries({ queryKey: ["visitorsByArea"] });
    queryClient.invalidateQueries({ queryKey: ["visitorsByGender"] });
    queryClient.invalidateQueries({ queryKey: ["searchVisitors"] });
};

export const useCreateVisitorMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<VisitorItem, Error, newVisitorRequest>({
        mutationFn: createVisitor,
        onSuccess: (data) => {
            invalidateVisitorQueries(queryClient);

            toast.success("เพิ่มผู้เยี่ยมภายนอกสำเร็จ", {
                description: `เพิ่มข้อมูล ${data.first_name} ${data.last_name} (${data.vehicle.license_plate}) เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Create visitor error:", error);

            toast.error("ไม่สามารถเพิ่มผู้เยี่ยมภายนอกได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useEditVisitorMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<VisitorItem, Error, newVisitorRequest>({
        mutationFn: editVisitor,
        onSuccess: (data) => {
            invalidateVisitorQueries(queryClient);

            toast.success("อัปเดตผู้เยี่ยมภายนอกสำเร็จ", {
                description: `อัปเดตข้อมูล ${data.first_name} ${data.last_name} (${data.vehicle.license_plate}) เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Edit visitor error:", error);

            toast.error("ไม่สามารถอัปเดตผู้เยี่ยมภายนอกได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const usePatchVisitorMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        VisitorItem,
        Error,
        { id: string; data: Partial<Omit<newVisitorRequest, 'id'>> }
    >({
        mutationFn: ({ id, data }) => patchVisitor(id, data),
        onSuccess: (data) => {
            invalidateVisitorQueries(queryClient);

            toast.success("อัปเดตข้อมูลสำเร็จ", {
                description: `อัปเดตข้อมูลบางส่วนของ ${data.first_name} ${data.last_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Patch visitor error:", error);

            toast.error("ไม่สามารถอัปเดตข้อมูลได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useStampVisitorMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        VisitorItem,
        Error,
        { id: string; stamperId?: string; stampedTime?: string }
    >({
        mutationFn: ({ id, stamperId, stampedTime }) => stampVisitor(id, stamperId, stampedTime),
        onSuccess: (data) => {
            invalidateVisitorQueries(queryClient);

            toast.success("ประทับตราสำเร็จ", {
                description: `ประทับตรา ${data.first_name} ${data.last_name} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Stamp visitor error:", error);

            toast.error("ไม่สามารถประทับตราได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useDeleteVisitorMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: deleteVisitor,
        onSuccess: () => {
            invalidateVisitorQueries(queryClient);

            toast.success("ลบผู้เยี่ยมภายนอกสำเร็จ", {
                description: "ข้อมูลผู้เยี่ยมภายนอกถูกลบออกจากระบบเรียบร้อยแล้ว",
            });
        },
        onError: (error: Error) => {
            console.error("Delete visitor error:", error);

            toast.error("ไม่สามารถลบผู้เยี่ยมภายนอกได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

// Bulk delete mutation for visitors
export const useBulkDeleteVisitorsMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: bulkDeleteVisitors,
        onMutate: async (visitorIds) => {
            // Show loading toast
            toast.loading(`กำลังลบผู้เยี่ยมภายนอก ${visitorIds.length} คน...`, {
                id: "bulk-delete-loading",
            });
        },
        onSuccess: (data, variables) => {
            // Dismiss loading toast
            toast.dismiss("bulk-delete-loading");

            invalidateVisitorQueries(queryClient);

            if (data.successful.length > 0) {
                toast.success(`ลบผู้เยี่ยมภายนอกสำเร็จ ${data.successful.length} คน`, {
                    description: data.failed.length > 0
                        ? `มีข้อผิดพลาดในการลบ ${data.failed.length} คน`
                        : "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
                });
            }

            if (data.failed.length > 0 && data.successful.length === 0) {
                toast.error(`ไม่สามารถลบผู้เยี่ยมภายนอกได้ทั้งหมด`, {
                    description: `เกิดข้อผิดพลาดในการลบ ${data.failed.length} คน`,
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