// src/api/vehicle_access/vehicle_access.ts
import Pb from "../pocketbase";

const collectionName = "passage_log"; // ใช้ collection เดิมแต่ปรับ concept

// Types สำหรับ Vehicle Access Control
export interface VehicleAccessItem {
    collectionId: string;
    collectionName: string;
    id: string;
    isSuccess: boolean;
    tier: "resident" | "staff" | "guest" | "unknown";
    reader: string;
    gate: string;
    house_id: string;
    gate_state: "enabled" | "disabled";
    license_plate: string;
    region: string;
    area_code: string;
    full_snapshot: string;
    lp_snapshot: string;
    snapshot_info: string;
    note: string;
    created: string;
    updated: string;

    // Expanded relations (ถ้ามี)
    expand?: {
        house_id?: any;
        reader?: any;
        gate?: any;
    };
}

export interface SnapshotInfo {
    confidence: number;
    processing_time: number;
    camera_id: string;
    [key: string]: any;
}

export interface VehicleAccessRequest {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
}

export interface VehicleAccessResponse {
    items: VehicleAccessItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

export interface NewVehicleAccessRequest {
    id?: string;
    isSuccess?: boolean;
    tier: "resident" | "staff" | "guest" | "unknown";
    reader: string;
    gate: string;
    house_id?: string;
    gate_state?: "enabled" | "disabled";
    license_plate: string;
    region?: string;
    area_code: string;
    full_snapshot?: File | string;
    lp_snapshot?: File | string;
    snapshot_info?: string;
    note?: string;
}

// API Functions
const getVehicleAccess = async (request: VehicleAccessRequest): Promise<VehicleAccessResponse> => {
    try {
        const vehicleAccessList = await Pb.collection(collectionName).getList<VehicleAccessItem>(
            request.page || 1,
            request.perPage || 50,
            {
                filter: request.filter || "",
                sort: request.sort || "-created",
                expand: "house_id,reader,gate",
            }
        );
        return vehicleAccessList;
    } catch (error) {
        console.error("Error fetching vehicle access list:", error);
        throw error;
    }
};

const getAllVehicleAccess = async (): Promise<VehicleAccessItem[]> => {
    try {
        const vehicleAccessList = await Pb.collection(collectionName).getFullList<VehicleAccessItem>({
            sort: "-created",
            expand: "house_id,reader,gate",
            requestKey: `getAllVehicleAccess_${Date.now()}`,
        });
        return vehicleAccessList;
    } catch (error) {
        console.error("Error fetching all vehicle access:", error);
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                return await Pb.collection(collectionName).getFullList<VehicleAccessItem>({
                    sort: "-created",
                    expand: "house_id,reader,gate",
                    requestKey: `getAllVehicleAccess_retry_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

const getVehicleAccessById = async (id: string): Promise<VehicleAccessItem> => {
    try {
        const vehicleAccess = await Pb.collection(collectionName).getOne<VehicleAccessItem>(id, {
            expand: "house_id,reader,gate",
        });
        return vehicleAccess;
    } catch (error) {
        console.error(`Error fetching vehicle access with id ${id}:`, error);
        throw error;
    }
};

const getRecentVehicleAccess = async (withinHours: number = 24): Promise<VehicleAccessItem[]> => {
    try {
        const now = new Date();
        const pastDate = new Date();
        pastDate.setHours(now.getHours() - withinHours);

        const vehicleAccessList = await Pb.collection(collectionName).getFullList<VehicleAccessItem>({
            filter: `created>="${pastDate.toISOString()}"`,
            expand: "house_id,reader,gate",
            sort: "-created",
            requestKey: `getRecentVehicleAccess_${withinHours}_${Date.now()}`,
        });
        return vehicleAccessList;
    } catch (error) {
        console.error(`Error fetching recent vehicle access:`, error);
        throw error;
    }
};

const createVehicleAccess = async (data: NewVehicleAccessRequest): Promise<VehicleAccessItem> => {
    try {
        console.log("Creating vehicle access with request:", data);

        const formData = new FormData();

        // Required fields
        formData.append("tier", data.tier);
        formData.append("reader", data.reader);
        formData.append("gate", data.gate);
        formData.append("license_plate", data.license_plate);
        formData.append("area_code", data.area_code);

        // Optional fields
        if (data.isSuccess !== undefined) formData.append("isSuccess", data.isSuccess.toString());
        if (data.house_id) formData.append("house_id", data.house_id);
        if (data.gate_state) formData.append("gate_state", data.gate_state);
        if (data.region) formData.append("region", data.region);
        if (data.note) formData.append("note", data.note);
        if (data.snapshot_info) formData.append("snapshot_info", data.snapshot_info);

        // File uploads
        if (data.full_snapshot instanceof File) {
            formData.append("full_snapshot", data.full_snapshot);
        } else if (typeof data.full_snapshot === 'string' && data.full_snapshot) {
            formData.append("full_snapshot", data.full_snapshot);
        }

        if (data.lp_snapshot instanceof File) {
            formData.append("lp_snapshot", data.lp_snapshot);
        } else if (typeof data.lp_snapshot === 'string' && data.lp_snapshot) {
            formData.append("lp_snapshot", data.lp_snapshot);
        }

        const result = await Pb.collection(collectionName).create<VehicleAccessItem>(formData);
        console.log("Vehicle access created successfully:", result);
        return result;
    } catch (error) {
        console.error("Error creating vehicle access:", error);
        throw error;
    }
};

const updateVehicleAccess = async (data: NewVehicleAccessRequest): Promise<VehicleAccessItem> => {
    if (!data.id) {
        throw new Error("Vehicle Access ID is required for editing");
    }

    try {
        const formData = new FormData();

        // Update fields
        formData.append("tier", data.tier);
        formData.append("reader", data.reader);
        formData.append("gate", data.gate);
        formData.append("license_plate", data.license_plate);
        formData.append("area_code", data.area_code);

        if (data.isSuccess !== undefined) formData.append("isSuccess", data.isSuccess.toString());
        if (data.house_id) formData.append("house_id", data.house_id);
        if (data.gate_state) formData.append("gate_state", data.gate_state);
        if (data.region) formData.append("region", data.region);
        if (data.note) formData.append("note", data.note);
        if (data.snapshot_info) formData.append("snapshot_info", data.snapshot_info);

        // File uploads
        if (data.full_snapshot instanceof File) {
            formData.append("full_snapshot", data.full_snapshot);
        }
        if (data.lp_snapshot instanceof File) {
            formData.append("lp_snapshot", data.lp_snapshot);
        }

        const result = await Pb.collection(collectionName).update<VehicleAccessItem>(data.id, formData);
        return result;
    } catch (error) {
        console.error("Error updating vehicle access:", error);
        throw error;
    }
};

const deleteVehicleAccess = async (id: string): Promise<null> => {
    try {
        if (!id) {
            throw new Error("Vehicle Access ID is required");
        }
        await Pb.collection(collectionName).delete(id);
        return null;
    } catch (error) {
        console.error(`Error deleting vehicle access with id ${id}:`, error);
        throw error;
    }
};

// Search function
const searchVehicleAccess = async (searchParams: {
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
}): Promise<VehicleAccessItem[]> => {
    try {
        const filters: string[] = [];

        if (searchParams.licensePlate) {
            filters.push(`license_plate~"${searchParams.licensePlate}"`);
        }
        if (searchParams.tier) {
            filters.push(`tier="${searchParams.tier}"`);
        }
        if (searchParams.areaCode) {
            filters.push(`area_code="${searchParams.areaCode}"`);
        }
        if (searchParams.gateState) {
            filters.push(`gate_state="${searchParams.gateState}"`);
        }
        if (searchParams.gate) {
            filters.push(`gate="${searchParams.gate}"`);
        }
        if (searchParams.reader) {
            filters.push(`reader="${searchParams.reader}"`);
        }
        if (searchParams.houseId) {
            filters.push(`house_id="${searchParams.houseId}"`);
        }
        if (searchParams.isSuccess !== undefined) {
            filters.push(`isSuccess=${searchParams.isSuccess}`);
        }
        if (searchParams.startDate) {
            filters.push(`created>="${searchParams.startDate}"`);
        }
        if (searchParams.endDate) {
            filters.push(`created<="${searchParams.endDate}"`);
        }

        const filter = filters.length > 0 ? filters.join(" && ") : "";

        const vehicleAccessList = await Pb.collection(collectionName).getFullList<VehicleAccessItem>({
            filter: filter,
            expand: "house_id,reader,gate",
            sort: "-created",
        });

        return vehicleAccessList;
    } catch (error) {
        console.error("Error searching vehicle access:", error);
        throw error;
    }
};

export {
    getVehicleAccess,
    getAllVehicleAccess,
    getVehicleAccessById,
    getRecentVehicleAccess,
    createVehicleAccess,
    updateVehicleAccess,
    deleteVehicleAccess,
    searchVehicleAccess,
};