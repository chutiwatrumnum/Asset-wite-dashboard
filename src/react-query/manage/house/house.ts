import { useQuery } from "@tanstack/react-query";
import { gethouse, HouseRequest, HouseResponse } from "@/api/house/house";

export const useHouseListQuery = (payloadQuery: HouseRequest) => {
    const query = useQuery<HouseResponse, Error>({
        queryKey: ["houseList", payloadQuery],
        queryFn: () => gethouse(payloadQuery),
        select(dataList) {
         return dataList
        },
        retry: false,
    });
    return { ...query };
};
