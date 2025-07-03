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
    getVehiclesByHouse,
    getActiveVehicles,
    newVehicleRequest,
    vehicleItem,
    vehicleRequest,
    vehicleResponse
} from "@/api/vehicle/vehicle";
import { toast } from "sonner";

export const useVehicleListQuery = (payloadQuery: vehicleRequest) => {
    const query = useQuery<vehicleResponse, Error>({
        queryKey: ["vehicleList", payloadQuery],
        queryFn: () => getVehicle(payloadQuery),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

export const useVehicleAllListQuery = () => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehicleList"],
        queryFn: () => getAllVehicle(),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

export const useVehicleByIdQuery = (id: string) => {
    const query = useQuery<vehicleItem, Error>({
        queryKey: ["vehicle", id],
        queryFn: () => getVehicleById(id),
        enabled: !!id,
        retry: false,
    });
    return { ...query };
};

// New hooks for additional functions
export const useVehicleByLicensePlateQuery = (licensePlate: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehicleByLicensePlate", licensePlate],
        queryFn: () => getVehicleByLicensePlate(licensePlate),
        enabled: !!licensePlate,
        retry: false,
    });
    return { ...query };
};

export const useVehiclesByTierQuery = (tier: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehiclesByTier", tier],
        queryFn: () => getVehiclesByTier(tier),
        enabled: !!tier,
        retry: false,
    });
    return { ...query };
};

export const useVehiclesByHouseQuery = (houseId: string) => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["vehiclesByHouse", houseId],
        queryFn: () => getVehiclesByHouse(houseId),
        enabled: !!houseId,
        retry: false,
    });
    return { ...query };
};

export const useActiveVehiclesQuery = () => {
    const query = useQuery<vehicleItem[], Error>({
        queryKey: ["activeVehicles"],
        queryFn: () => getActiveVehicles(),
        retry: false,
    });
    return { ...query };
};

export const useDeleteVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, string>({
        mutationFn: (vehicleId) => deleteVehicle(vehicleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicleList"] });
            queryClient.invalidateQueries({ queryKey: ["vehicle"] });
            queryClient.invalidateQueries({ queryKey: ["vehicleByLicensePlate"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByTier"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByHouse"] });
            queryClient.invalidateQueries({ queryKey: ["activeVehicles"] });
        },
    });

    return mutation;
};

export const useCreateVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, newVehicleRequest>({
        mutationFn: createVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicleList"] });
            queryClient.invalidateQueries({ queryKey: ["activeVehicles"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByTier"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByHouse"] });
        },
        onError(error: Error, variables, context) {
            console.log("error:", error);
            console.log("variables:", variables);
            console.log("context:", context);
        },
    });

    return mutation;
};

export const useEditVehicleMutation = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation<null, Error, newVehicleRequest>({
        mutationFn: editVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicleList"] });
            queryClient.invalidateQueries({ queryKey: ["vehicle"] });
            queryClient.invalidateQueries({ queryKey: ["vehicleByLicensePlate"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByTier"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByHouse"] });
            queryClient.invalidateQueries({ queryKey: ["activeVehicles"] });
        },
        onError(error: Error, variables, context) {
            console.log("error:", error);
            console.log("variables:", variables);
            console.log("context:", context);
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
        mutationFn: async (vehicleIds: string[]) => {
            const results = await Promise.allSettled(
                vehicleIds.map(id => deleteVehicle(id))
            );

            const successful: string[] = [];
            const failed: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successful.push(vehicleIds[index]);
                } else {
                    failed.push(vehicleIds[index]);
                }
            });

            return { successful, failed };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["vehicleList"] });
            queryClient.invalidateQueries({ queryKey: ["vehicle"] });
            queryClient.invalidateQueries({ queryKey: ["vehicleByLicensePlate"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByTier"] });
            queryClient.invalidateQueries({ queryKey: ["vehiclesByHouse"] });
            queryClient.invalidateQueries({ queryKey: ["activeVehicles"] });

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