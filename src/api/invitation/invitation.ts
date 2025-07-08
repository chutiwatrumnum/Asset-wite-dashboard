// src/api/invitation/invitation.ts
import Pb from "../pocketbase";

const collectionName = "invitation";

// Types
export interface InvitationItem {
    collectionId: string;
    collectionName: string;
    id: string;
    visitor_name: string;
    start_time: string; // RFC3339 format
    expire_time: string; // RFC3339 format
    authorized_area: string[]; // Array of area IDs
    house_id: string; // admin's house_id
    note?: string;
    active: boolean;
    issuer: string; // ID of who created this record
    created: string;
    updated: string;
    // Expanded relation fields
    expand?: {
        house_id?: any;
        authorized_area?: any[];
        issuer?: any;
    };
}

export interface newInvitationRequest {
    id?: string;
    visitor_name: string; // Required
    start_time: string; // Required - RFC3339 format
    expire_time: string; // Required - RFC3339 format
    authorized_area: string[]; // Required - Array of area IDs
    house_id: string; // Required - admin's house_id
    note?: string; // Optional
    active?: boolean; // Optional - defaults to true
    issuer?: string; // Optional - will use current user if not provided
}

export interface InvitationRequest {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
}

export interface InvitationResponse {
    items: InvitationItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

// Utility functions for data validation and processing
const validateInvitationData = (data: newInvitationRequest): void => {
    if (!data.visitor_name?.trim()) {
        throw new Error("ชื่อผู้เยี่ยมเป็นข้อมูลที่จำเป็น");
    }

    if (!data.start_time) {
        throw new Error("เวลาเริ่มต้นเป็นข้อมูลที่จำเป็น");
    }

    if (!data.expire_time) {
        throw new Error("เวลาสิ้นสุดเป็นข้อมูลที่จำเป็น");
    }

    if (!data.house_id) {
        throw new Error("รหัสบ้านเป็นข้อมูลที่จำเป็น");
    }

    // Validate authorized_area is array
    if (!Array.isArray(data.authorized_area)) {
        throw new Error("authorized_area ต้องเป็น array");
    }

    if (data.authorized_area.length === 0) {
        throw new Error("ต้องระบุพื้นที่อนุญาตอย่างน้อย 1 พื้นที่");
    }

    // Validate time range
    const startTime = new Date(data.start_time);
    const expireTime = new Date(data.expire_time);

    if (isNaN(startTime.getTime()) || isNaN(expireTime.getTime())) {
        throw new Error("รูปแบบเวลาไม่ถูกต้อง");
    }

    if (startTime >= expireTime) {
        throw new Error("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
    }

    if (expireTime <= new Date()) {
        throw new Error("เวลาสิ้นสุดต้องอยู่ในอนาคต");
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

const prepareInvitationData = (data: newInvitationRequest): Record<string, any> => {
    validateInvitationData(data);

    const preparedData: Record<string, any> = {
        // Required fields
        visitor_name: data.visitor_name.trim(),
        start_time: formatDateTimeField(data.start_time),
        expire_time: formatDateTimeField(data.expire_time),
        authorized_area: data.authorized_area,
        house_id: data.house_id,
        issuer: data.issuer || Pb.authStore.record?.id || "",
        active: data.active !== undefined ? data.active : true,
        note: data.note || "",
    };

    return preparedData;
};

// API Functions
const getInvitation = async (request: InvitationRequest): Promise<InvitationResponse> => {
    try {
        const invitationList = await Pb.collection(collectionName).getList<InvitationItem>(
            request.page || 1,
            request.perPage || 10,
            {
                filter: request.filter || "",
                sort: request.sort || "-created",
                expand: "house_id,authorized_area,issuer",
            }
        );
        return invitationList;
    } catch (error) {
        console.error("Error fetching invitation list:", error);
        throw error;
    }
};

const getAllInvitation = async (): Promise<InvitationItem[]> => {
    try {
        const invitationList = await Pb.collection(collectionName).getFullList<InvitationItem>({
            sort: "-created",
            expand: "house_id,authorized_area,issuer",
            requestKey: `getAllInvitation_${Date.now()}`,
        });
        return invitationList;
    } catch (error) {
        console.error("Error fetching all invitations:", error);
        // ตรวจสอบว่าเป็น auto-cancellation หรือไม่
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                return await Pb.collection(collectionName).getFullList<InvitationItem>({
                    sort: "-created",
                    expand: "house_id,authorized_area,issuer",
                    requestKey: `getAllInvitation_retry_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

// Get invitations by issuer (current user's invitations)
const getMyInvitations = async (): Promise<InvitationItem[]> => {
    try {
        const currentUserId = Pb.authStore.record?.id;
        if (!currentUserId) {
            throw new Error("User not authenticated");
        }

        const invitationList = await Pb.collection(collectionName).getFullList<InvitationItem>({
            filter: `issuer="${currentUserId}"`,
            sort: "-created",
            expand: "house_id,authorized_area,issuer",
        });
        return invitationList;
    } catch (error) {
        console.error("Error fetching my invitations:", error);
        throw error;
    }
};

const getInvitationById = async (id: string): Promise<InvitationItem> => {
    try {
        const invitation = await Pb.collection(collectionName).getOne<InvitationItem>(id, {
            expand: "house_id,authorized_area,issuer",
        });
        return invitation;
    } catch (error) {
        console.error(`Error fetching invitation with id ${id}:`, error);
        throw error;
    }
};

// Get active invitations (not expired)
const getActiveInvitations = async (): Promise<InvitationItem[]> => {
    try {
        const currentTime = new Date().toISOString();
        const invitations = await Pb.collection(collectionName).getFullList<InvitationItem>({
            filter: `active=true && expire_time>"${currentTime}"`,
            expand: "house_id,authorized_area,issuer",
            sort: "-created",
        });
        return invitations;
    } catch (error) {
        console.error("Error fetching active invitations:", error);
        throw error;
    }
};

// Get expiring invitations (within specified hours)
const getExpiringInvitations = async (withinHours: number = 24): Promise<InvitationItem[]> => {
    try {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setHours(now.getHours() + withinHours);

        const invitations = await Pb.collection(collectionName).getFullList<InvitationItem>({
            filter: `active=true && expire_time>="${now.toISOString()}" && expire_time<="${futureDate.toISOString()}"`,
            expand: "house_id,authorized_area,issuer",
            sort: "expire_time",
            requestKey: `getExpiringInvitations_${withinHours}_${Date.now()}`,
        });
        return invitations;
    } catch (error) {
        console.error(`Error fetching expiring invitations:`, error);
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                const now = new Date();
                const futureDate = new Date();
                futureDate.setHours(now.getHours() + withinHours);

                return await Pb.collection(collectionName).getFullList<InvitationItem>({
                    filter: `active=true && expire_time>="${now.toISOString()}" && expire_time<="${futureDate.toISOString()}"`,
                    expand: "house_id,authorized_area,issuer",
                    sort: "expire_time",
                    requestKey: `getExpiringInvitations_retry_${withinHours}_${Date.now()}`,
                });
            }
        }
        throw error;
    }
};

const deleteInvitation = async (id: string): Promise<null> => {
    try {
        if (!id) {
            throw new Error("Invitation ID is required");
        }

        await Pb.collection(collectionName).delete(id);
        return null;
    } catch (error) {
        console.error(`Error deleting invitation with id ${id}:`, error);
        throw error;
    }
};

const createInvitation = async (newInvitationReq: newInvitationRequest): Promise<InvitationItem> => {
    try {
        console.log("Creating invitation with request:", newInvitationReq);

        // Check authentication
        if (!Pb.authStore.record?.id) {
            throw new Error("User not authenticated");
        }

        // Prepare and validate data
        const data = prepareInvitationData(newInvitationReq);

        console.log("Final data to be sent:", data);

        // Call API
        const result = await Pb.collection(collectionName).create<InvitationItem>(data);
        console.log("Invitation created successfully:", result);

        return result;
    } catch (error) {
        console.error("Error creating invitation:", error);
        throw error;
    }
};

const editInvitation = async (invitationReq: newInvitationRequest): Promise<InvitationItem> => {
    if (!invitationReq.id) {
        throw new Error("Invitation ID is required for editing");
    }

    try {
        // Prepare and validate data
        const data = prepareInvitationData(invitationReq);

        console.log("Updating invitation with data:", data);

        const result = await Pb.collection(collectionName).update<InvitationItem>(invitationReq.id, data);
        return result;
    } catch (error) {
        console.error("Error updating invitation:", error);
        throw error;
    }
};

// Partial update function
const patchInvitation = async (
    id: string,
    patchData: Partial<Omit<newInvitationRequest, 'id'>>
): Promise<InvitationItem> => {
    try {
        if (!id) {
            throw new Error("Invitation ID is required");
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

        console.log("Patching invitation with data:", updateData);

        const result = await Pb.collection(collectionName).update<InvitationItem>(id, updateData);
        return result;
    } catch (error) {
        console.error("Error patching invitation:", error);
        throw error;
    }
};

// Deactivate invitation (set active to false)
const deactivateInvitation = async (id: string): Promise<InvitationItem> => {
    try {
        if (!id) {
            throw new Error("Invitation ID is required");
        }

        const result = await Pb.collection(collectionName).update<InvitationItem>(id, {
            active: false
        });
        return result;
    } catch (error) {
        console.error("Error deactivating invitation:", error);
        throw error;
    }
};

// Activate invitation (set active to true)
const activateInvitation = async (id: string): Promise<InvitationItem> => {
    try {
        if (!id) {
            throw new Error("Invitation ID is required");
        }

        const result = await Pb.collection(collectionName).update<InvitationItem>(id, {
            active: true
        });
        return result;
    } catch (error) {
        console.error("Error activating invitation:", error);
        throw error;
    }
};

// Bulk operations
const bulkDeleteInvitations = async (ids: string[]): Promise<{ successful: string[], failed: string[] }> => {
    const results = { successful: [] as string[], failed: [] as string[] };

    for (const id of ids) {
        try {
            await deleteInvitation(id);
            results.successful.push(id);
        } catch (error) {
            console.error(`Failed to delete invitation ${id}:`, error);
            results.failed.push(id);
        }
    }

    return results;
};

// Advanced search function
const searchInvitations = async (searchParams: {
    visitorName?: string;
    houseId?: string;
    issuerId?: string;
    active?: boolean;
    startDate?: string;
    endDate?: string;
    isExpired?: boolean;
    isActive?: boolean;
}): Promise<InvitationItem[]> => {
    try {
        const filters: string[] = [];

        if (searchParams.visitorName) {
            filters.push(`visitor_name~"${searchParams.visitorName}"`);
        }

        if (searchParams.houseId) {
            filters.push(`house_id="${searchParams.houseId}"`);
        }

        if (searchParams.issuerId) {
            filters.push(`issuer="${searchParams.issuerId}"`);
        }

        if (searchParams.active !== undefined) {
            filters.push(`active=${searchParams.active}`);
        }

        if (searchParams.startDate) {
            filters.push(`start_time>="${searchParams.startDate}"`);
        }

        if (searchParams.endDate) {
            filters.push(`expire_time<="${searchParams.endDate}"`);
        }

        if (searchParams.isExpired !== undefined) {
            const currentTime = new Date().toISOString();
            if (searchParams.isExpired) {
                filters.push(`expire_time<"${currentTime}"`);
            } else {
                filters.push(`expire_time>"${currentTime}"`);
            }
        }

        const filter = filters.length > 0 ? filters.join(" && ") : "";

        const invitations = await Pb.collection(collectionName).getFullList<InvitationItem>({
            filter: filter,
            expand: "house_id,authorized_area,issuer",
            sort: "-created",
        });

        return invitations;
    } catch (error) {
        console.error("Error searching invitations:", error);
        throw error;
    }
};

export {
    getInvitation,
    getAllInvitation,
    getMyInvitations,
    getInvitationById,
    getActiveInvitations,
    getExpiringInvitations,
    deleteInvitation,
    createInvitation,
    editInvitation,
    patchInvitation,
    deactivateInvitation,
    activateInvitation,
    bulkDeleteInvitations,
    searchInvitations,
};