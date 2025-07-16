// src/api/vehicle_access/vehicle_access.ts
import Pb from "../pocketbase";

const collectionName = "passage_log";

// Types
export interface PassageLogItem {
    collectionId: string;
    collectionName: string;
    id: string;
    isSuccess: boolean;
    tier: string;
    reader: string; // RELATION_RECORD_ID
    gate: string; // RELATION_RECORD_ID
    house_id: string;
    gate_state: string;
    license_plate: string;
    region: string;
    area_code: string;
    full_snapshot: string; // filename.jpg
    lp_snapshot: string; // filename.jpg
    snapshot_info: string; // JSON
    note: string;
    created: string;
    updated: string;
    // Expanded relation fields
    expand?: {
        house_id?: any;
        reader?: any;
        gate?: any;
    };
}

export interface PassageLogRequest {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
}

export interface PassageLogResponse {
    items: PassageLogItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

// API Functions
const getPassageLog = async (request: PassageLogRequest): Promise<PassageLogResponse> => {
    try {
        const passageLogList = await Pb.collection(collectionName).getList<PassageLogItem>(
            request.page || 1,
            request.perPage || 10,
            {
                filter: request.filter || "",
                sort: request.sort || "-created",
                expand: "house_id,reader,gate", // Expand related records
            }
        );
        return passageLogList;
    } catch (error) {
        console.error("Error fetching passage log list:", error);
        throw error;
    }
};

const getAllPassageLog = async (): Promise<PassageLogItem[]> => {
    try {
        const passageLogList = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            sort: "-created",
            expand: "house_id,reader,gate",
            requestKey: `getAllPassageLog_${Date.now()}`, // เพิ่ม unique key
        });
        return passageLogList;
    } catch (error) {
        console.error("Error fetching all passage logs:", error);
        // ตรวจสอบว่าเป็น auto-cancellation หรือไม่
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                // ลองใหม่หลังจาก delay สั้นๆ
                await new Promise(resolve => setTimeout(resolve, 100));
                return await Pb.collection(collectionName).getFullList<PassageLogItem>({
                    sort: "-created",
                    expand: "house_id,reader,gate",
                    requestKey: `getAllPassageLog_retry_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

const getPassageLogById = async (id: string): Promise<PassageLogItem> => {
    try {
        const passageLog = await Pb.collection(collectionName).getOne<PassageLogItem>(id, {
            expand: "house_id,reader,gate",
        });
        return passageLog;
    } catch (error) {
        console.error(`Error fetching passage log with id ${id}:`, error);
        throw error;
    }
};

// Get passage logs by license plate
const getPassageLogByLicensePlate = async (licensePlate: string): Promise<PassageLogItem[]> => {
    try {
        if (!licensePlate?.trim()) {
            throw new Error("License plate is required");
        }

        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: `license_plate = "${licensePlate.trim()}"`,
            expand: "house_id,reader,gate",
            sort: "-created",
        });
        return passageLogs;
    } catch (error) {
        console.error(`Error fetching passage logs with license plate ${licensePlate}:`, error);
        throw error;
    }
};

// Get passage logs by success status
const getPassageLogsBySuccess = async (isSuccess: boolean): Promise<PassageLogItem[]> => {
    try {
        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: `isSuccess = ${isSuccess}`,
            expand: "house_id,reader,gate",
            sort: "-created",
        });
        return passageLogs;
    } catch (error) {
        console.error(`Error fetching passage logs with success status ${isSuccess}:`, error);
        throw error;
    }
};

// Get passage logs by tier
const getPassageLogsByTier = async (tier: string): Promise<PassageLogItem[]> => {
    try {
        if (!tier) {
            throw new Error("Tier is required");
        }

        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: `tier = "${tier}"`,
            expand: "house_id,reader,gate",
            sort: "-created",
        });
        return passageLogs;
    } catch (error) {
        console.error(`Error fetching passage logs with tier ${tier}:`, error);
        throw error;
    }
};

// Get passage logs by house
const getPassageLogsByHouse = async (houseId: string): Promise<PassageLogItem[]> => {
    try {
        if (!houseId) {
            throw new Error("House ID is required");
        }

        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: `house_id = "${houseId}"`,
            expand: "house_id,reader,gate",
            sort: "-created",
        });
        return passageLogs;
    } catch (error) {
        console.error(`Error fetching passage logs for house ${houseId}:`, error);
        throw error;
    }
};

// Get recent passage logs (within specified hours)
const getRecentPassageLogs = async (withinHours: number = 24): Promise<PassageLogItem[]> => {
    try {
        const now = new Date();
        const pastDate = new Date();
        pastDate.setHours(now.getHours() - withinHours);

        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: `created >= "${pastDate.toISOString()}"`,
            expand: "house_id,reader,gate",
            sort: "-created",
            requestKey: `getRecentPassageLogs_${withinHours}_${Date.now()}`,
        });
        return passageLogs;
    } catch (error) {
        console.error(`Error fetching recent passage logs:`, error);
        // ตรวจสอบ auto-cancellation
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                // ลองใหม่
                await new Promise(resolve => setTimeout(resolve, 100));
                const now = new Date();
                const pastDate = new Date();
                pastDate.setHours(now.getHours() - withinHours);

                return await Pb.collection(collectionName).getFullList<PassageLogItem>({
                    filter: `created >= "${pastDate.toISOString()}"`,
                    expand: "house_id,reader,gate",
                    sort: "-created",
                    requestKey: `getRecentPassageLogs_retry_${withinHours}_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

// Advanced search function
const searchPassageLogs = async (searchParams: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    houseId?: string;
    isSuccess?: boolean;
    gateState?: string;
    startDate?: string;
    endDate?: string;
}): Promise<PassageLogItem[]> => {
    try {
        const filters: string[] = [];

        if (searchParams.licensePlate) {
            filters.push(`license_plate ~ "${searchParams.licensePlate}"`);
        }

        if (searchParams.tier) {
            filters.push(`tier = "${searchParams.tier}"`);
        }

        if (searchParams.areaCode) {
            filters.push(`area_code = "${searchParams.areaCode}"`);
        }

        if (searchParams.houseId) {
            filters.push(`house_id = "${searchParams.houseId}"`);
        }

        if (searchParams.isSuccess !== undefined) {
            filters.push(`isSuccess = ${searchParams.isSuccess}`);
        }

        if (searchParams.gateState) {
            filters.push(`gate_state = "${searchParams.gateState}"`);
        }

        if (searchParams.startDate) {
            filters.push(`created >= "${searchParams.startDate}"`);
        }

        if (searchParams.endDate) {
            filters.push(`created <= "${searchParams.endDate}"`);
        }

        const filter = filters.length > 0 ? filters.join(" && ") : "";

        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: filter,
            expand: "house_id,reader,gate",
            sort: "-created",
        });

        return passageLogs;
    } catch (error) {
        console.error("Error searching passage logs:", error);
        throw error;
    }
};

export {
    getPassageLog,
    getAllPassageLog,
    getPassageLogById,
    getPassageLogByLicensePlate,
    getPassageLogsBySuccess,
    getPassageLogsByTier,
    getPassageLogsByHouse,
    getRecentPassageLogs,
    searchPassageLogs,
};