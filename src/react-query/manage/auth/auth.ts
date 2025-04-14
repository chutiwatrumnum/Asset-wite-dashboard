import { useQuery } from "@tanstack/react-query";
import { getSaff, saffRequest, saffResponse } from "@/api/auth/auth";

export const useSaffListQuery = (payloadQuery: saffRequest) => {
    const query = useQuery<saffResponse, Error>({
        queryKey: ["saffList", payloadQuery],
        queryFn: () => getSaff(payloadQuery),
        select(dataList) {
         return dataList
        },
        retry: false,
    });
    return { ...query };
};

