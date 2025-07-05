// src/api/area/area.ts
import Pb from "../pocketbase";

const collectionName = "area";

// Types
export interface AreaItem {
    collectionId: string;
    collectionName: string;
    id: string;
    name: string;
    description?: string;
    created: string;
    updated: string;
}

export interface AreaRequest {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
}

export interface AreaResponse {
    items: AreaItem[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

// API Functions
const getArea = async (request: AreaRequest): Promise<AreaResponse> => {
    try {
        const areaList = await Pb.collection(collectionName).getList<AreaItem>(
            request.page || 1,
            request.perPage || 50,
            {
                filter: request.filter || "",
                sort: request.sort || "name",
            }
        );
        return areaList;
    } catch (error) {
        console.error("Error fetching area list:", error);
        throw error;
    }
};

const getAllArea = async (): Promise<AreaItem[]> => {
    try {
        const areaList = await Pb.collection(collectionName).getFullList<AreaItem>({
            sort: "name",
        });
        return areaList;
    } catch (error) {
        console.error("Error fetching all areas:", error);
        throw error;
    }
};

// Get areas that current user is authorized to access
const getUserAuthorizedAreas = async (): Promise<AreaItem[]> => {
    try {
        const currentUser = Pb.authStore.record;
        if (!currentUser || !currentUser.authorized_area) {
            return [];
        }

        // Get user's authorized area IDs
        const authorizedAreaIds = Array.isArray(currentUser.authorized_area)
            ? currentUser.authorized_area
            : [currentUser.authorized_area];

        if (authorizedAreaIds.length === 0) {
            return [];
        }

        // Create filter for authorized areas
        const filter = authorizedAreaIds
            .map(id => `id="${id}"`)
            .join(" || ");

        const areaList = await Pb.collection(collectionName).getFullList<AreaItem>({
            filter: filter,
            sort: "name",
        });

        return areaList;
    } catch (error) {
        console.error("Error fetching user authorized areas:", error);
        throw error;
    }
};

const getAreaById = async (id: string): Promise<AreaItem> => {
    try {
        const area = await Pb.collection(collectionName).getOne<AreaItem>(id);
        return area;
    } catch (error) {
        console.error(`Error fetching area with id ${id}:`, error);
        throw error;
    }
};

export {
    getArea,
    getAllArea,
    getUserAuthorizedAreas,
    getAreaById,
};