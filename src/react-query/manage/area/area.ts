// src/react-query/manage/area/area.ts
import { useQuery } from "@tanstack/react-query";
import {
    getArea,
    getAllArea,
    getUserAuthorizedAreas,
    getAreaById,
    AreaRequest,
    AreaResponse,
    AreaItem
} from "@/api/area/area";

export const useAreaListQuery = (payloadQuery: AreaRequest) => {
    const query = useQuery<AreaResponse, Error>({
        queryKey: ["areaList", payloadQuery],
        queryFn: () => getArea(payloadQuery),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

export const useAreaAllListQuery = () => {
    const query = useQuery<AreaItem[], Error>({
        queryKey: ["areaList"],
        queryFn: () => getAllArea(),
        select(dataList) {
            return dataList;
        },
        retry: false,
    });
    return { ...query };
};

// Hook for getting areas that current user can authorize vehicles to access
export const useUserAuthorizedAreasQuery = () => {
    const query = useQuery<AreaItem[], Error>({
        queryKey: ["userAuthorizedAreas"],
        queryFn: () => getUserAuthorizedAreas(),
        select(dataList) {
            return dataList;
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
    return { ...query };
};

export const useAreaByIdQuery = (id: string) => {
    const query = useQuery<AreaItem, Error>({
        queryKey: ["area", id],
        queryFn: () => getAreaById(id),
        enabled: !!id,
        retry: false,
    });
    return { ...query };
};