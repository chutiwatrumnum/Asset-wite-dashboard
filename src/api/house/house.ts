import Pb from "../pocketbase";
const gethouse = async (request: HouseRequest): Promise<HouseResponse> => {
    // let baseUrl = '/api/collections/house/records';
    // const user = await encryptStorage.getItem("user");

    // if (user?.id) {
    //     baseUrl = `${baseUrl}?filter!=id="${user.id}"`;
    // }

    // const response = await axios.get<HouseResponse>(baseUrl, { params: request });
    // return response.data;
   const houseList = await Pb.collection('house').getList<HouseItem>(request.page, request.perPage);
   console.log("houseList:",houseList);
   
   return houseList
};

export { gethouse };
export interface HouseRequest {
    page?:       number;
    perPage?:    number;
    sort?:       string;
}
export interface HouseResponse {
    page:       number;
    perPage:    number;
    totalPages: number;
    totalItems: number;
    items:      HouseItem[];
}

export interface HouseItem {
    collectionId:   string;
    collectionName: string;
    id:             string;
    address:        string;
    area:           string;
    gps_location:   GpsLocation;
    created:        Date;
    updated:        Date;
}

export interface GpsLocation {
    lon: number;
    lat: number;
}