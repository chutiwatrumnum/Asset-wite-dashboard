// src/api/passage_log/passage_log.ts
import Pb from "../pocketbase";

const collectionName = "passage_log";

// Types
export interface PassageLogItem {
    collectionId: string;
    collectionName: string;
    id: string;
    visitor_name: string;
    entry_time: string; // RFC3339 format
    exit_time?: string; // RFC3339 format - optional, null if still inside
    passage_type: "entry" | "exit";
    location_area: string; // Area ID where the passage occurred
    verification_method: "qr_code" | "manual" | "vehicle_plate" | "facial_recognition";
    verification_data?: string; // QR code data, plate number, etc.
    staff_verified_by?: string; // Staff ID who verified manually
    invitation_id?: string; // Related invitation ID if applicable
    vehicle_id?: string; // Related vehicle ID if applicable
    house_id?: string; // Related house ID
    notes?: string;
    status: "success" | "failed" | "pending";
    created: string;
    updated: string;
    // Expanded relation fields
    expand?: {
        location_area?: any;
        staff_verified_by?: any;
        invitation_id?: any;
        vehicle_id?: any;
        house_id?: any;
    };
}

export interface NewPassageLogRequest {
    id?: string;
    visitor_name: string; // Required
    entry_time?: string; // Optional - defaults to now
    exit_time?: string; // Optional
    passage_type: "entry" | "exit"; // Required
    location_area: string; // Required - Area ID
    verification_method: "qr_code" | "manual" | "vehicle_plate" | "facial_recognition"; // Required
    verification_data?: string; // Optional
    staff_verified_by?: string; // Optional - Staff ID
    invitation_id?: string; // Optional - Related invitation
    vehicle_id?: string; // Optional - Related vehicle
    house_id?: string; // Optional - Related house
    notes?: string; // Optional
    status?: "success" | "failed" | "pending"; // Optional - defaults to success
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

// Utility functions for data validation and processing
const validatePassageLogData = (data: NewPassageLogRequest): void => {
    if (!data.visitor_name?.trim()) {
        throw new Error("ชื่อผู้เยี่ยมเป็นข้อมูลที่จำเป็น");
    }

    if (!data.passage_type) {
        throw new Error("ประเภทการผ่านเป็นข้อมูลที่จำเป็น");
    }

    if (!["entry", "exit"].includes(data.passage_type)) {
        throw new Error("ประเภทการผ่านต้องเป็น entry หรือ exit");
    }

    if (!data.location_area) {
        throw new Error("พื้นที่เป็นข้อมูลที่จำเป็น");
    }

    if (!data.verification_method) {
        throw new Error("วิธีการยืนยันเป็นข้อมูลที่จำเป็น");
    }

    if (!["qr_code", "manual", "vehicle_plate", "facial_recognition"].includes(data.verification_method)) {
        throw new Error("วิธีการยืนยันไม่ถูกต้อง");
    }

    // Validate times if provided
    if (data.entry_time) {
        const entryTime = new Date(data.entry_time);
        if (isNaN(entryTime.getTime())) {
            throw new Error("รูปแบบเวลาเข้าไม่ถูกต้อง");
        }
    }

    if (data.exit_time) {
        const exitTime = new Date(data.exit_time);
        if (isNaN(exitTime.getTime())) {
            throw new Error("รูปแบบเวลาออกไม่ถูกต้อง");
        }

        if (data.entry_time) {
            const entryTime = new Date(data.entry_time);
            if (exitTime <= entryTime) {
                throw new Error("เวลาออกต้องมากกว่าเวลาเข้า");
            }
        }
    }
};

const formatDateTimeField = (dateString?: string): string => {
    if (!dateString || dateString.trim() === "") {
        return "";
    }

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string: ${dateString}`);
            return "";
        }
        return date.toISOString();
    } catch (error) {
        console.error("Error formatting date:", error);
        return "";
    }
};

const preparePassageLogData = (data: NewPassageLogRequest): Record<string, any> => {
    validatePassageLogData(data);

    const preparedData: Record<string, any> = {
        // Required fields
        visitor_name: data.visitor_name.trim(),
        passage_type: data.passage_type,
        location_area: data.location_area,
        verification_method: data.verification_method,

        // Optional fields with defaults
        entry_time: data.entry_time ? formatDateTimeField(data.entry_time) : new Date().toISOString(),
        exit_time: data.exit_time ? formatDateTimeField(data.exit_time) : null,
        verification_data: data.verification_data || "",
        staff_verified_by: data.staff_verified_by || "",
        invitation_id: data.invitation_id || "",
        vehicle_id: data.vehicle_id || "",
        house_id: data.house_id || "",
        notes: data.notes || "",
        status: data.status || "success",
    };

    return preparedData;
};

// API Functions
const getPassageLog = async (request: PassageLogRequest): Promise<PassageLogResponse> => {
    try {
        const passageLogList = await Pb.collection(collectionName).getList<PassageLogItem>(
            request.page || 1,
            request.perPage || 10,
            {
                filter: request.filter || "",
                sort: request.sort || "-created",
                expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
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
            expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
            requestKey: `getAllPassageLog_${Date.now()}`,
        });
        return passageLogList;
    } catch (error) {
        console.error("Error fetching all passage logs:", error);
        // Handle auto-cancellation
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                return await Pb.collection(collectionName).getFullList<PassageLogItem>({
                    sort: "-created",
                    expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
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
            expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
        });
        return passageLog;
    } catch (error) {
        console.error(`Error fetching passage log with id ${id}:`, error);
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
            filter: `created>="${pastDate.toISOString()}"`,
            expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
            sort: "-created",
            requestKey: `getRecentPassageLogs_${withinHours}_${Date.now()}`,
        });
        return passageLogs;
    } catch (error) {
        console.error(`Error fetching recent passage logs:`, error);
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                const now = new Date();
                const pastDate = new Date();
                pastDate.setHours(now.getHours() - withinHours);

                return await Pb.collection(collectionName).getFullList<PassageLogItem>({
                    filter: `created>="${pastDate.toISOString()}"`,
                    expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
                    sort: "-created",
                    requestKey: `getRecentPassageLogs_retry_${withinHours}_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

// Get entry logs without corresponding exit
const getActiveEntries = async (): Promise<PassageLogItem[]> => {
    try {
        const entryLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: `passage_type="entry" && exit_time=""`,
            expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
            sort: "-entry_time",
        });
        return entryLogs;
    } catch (error) {
        console.error("Error fetching active entries:", error);
        throw error;
    }
};

const deletePassageLog = async (id: string): Promise<null> => {
    try {
        if (!id) {
            throw new Error("Passage Log ID is required");
        }

        await Pb.collection(collectionName).delete(id);
        return null;
    } catch (error) {
        console.error(`Error deleting passage log with id ${id}:`, error);
        throw error;
    }
};

const createPassageLog = async (newPassageLogReq: NewPassageLogRequest): Promise<PassageLogItem> => {
    try {
        console.log("Creating passage log with request:", newPassageLogReq);

        // Prepare and validate data
        const data = preparePassageLogData(newPassageLogReq);

        console.log("Final data to be sent:", data);

        // Call API
        const result = await Pb.collection(collectionName).create<PassageLogItem>(data);
        console.log("Passage log created successfully:", result);

        return result;
    } catch (error) {
        console.error("Error creating passage log:", error);
        throw error;
    }
};

const editPassageLog = async (passageLogReq: NewPassageLogRequest): Promise<PassageLogItem> => {
    if (!passageLogReq.id) {
        throw new Error("Passage Log ID is required for editing");
    }

    try {
        // Prepare and validate data
        const data = preparePassageLogData(passageLogReq);

        console.log("Updating passage log with data:", data);

        const result = await Pb.collection(collectionName).update<PassageLogItem>(passageLogReq.id, data);
        return result;
    } catch (error) {
        console.error("Error updating passage log:", error);
        throw error;
    }
};

// Partial update function
const patchPassageLog = async (
    id: string,
    patchData: Partial<Omit<NewPassageLogRequest, 'id'>>
): Promise<PassageLogItem> => {
    try {
        if (!id) {
            throw new Error("Passage Log ID is required");
        }

        const updateData: Record<string, any> = {};

        // Only include fields that are explicitly provided
        Object.keys(patchData).forEach(key => {
            const value = patchData[key as keyof typeof patchData];
            if (value !== undefined) {
                if (key.includes("_time")) {
                    updateData[key] = formatDateTimeField(value as string);
                } else {
                    updateData[key] = value;
                }
            }
        });

        console.log("Patching passage log with data:", updateData);

        const result = await Pb.collection(collectionName).update<PassageLogItem>(id, updateData);
        return result;
    } catch (error) {
        console.error("Error patching passage log:", error);
        throw error;
    }
};

// Bulk operations
const bulkDeletePassageLogs = async (ids: string[]): Promise<{ successful: string[], failed: string[] }> => {
    const results = { successful: [] as string[], failed: [] as string[] };

    for (const id of ids) {
        try {
            await deletePassageLog(id);
            results.successful.push(id);
        } catch (error) {
            console.error(`Failed to delete passage log ${id}:`, error);
            results.failed.push(id);
        }
    }

    return results;
};

// Advanced search function
const searchPassageLogs = async (searchParams: {
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
}): Promise<PassageLogItem[]> => {
    try {
        const filters: string[] = [];

        if (searchParams.visitorName) {
            filters.push(`visitor_name~"${searchParams.visitorName}"`);
        }

        if (searchParams.passageType) {
            filters.push(`passage_type="${searchParams.passageType}"`);
        }

        if (searchParams.locationArea) {
            filters.push(`location_area="${searchParams.locationArea}"`);
        }

        if (searchParams.verificationMethod) {
            filters.push(`verification_method="${searchParams.verificationMethod}"`);
        }

        if (searchParams.staffVerifiedBy) {
            filters.push(`staff_verified_by="${searchParams.staffVerifiedBy}"`);
        }

        if (searchParams.invitationId) {
            filters.push(`invitation_id="${searchParams.invitationId}"`);
        }

        if (searchParams.vehicleId) {
            filters.push(`vehicle_id="${searchParams.vehicleId}"`);
        }

        if (searchParams.houseId) {
            filters.push(`house_id="${searchParams.houseId}"`);
        }

        if (searchParams.status) {
            filters.push(`status="${searchParams.status}"`);
        }

        if (searchParams.startDate) {
            filters.push(`created>="${searchParams.startDate}"`);
        }

        if (searchParams.endDate) {
            filters.push(`created<="${searchParams.endDate}"`);
        }

        const filter = filters.length > 0 ? filters.join(" && ") : "";

        const passageLogs = await Pb.collection(collectionName).getFullList<PassageLogItem>({
            filter: filter,
            expand: "location_area,staff_verified_by,invitation_id,vehicle_id,house_id",
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
    getRecentPassageLogs,
    getActiveEntries,
    deletePassageLog,
    createPassageLog,
    editPassageLog,
    patchPassageLog,
    bulkDeletePassageLogs,
    searchPassageLogs,
};