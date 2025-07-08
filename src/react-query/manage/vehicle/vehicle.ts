// src/react-query/manage/vehicle/vehicle.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createVehicle,
    deleteVehicle,
    editVehicle,
    getAllVehicle,
    getVehicle,
    getVehicleById,
    getVehicleByLicensePlate,
    getVehiclesByTier,
    getVehiclesByTiers,
    getVehiclesByHouse,
    getVehiclesByArea,
    getActiveVehicles,
    getExpiringVehicles,
    bulkDeleteVehicles,
    searchVehicles,
    patchVehicle,
    stampVehicle,
    newVehicleRequest,
    vehicleItem,
    vehicleRequest,
    vehicleResponse
} from "@/api/vehicle/vehicle";
import { toast } from "sonner";

// Query hooks
export const useVehicleListQuery = (payloadQuery: vehicleRequest) => {
    const query = useQuery<vehicleResponse, Error>({
        queryKey: ["vehicleList", payloadQuery],
        queryFn: () => getVehicle(payloadQuery),
        retry: false,
        staleTime: 30000, // 30 seconds
    });
    return { ...query };
};

export const useVehicleAllListQuery = () => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehicleList"],
        queryFn: () => getAllVehicle(),
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
        gcTime: 5 * 60 * 1000, // 5 minutes (เปลี่ยนจาก cacheTime)
        refetchOnWindowFocus: false, // ปิดการ refetch เมื่อ focus window
        refetchOnMount: 'always', // refetch เมื่อ mount component
    });
    return { ...query };
};

export const useVehicleByIdQuery = (id: string) => {
    const query = useQuery<vehicleItem, Error>({
        queryKey: ["vehicle", id],
        queryFn: () => getVehicleById(id),
        enabled: !!id,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVehicleByLicensePlateQuery = (licensePlate: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehicleByLicensePlate", licensePlate],
        queryFn: () => getVehicleByLicensePlate(licensePlate),
        enabled: !!licensePlate && licensePlate.trim().length > 0,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVehiclesByTierQuery = (tier: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehiclesByTier", tier],
        queryFn: () => getVehiclesByTier(tier),
        enabled: !!tier,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVehiclesByTiersQuery = (tiers: string[]) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehiclesByTiers", tiers],
        queryFn: () => getVehiclesByTiers(tiers),
        enabled: !!tiers && tiers.length > 0,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVehiclesByHouseQuery = (houseId: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehiclesByHouse", houseId],
        queryFn: () => getVehiclesByHouse(houseId),
        enabled: !!houseId,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useVehiclesByAreaQuery = (areaId: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehiclesByArea", areaId],
        queryFn: () => getVehiclesByArea(areaId),
        enabled: !!areaId,
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

export const useActiveVehiclesQuery = () => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["activeVehicles"],
        queryFn: () => getActiveVehicles(),
        retry: false,
        staleTime: 60000, // 1 minute
    });
    return { ...query };
};

export const useExpiringVehiclesQuery = (withinDays: number = 7) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["expiringVehicles", withinDays],
        queryFn: () => getExpiringVehicles(withinDays),
        retry: (failureCount, error) => {
            // ถ้าเป็น auto-cancellation ให้ retry
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

export const useSearchVehiclesQuery = (searchParams: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    houseId?: string;
    issuer?: string;
    stamper?: string;
    startDate?: string;
    endDate?: string;
    isExpired?: boolean;
    isActive?: boolean;
}) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["searchVehicles", searchParams],
        queryFn: () => searchVehicles(searchParams),
        enabled: Object.values(searchParams).some(value =>
            value !== undefined && value !== null && value !== ""
        ),
        retry: false,
        staleTime: 30000,
    });
    return { ...query };
};

// Mutation hooks
const invalidateVehicleQueries = (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ["vehicleList"] });
    queryClient.invalidateQueries({ queryKey: ["vehicle"] });
    queryClient.invalidateQueries({ queryKey: ["vehicleByLicensePlate"] });
    queryClient.invalidateQueries({ queryKey: ["vehiclesByTier"] });
    queryClient.invalidateQueries({ queryKey: ["vehiclesByTiers"] });
    queryClient.invalidateQueries({ queryKey: ["vehiclesByHouse"] });
    queryClient.invalidateQueries({ queryKey: ["vehiclesByArea"] });
    queryClient.invalidateQueries({ queryKey: ["activeVehicles"] });
    queryClient.invalidateQueries({ queryKey: ["expiringVehicles"] });
    queryClient.invalidateQueries({ queryKey: ["searchVehicles"] });
};

export const useCreateVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<vehicleItem, Error, newVehicleRequest>({
        mutationFn: createVehicle,
        onSuccess: (data) => {
            invalidateVehicleQueries(queryClient);

            toast.success("เพิ่มยานพาหนะสำเร็จ", {
                description: `เพิ่มยานพาหนะ ${data.license_plate} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Create vehicle error:", error);

            toast.error("ไม่สามารถเพิ่มยานพาหนะได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useEditVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<vehicleItem, Error, newVehicleRequest>({
        mutationFn: editVehicle,
        onSuccess: (data) => {
            invalidateVehicleQueries(queryClient);

            toast.success("อัปเดตยานพาหนะสำเร็จ", {
                description: `อัปเดตข้อมูลยานพาหนะ ${data.license_plate} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Edit vehicle error:", error);

            toast.error("ไม่สามารถอัปเดตยานพาหนะได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const usePatchVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        vehicleItem,
        Error,
        { id: string; data: Partial<Omit<newVehicleRequest, 'id'>> }
    >({
        mutationFn: ({ id, data }) => patchVehicle(id, data),
        onSuccess: (data) => {
            invalidateVehicleQueries(queryClient);

            toast.success("อัปเดตข้อมูลสำเร็จ", {
                description: `อัปเดตข้อมูลบางส่วนของยานพาหนะ ${data.license_plate} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Patch vehicle error:", error);

            toast.error("ไม่สามารถอัปเดตข้อมูลได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useStampVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        vehicleItem,
        Error,
        { id: string; stamperId?: string; stampedTime?: string }
    >({
        mutationFn: ({ id, stamperId, stampedTime }) => stampVehicle(id, stamperId, stampedTime),
        onSuccess: (data) => {
            invalidateVehicleQueries(queryClient);

            toast.success("ประทับตราสำเร็จ", {
                description: `ประทับตรายานพาหนะ ${data.license_plate} เรียบร้อยแล้ว`,
            });
        },
        onError: (error: Error) => {
            console.error("Stamp vehicle error:", error);

            toast.error("ไม่สามารถประทับตราได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

export const useDeleteVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: deleteVehicle,
        onSuccess: () => {
            invalidateVehicleQueries(queryClient);

            toast.success("ลบยานพาหนะสำเร็จ", {
                description: "ข้อมูลยานพาหนะถูกลบออกจากระบบเรียบร้อยแล้ว",
            });
        },
        onError: (error: Error) => {
            console.error("Delete vehicle error:", error);

            toast.error("ไม่สามารถลบยานพาหนะได้", {
                description: error.message,
            });
        },
    });

    return mutation;
};

// Bulk delete mutation for vehicles
export const useBulkDeleteVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<
        { successful: string[], failed: string[] },
        Error,
        string[]
    >({
        mutationFn: bulkDeleteVehicles,
        onMutate: async (vehicleIds) => {
            // Show loading toast
            toast.loading(`กำลังลบยานพาหนะ ${vehicleIds.length} คัน...`, {
                id: "bulk-delete-loading",
            });
        },
        onSuccess: (data, variables) => {
            // Dismiss loading toast
            toast.dismiss("bulk-delete-loading");

            invalidateVehicleQueries(queryClient);

            if (data.successful.length > 0) {
                toast.success(`ลบยานพาหนะสำเร็จ ${data.successful.length} คัน`, {
                    description: data.failed.length > 0
                        ? `มีข้อผิดพลาดในการลบ ${data.failed.length} คัน`
                        : "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
                });
            }

            if (data.failed.length > 0 && data.successful.length === 0) {
                toast.error(`ไม่สามารถลบยานพาหนะได้ทั้งหมด`, {
                    description: `เกิดข้อผิดพลาดในการลบ ${data.failed.length} คัน`,
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