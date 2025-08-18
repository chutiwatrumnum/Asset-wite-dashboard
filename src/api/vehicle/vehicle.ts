// src/api/vehicle/vehicle.ts - แก้ไขปัญหา export functions ให้ครบ
import { VEHICLE_TIERS } from "@/utils/vehicleUtils";
import Pb from "../pocketbase";

const collectionName = "vehicle";

// Types (เหมือนเดิม)
export interface newVehicleRequest {
  id?: string;
  license_plate: string;
  area_code: string;
  tier: string;
  issuer: string;
  start_time?: string;
  expire_time?: string;
  invitation?: string;
  house_id?: string;
  authorized_area?: string[];
  stamper?: string;
  stamped_time?: string;
  note?: string;
}

export interface vehicleItem {
  collectionId: string;
  collectionName: string;
  id: string;
  license_plate: string;
  area_code: string;
  tier: string;
  issuer: string;
  start_time: string;
  expire_time: string;
  invitation: string;
  house_id: string;
  authorized_area: string[];
  stamper: string;
  stamped_time: string;
  note: string;
  created: string;
  updated: string;
  expand?: {
    house_id?: any;
    invitation?: any;
    authorized_area?: any[];
    issuer?: any;
    stamper?: any;
  };
}

export interface vehicleRequest {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
}

export interface vehicleResponse {
  items: vehicleItem[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

// Utility functions
const validateVehicleData = (data: newVehicleRequest): void => {
  if (!data.license_plate?.trim()) {
    throw new Error("ป้ายทะเบียนเป็นข้อมูลที่จำเป็น");
  }

  if (!data.area_code) {
    throw new Error("รหัสพื้นที่เป็นข้อมูลที่จำเป็น");
  }

  if (!data.tier) {
    throw new Error("ระดับยานพาหนะเป็นข้อมูลที่จำเป็น");
  }

  const validTiers = Object.keys(VEHICLE_TIERS);
  if (!validTiers.includes(data.tier)) {
    throw new Error(`ระดับยานพาหนะไม่ถูกต้อง: ${data.tier}. ค่าที่ใช้ได้: ${validTiers.join(", ")}`);
  }

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

const prepareVehicleData = (data: newVehicleRequest): Record<string, any> => {
  validateVehicleData(data);

  const currentUser = Pb.getCurrentUser();
  const currentUserId = currentUser?.id || "";

  console.log("Current User for Vehicle Creation:", currentUser);
  console.log("Current User ID:", currentUserId);

  if (!currentUserId) {
    throw new Error("ไม่สามารถระบุผู้ใช้ปัจจุบันได้ กรุณาเข้าสู่ระบบใหม่");
  }

  const preparedData: Record<string, any> = {
    license_plate: data.license_plate.trim().toUpperCase(),
    area_code: data.area_code,
    tier: data.tier,
    issuer: data.issuer || currentUserId,
    authorized_area: Array.isArray(data.authorized_area) ? data.authorized_area : [],
    invitation: data.invitation || "",
    house_id: data.house_id || "",
    stamper: data.stamper || currentUserId,
    note: data.note || "",
  };

  preparedData.start_time = formatDateTimeField(data.start_time);
  preparedData.expire_time = formatDateTimeField(data.expire_time);
  preparedData.stamped_time = formatDateTimeField(data.stamped_time) || new Date().toISOString();

  console.log("Prepared Vehicle Data:", preparedData);
  return preparedData;
};

// API Functions
const getVehicle = async (request: vehicleRequest): Promise<vehicleResponse> => {
  try {
    const vehicleList = await Pb.collection(collectionName).getList<vehicleItem>(
      request.page || 1,
      request.perPage || 10,
      {
        filter: request.filter || "",
        sort: request.sort || "-created",
        expand: "house_id,invitation,authorized_area,issuer,stamper",
      }
    );
    return vehicleList;
  } catch (error) {
    console.error("Error fetching vehicle list:", error);
    throw error;
  }
};

const getAllVehicle = async (): Promise<vehicleItem[]> => {
  try {
    const vehicleList = await Pb.collection(collectionName).getFullList<vehicleItem>({
      sort: "-created",
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      requestKey: `getAllVehicle_${Date.now()}`,
    });
    return vehicleList;
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return await Pb.collection(collectionName).getFullList<vehicleItem>({
          sort: "-created",
          expand: "house_id,invitation,authorized_area,issuer,stamper",
          requestKey: `getAllVehicle_retry_${Date.now()}`,
        });
      }
    }
    throw error;
  }
};

const getVehicleById = async (id: string): Promise<vehicleItem> => {
  try {
    const vehicle = await Pb.collection(collectionName).getOne<vehicleItem>(id, {
      expand: "house_id,invitation,authorized_area,issuer,stamper",
    });
    return vehicle;
  } catch (error) {
    console.error(`Error fetching vehicle with id ${id}:`, error);
    throw error;
  }
};

const getVehicleByLicensePlate = async (licensePlate: string): Promise<vehicleItem[]> => {
  try {
    if (!licensePlate?.trim()) {
      throw new Error("License plate is required");
    }

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `license_plate = "${licensePlate.trim()}"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicle with license plate ${licensePlate}:`, error);
    throw error;
  }
};

const getVehiclesByTier = async (tier: string): Promise<vehicleItem[]> => {
  try {
    if (!tier) {
      throw new Error("Tier is required");
    }

    const validTiers = Object.keys(VEHICLE_TIERS);
    if (!validTiers.includes(tier)) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `tier = "${tier}"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicles with tier ${tier}:`, error);
    throw error;
  }
};

const getVehiclesByTiers = async (tiers: string[]): Promise<vehicleItem[]> => {
  try {
    if (!tiers || tiers.length === 0) {
      throw new Error("At least one tier is required");
    }

    const validTiers = Object.keys(VEHICLE_TIERS);
    const invalidTiers = tiers.filter(tier => !validTiers.includes(tier));
    if (invalidTiers.length > 0) {
      throw new Error(`Invalid tiers: ${invalidTiers.join(", ")}`);
    }

    const filter = tiers.map(tier => `tier = "${tier}"`).join(" || ");

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: filter,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicles with tiers ${tiers.join(", ")}:`, error);
    throw error;
  }
};

const getVehiclesByHouse = async (houseId: string): Promise<vehicleItem[]> => {
  try {
    if (!houseId) {
      throw new Error("House ID is required");
    }

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `house_id = "${houseId}"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicles for house ${houseId}:`, error);
    throw error;
  }
};

const getVehiclesByArea = async (areaId: string): Promise<vehicleItem[]> => {
  try {
    if (!areaId) {
      throw new Error("Area ID is required");
    }

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `authorized_area ~ "${areaId}"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicles for area ${areaId}:`, error);
    throw error;
  }
};

const getActiveVehicles = async (): Promise<vehicleItem[]> => {
  try {
    const currentTime = new Date().toISOString();
    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `(expire_time > "${currentTime}" || expire_time = "") && tier != "blacklisted"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error("Error fetching active vehicles:", error);
    throw error;
  }
};

const getExpiringVehicles = async (withinDays: number = 7): Promise<vehicleItem[]> => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + withinDays);

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `expire_time >= "${now.toISOString()}" && expire_time <= "${futureDate.toISOString()}"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "expire_time",
      requestKey: `getExpiringVehicles_${withinDays}_${Date.now()}`,
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching expiring vehicles:`, error);
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('autocancelled') || errorMessage.includes('aborted')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + withinDays);

        return await Pb.collection(collectionName).getFullList<vehicleItem>({
          filter: `expire_time >= "${now.toISOString()}" && expire_time <= "${futureDate.toISOString()}"`,
          expand: "house_id,invitation,authorized_area,issuer,stamper",
          sort: "expire_time",
          requestKey: `getExpiringVehicles_retry_${withinDays}_${Date.now()}`,
        });
      }
    }
    throw error;
  }
};

const createVehicle = async (newVehicleReq: newVehicleRequest): Promise<vehicleItem> => {
  try {
    console.log("Creating vehicle with request:", newVehicleReq);

    const currentUser = Pb.getCurrentUser();
    if (!currentUser?.id) {
      throw new Error("ไม่สามารถระบุผู้ใช้ปัจจุบันได้ กรุณาเข้าสู่ระบบใหม่");
    }

    console.log("Current User for Vehicle Creation:", currentUser);
    console.log("Auth Status:", Pb.isLoggedIn());

    const data = prepareVehicleData(newVehicleReq);

    console.log("Final data to be sent:", data);

    if (Pb.isUsingVMS()) {
      console.log("Using VMS mode for vehicle creation");
      console.log("VMS Config:", Pb.getVMSConfig());
    }

    try {
      const result = await Pb.collection(collectionName).create<vehicleItem>(data);
      console.log("Vehicle created successfully:", result);
      return result;
    } catch (apiError: any) {
      console.error("API Error details:", apiError);

      if (apiError.response?.data) {
        const errorData = apiError.response.data;
        console.log("PocketBase Error Response:", errorData);

        if (errorData.message) {
          throw new Error(errorData.message);
        }

        if (errorData.data) {
          const fieldErrors = Object.entries(errorData.data).map(([field, error]) => {
            return `${field}: ${error}`;
          }).join(", ");
          throw new Error(`ข้อมูลไม่ถูกต้อง - ${fieldErrors}`);
        }
      }

      if (apiError.message) {
        throw new Error(`เกิดข้อผิดพลาดในการสร้างยานพาหนะ: ${apiError.message}`);
      }

      throw new Error("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
    }

  } catch (error) {
    console.error("Error creating vehicle:", error);
    throw error;
  }
};

const editVehicle = async (vehicleReq: newVehicleRequest): Promise<vehicleItem> => {
  if (!vehicleReq.id) {
    throw new Error("Vehicle ID is required for editing");
  }

  try {
    const data = prepareVehicleData(vehicleReq);
    console.log("Updating vehicle with data:", data);
    const result = await Pb.collection(collectionName).update<vehicleItem>(vehicleReq.id, data);
    return result;
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
};

const patchVehicle = async (
  id: string,
  patchData: Partial<Omit<newVehicleRequest, 'id'>>
): Promise<vehicleItem> => {
  try {
    if (!id) {
      throw new Error("Vehicle ID is required");
    }

    const updateData: Record<string, any> = {};

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

    console.log("Patching vehicle with data:", updateData);

    const result = await Pb.collection(collectionName).update<vehicleItem>(id, updateData);
    return result;
  } catch (error) {
    console.error("Error patching vehicle:", error);
    throw error;
  }
};

const stampVehicle = async (
  id: string,
  stamperId?: string,
  stampedTime?: string
): Promise<vehicleItem> => {
  try {
    if (!id) {
      throw new Error("Vehicle ID is required");
    }

    const updateData = {
      stamper: stamperId || Pb.getCurrentUser()?.id || "",
      stamped_time: formatDateTimeField(stampedTime) || new Date().toISOString()
    };

    const result = await Pb.collection(collectionName).update<vehicleItem>(id, updateData);
    return result;
  } catch (error) {
    console.error("Error stamping vehicle:", error);
    throw error;
  }
};

const deleteVehicle = async (id: string): Promise<null> => {
  try {
    if (!id) {
      throw new Error("Vehicle ID is required");
    }

    await Pb.collection(collectionName).delete(id);
    return null;
  } catch (error) {
    console.error(`Error deleting vehicle with id ${id}:`, error);
    throw error;
  }
};

const bulkDeleteVehicles = async (ids: string[]): Promise<{ successful: string[], failed: string[] }> => {
  const results = { successful: [] as string[], failed: [] as string[] };

  for (const id of ids) {
    try {
      await deleteVehicle(id);
      results.successful.push(id);
    } catch (error) {
      console.error(`Failed to delete vehicle ${id}:`, error);
      results.failed.push(id);
    }
  }

  return results;
};

const searchVehicles = async (searchParams: {
  licensePlate?: string;
  tier?: string;
  areaCode?: string;
  houseId?: string;
  issuer?: string;
  stamper?: string;
  startDate?: string;
  endDate?: string;
  isExpired?: boolean;
  isActive?: boolean;
}): Promise<vehicleItem[]> => {
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

    if (searchParams.issuer) {
      filters.push(`issuer = "${searchParams.issuer}"`);
    }

    if (searchParams.stamper) {
      filters.push(`stamper = "${searchParams.stamper}"`);
    }

    if (searchParams.startDate) {
      filters.push(`created >= "${searchParams.startDate}"`);
    }

    if (searchParams.endDate) {
      filters.push(`created <= "${searchParams.endDate}"`);
    }

    if (searchParams.isExpired !== undefined) {
      const currentTime = new Date().toISOString();
      if (searchParams.isExpired) {
        filters.push(`expire_time < "${currentTime}"`);
      } else {
        filters.push(`(expire_time > "${currentTime}" || expire_time = "")`);
      }
    }

    if (searchParams.isActive !== undefined) {
      if (searchParams.isActive) {
        const currentTime = new Date().toISOString();
        filters.push(`(expire_time > "${currentTime}" || expire_time = "") && tier != "blacklisted"`);
      } else {
        const currentTime = new Date().toISOString();
        filters.push(`(expire_time < "${currentTime}" || tier = "blacklisted")`);
      }
    }

    const filter = filters.length > 0 ? filters.join(" && ") : "";

    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: filter,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });

    return vehicles;
  } catch (error) {
    console.error("Error searching vehicles:", error);
    throw error;
  }
};

// ✅ Export ฟังก์ชันทั้งหมดที่จำเป็น
export {
  getVehicle,
  getAllVehicle,
  getVehicleById,
  getVehicleByLicensePlate,
  getVehiclesByTier,
  getVehiclesByTiers,
  getVehiclesByHouse,
  getVehiclesByArea,
  getActiveVehicles,
  getExpiringVehicles,
  createVehicle,
  editVehicle,
  patchVehicle,
  stampVehicle,
  deleteVehicle,
  bulkDeleteVehicles,
  searchVehicles,
};