// src/api/external_vehicle/visitor.ts
import Pb from "../pocketbase";

const collectionName = "visitor";

// Types
export interface VisitorVehicle {
    license_plate: string;
    area_code: string;
}

export interface newVisitorRequest {
    id?: string;
    first_name: string;
    last_name: string;
    gender: "male" | "female" | "other";
    id_card?: string;
    authorized_area: string[]; // Array of RELATION_RECORD_ID
    house_id: string; // RELATION_RECORD_ID
    vehicle: VisitorVehicle;
    issuer?: string; // ID of who created this record
    stamper?: string; // ID of who stamped/approved this record
    stamped_time?: string; // DateTime string เวลาที่ stamped
    note?: string;
}

export interface VisitorItem {
    collectionId: string;
    collectionName: string;
    id: string;
    first_name: string;
    last_name: string;
    gender: "male" | "female" | "other";
    id_card: string;
    authorized_area: string[]; // Array of RELATION_RECORD_ID
    house_id: string; // RELATION_RECORD_ID
    vehicle: VisitorVehicle;
    issuer: string;
    stamper: string;
    stamped_time: string;
    note: string;
    created: string;
    updated: string;
    // Expanded relation fields
    expand?: {
        house_id?: any;
        authorized_area?: any[];
        issuer?: any;
        stamper?: any;
    };
}

export interface VisitorRequest {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
}

export interface VisitorResponse {
    items: VisitorItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

// Utility functions for data validation and processing
const validateVisitorData = (data: newVisitorRequest): void => {
    if (!data.first_name?.trim()) {
        throw new Error("ชื่อเป็นข้อมูลที่จำเป็น");
    }

    if (!data.last_name?.trim()) {
        throw new Error("นามสกุลเป็นข้อมูลที่จำเป็น");
    }

    if (!data.house_id) {
        throw new Error("บ้านเป็นข้อมูลที่จำเป็น");
    }

    if (!data.vehicle?.license_plate?.trim()) {
        throw new Error("ป้ายทะเบียนเป็นข้อมูลที่จำเป็น");
    }

    if (!data.vehicle?.area_code) {
        throw new Error("รหัสพื้นที่เป็นข้อมูลที่จำเป็น");
    }

    // Validate gender
    const validGenders = ["male", "female", "other"];
    if (!validGenders.includes(data.gender)) {
        throw new Error("เพศไม่ถูกต้อง");
    }

    // Validate authorized_area is array
    if (data.authorized_area && !Array.isArray(data.authorized_area)) {
        throw new Error("authorized_area ต้องเป็น array");
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

const prepareVisitorData = (data: newVisitorRequest): Record<string, any> => {
    validateVisitorData(data);

    const preparedData: Record<string, any> = {
        // Required fields
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        gender: data.gender,
        house_id: data.house_id,
        vehicle: {
            license_plate: data.vehicle.license_plate.trim().toUpperCase(),
            area_code: data.vehicle.area_code,
        },
        issuer: data.issuer || Pb.authStore.record?.id || "",

        // authorized_area เป็น array เสมอ
        authorized_area: Array.isArray(data.authorized_area) ? data.authorized_area : [],

        // Optional fields - ส่งเป็น empty string ถ้าไม่มีค่า
        id_card: data.id_card || "",
        stamper: data.stamper || "",
        note: data.note || "",
    };

    // DateTime fields - format เป็น ISO string ถ้ามีค่า
    preparedData.stamped_time = formatDateTimeField(data.stamped_time);

    return preparedData;
};

// API Functions
const getVisitor = async (request: VisitorRequest): Promise<VisitorResponse> => {
    try {
        const visitorList = await Pb.collection(collectionName).getList<VisitorItem>(
            request.page || 1,
            request.perPage || 10,
            {
                filter: request.filter || "",
                sort: request.sort || "-created",
                expand: "house_id,authorized_area,issuer,stamper", // Expand related records
            }
        );
        return visitorList;
    } catch (error) {
        console.error("Error fetching visitor list:", error);
        throw error;
    }
};

const getAllVisitor = async (): Promise<VisitorItem[]> => {
    try {
        // เพิ่ม requestKey เพื่อป้องกัน auto-cancellation
        const visitorList = await Pb.collection(collectionName).getFullList<VisitorItem>({
            sort: "-created",
            expand: "house_id,authorized_area,issuer,stamper", // Expand related records
            requestKey: `getAllVisitor_${Date.now()}`, // เพิ่ม unique key
        });
        return visitorList;
    } catch (error) {
        console.error("Error fetching all visitors:", error);
        // ตรวจสอบว่าเป็น auto-cancellation หรือไม่
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                // ลองใหม่หลังจาก delay สั้นๆ
                await new Promise(resolve => setTimeout(resolve, 100));
                return await Pb.collection(collectionName).getFullList<VisitorItem>({
                    sort: "-created",
                    expand: "house_id,authorized_area,issuer,stamper",
                    requestKey: `getAllVisitor_retry_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

const getVisitorById = async (id: string): Promise<VisitorItem> => {
    try {
        const visitor = await Pb.collection(collectionName).getOne<VisitorItem>(id, {
            expand: "house_id,authorized_area,issuer,stamper", // Expand related records
        });
        return visitor;
    } catch (error) {
        console.error(`Error fetching visitor with id ${id}:`, error);
        throw error;
    }
};

// Get visitors by license plate
const getVisitorByLicensePlate = async (licensePlate: string): Promise<VisitorItem[]> => {
    try {
        if (!licensePlate?.trim()) {
            throw new Error("License plate is required");
        }

        const visitors = await Pb.collection(collectionName).getFullList<VisitorItem>({
            filter: `vehicle.license_plate = "${licensePlate.trim()}"`,
            expand: "house_id,authorized_area,issuer,stamper",
            sort: "-created",
        });
        return visitors;
    } catch (error) {
        console.error(`Error fetching visitor with license plate ${licensePlate}:`, error);
        throw error;
    }
};

// Get visitors by house
const getVisitorsByHouse = async (houseId: string): Promise<VisitorItem[]> => {
    try {
        if (!houseId) {
            throw new Error("House ID is required");
        }

        const visitors = await Pb.collection(collectionName).getFullList<VisitorItem>({
            filter: `house_id = "${houseId}"`,
            expand: "house_id,authorized_area,issuer,stamper",
            sort: "-created",
        });
        return visitors;
    } catch (error) {
        console.error(`Error fetching visitors for house ${houseId}:`, error);
        throw error;
    }
};

// Get visitors by area
const getVisitorsByArea = async (areaId: string): Promise<VisitorItem[]> => {
    try {
        if (!areaId) {
            throw new Error("Area ID is required");
        }

        const visitors = await Pb.collection(collectionName).getFullList<VisitorItem>({
            filter: `authorized_area ~ "${areaId}"`,
            expand: "house_id,authorized_area,issuer,stamper",
            sort: "-created",
        });
        return visitors;
    } catch (error) {
        console.error(`Error fetching visitors for area ${areaId}:`, error);
        throw error;
    }
};

// Get visitors by gender
const getVisitorsByGender = async (gender: "male" | "female" | "other"): Promise<VisitorItem[]> => {
    try {
        if (!gender) {
            throw new Error("Gender is required");
        }

        const visitors = await Pb.collection(collectionName).getFullList<VisitorItem>({
            filter: `gender = "${gender}"`,
            expand: "house_id,authorized_area,issuer,stamper",
            sort: "-created",
        });
        return visitors;
    } catch (error) {
        console.error(`Error fetching visitors with gender ${gender}:`, error);
        throw error;
    }
};

const deleteVisitor = async (id: string): Promise<null> => {
    try {
        if (!id) {
            throw new Error("Visitor ID is required");
        }

        await Pb.collection(collectionName).delete(id);
        return null;
    } catch (error) {
        console.error(`Error deleting visitor with id ${id}:`, error);
        throw error;
    }
};

const createVisitor = async (newVisitorReq: newVisitorRequest): Promise<VisitorItem> => {
    try {
        console.log("Creating visitor with request:", newVisitorReq);

        // Check authentication
        if (!Pb.authStore.record?.id) {
            throw new Error("User not authenticated");
        }

        // Prepare and validate data
        const data = prepareVisitorData(newVisitorReq);

        console.log("Final data to be sent:", data);

        // Call API
        const result = await Pb.collection(collectionName).create<VisitorItem>(data);
        console.log("Visitor created successfully:", result);

        return result;
    } catch (error) {
        console.error("Error creating visitor:", error);
        throw error;
    }
};

const editVisitor = async (visitorReq: newVisitorRequest): Promise<VisitorItem> => {
    if (!visitorReq.id) {
        throw new Error("Visitor ID is required for editing");
    }

    try {
        // Prepare and validate data
        const data = prepareVisitorData(visitorReq);

        console.log("Updating visitor with data:", data);

        // Use PocketBase's update function
        const result = await Pb.collection(collectionName).update<VisitorItem>(visitorReq.id, data);
        return result;
    } catch (error) {
        console.error("Error updating visitor:", error);
        throw error;
    }
};

// Additional function for partial updates (PATCH-like behavior)

const patchVisitor = async (
    id: string,
    patchData: Partial<Omit<newVisitorRequest, 'id'>>
): Promise<VisitorItem> => {
    try {
        if (!id) {
            throw new Error("Visitor ID is required");
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

        console.log("Patching visitor with data:", updateData);

        const result = await Pb.collection(collectionName).update<VisitorItem>(id, updateData);
        return result;
    } catch (error) {
        console.error("Error patching visitor:", error);
        throw error;
    }
};

// Function to stamp a visitor (approve/validate)
const stampVisitor = async (
    id: string,
    stamperId?: string,
    stampedTime?: string
): Promise<VisitorItem> => {
    try {
        if (!id) {
            throw new Error("Visitor ID is required");
        }

        const updateData = {
            stamper: stamperId || Pb.authStore.record?.id || "",
            stamped_time: stampedTime || new Date().toISOString()
        };

        const result = await Pb.collection(collectionName).update<VisitorItem>(id, updateData);
        return result;
    } catch (error) {
        console.error("Error stamping visitor:", error);
        throw error;
    }
};

// Bulk operations
const bulkDeleteVisitors = async (ids: string[]): Promise<{ successful: string[], failed: string[] }> => {
    const results = { successful: [] as string[], failed: [] as string[] };

    for (const id of ids) {
        try {
            await deleteVisitor(id);
            results.successful.push(id);
        } catch (error) {
            console.error(`Failed to delete visitor ${id}:`, error);
            results.failed.push(id);
        }
    }

    return results;
};

// Advanced search function
const searchVisitors = async (searchParams: {
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
}): Promise<VisitorItem[]> => {
    try {
        const filters: string[] = [];

        if (searchParams.firstName) {
            filters.push(`first_name ~ "${searchParams.firstName}"`);
        }

        if (searchParams.lastName) {
            filters.push(`last_name ~ "${searchParams.lastName}"`);
        }

        if (searchParams.licensePlate) {
            filters.push(`vehicle.license_plate ~ "${searchParams.licensePlate}"`);
        }

        if (searchParams.gender) {
            filters.push(`gender = "${searchParams.gender}"`);
        }

        if (searchParams.houseId) {
            filters.push(`house_id = "${searchParams.houseId}"`);
        }

        if (searchParams.issuer) {
            filters.push(`issuer = "${searchParams.issuer}"`);
        }

        if (searchParams.stamper) {
            filters.push(`stamper = "${searchParams.stamper}"`);
        }

        if (searchParams.idCard) {
            filters.push(`id_card ~ "${searchParams.idCard}"`);
        }

        if (searchParams.startDate) {
            filters.push(`created >= "${searchParams.startDate}"`);
        }

        if (searchParams.endDate) {
            filters.push(`created <= "${searchParams.endDate}"`);
        }

        const filter = filters.length > 0 ? filters.join(" && ") : "";

        const visitors = await Pb.collection(collectionName).getFullList<VisitorItem>({
            filter: filter,
            expand: "house_id,authorized_area,issuer,stamper",
            sort: "-created",
        });

        return visitors;
    } catch (error) {
        console.error("Error searching visitors:", error);
        throw error;
    }
};

export {
    getVisitor,
    getAllVisitor,
    getVisitorById,
    getVisitorByLicensePlate,
    getVisitorsByHouse,
    getVisitorsByArea,
    getVisitorsByGender,
    deleteVisitor,
    createVisitor,
    editVisitor,
    patchVisitor,
    stampVisitor,
    bulkDeleteVisitors,
    searchVisitors,
};