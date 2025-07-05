// src/api/vehicle/vehicle.ts
import Pb from "../pocketbase";

const collectionName = "vehicle";

// Types
export interface newVehicleRequest {
  id?: string;
  license_plate: string; // Required
  area_code: string; // Required - ISO3166-2:TH (e.g., th-BT, th-10, th-11)
  tier: string; // Required - resident, staff, invited, unknown, blacklisted
  issuer: string; // Required - ID of who created this record
  start_time?: string; // Optional - DateTime string
  expire_time?: string; // Optional - DateTime string
  invitation?: string; // Optional - RELATION_RECORD_ID สำหรับเชื่อมโยงกับการนัดหมาย
  house_id?: string; // Optional - RELATION_RECORD_ID
  authorized_area?: string[]; // Required - Array of RELATION_RECORD_ID (ต้องเป็น array เสมอ)
  stamper?: string; // Optional - ID of who stamped/approved this record
  stamped_time?: string; // Optional - DateTime string เวลาที่ stamped
  note?: string; // Optional
}

export interface vehicleItem {
  collectionId: string;
  collectionName: string;
  id: string;
  license_plate: string;
  area_code: string;
  tier: string; // resident, staff, invited, unknown, blacklisted
  issuer: string;
  start_time: string;
  expire_time: string;
  invitation: string; // RELATION_RECORD_ID
  house_id: string; // RELATION_RECORD_ID
  authorized_area: string[]; // Array of RELATION_RECORD_ID
  stamper: string;
  stamped_time: string;
  note: string;
  created: string;
  updated: string;
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

// API Functions
const getVehicle = async (
  request: vehicleRequest
): Promise<vehicleResponse> => {
  try {
    const vehicleList = await Pb.collection(collectionName).getList<vehicleItem>(
      request.page || 1,
      request.perPage || 10,
      {
        filter: request.filter || "",
        sort: request.sort || "-created",
        expand: "house_id,invitation,authorized_area,issuer,stamper", // Expand related records
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
      expand: "house_id,invitation,authorized_area,issuer,stamper", // Expand related records
    });
    return vehicleList;
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    throw error;
  }
};

const getVehicleById = async (id: string): Promise<vehicleItem> => {
  try {
    const vehicle = await Pb.collection(collectionName).getOne<vehicleItem>(id, {
      expand: "house_id,invitation,authorized_area,issuer,stamper", // Expand related records
    });
    return vehicle;
  } catch (error) {
    console.error(`Error fetching vehicle with id ${id}:`, error);
    throw error;
  }
};

// Get vehicles by license plate
const getVehicleByLicensePlate = async (licensePlate: string): Promise<vehicleItem[]> => {
  try {
    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `license_plate = "${licensePlate}"`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicle with license plate ${licensePlate}:`, error);
    throw error;
  }
};

// Get vehicles by tier
const getVehiclesByTier = async (tier: string): Promise<vehicleItem[]> => {
  try {
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

// Get vehicles by house
const getVehiclesByHouse = async (houseId: string): Promise<vehicleItem[]> => {
  try {
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

// Get active vehicles (not expired)
const getActiveVehicles = async (): Promise<vehicleItem[]> => {
  try {
    const currentTime = new Date().toISOString();
    const vehicles = await Pb.collection(collectionName).getFullList<vehicleItem>({
      filter: `expire_time > "${currentTime}" || expire_time = ""`,
      expand: "house_id,invitation,authorized_area,issuer,stamper",
      sort: "-created",
    });
    return vehicles;
  } catch (error) {
    console.error("Error fetching active vehicles:", error);
    throw error;
  }
};

const deleteVehicle = async (id: string): Promise<null> => {
  try {
    await Pb.collection(collectionName).delete(id);
    return null;
  } catch (error) {
    console.error(`Error deleting vehicle with id ${id}:`, error);
    throw error;
  }
};

const createVehicle = async (
  newVehicleReq: newVehicleRequest
): Promise<null> => {
  try {
    console.log("Creating vehicle with request:", newVehicleReq);

    // Validate required fields
    if (!newVehicleReq.license_plate?.trim()) {
      throw new Error("License plate is required");
    }
    if (!newVehicleReq.area_code) {
      throw new Error("Area code is required");
    }
    if (!newVehicleReq.tier) {
      throw new Error("Tier is required");
    }

    // สร้าง data object ตามตัวอย่างที่ใช้งานได้
    const data: Record<string, any> = {
      // Required fields
      license_plate: newVehicleReq.license_plate.trim(),
      area_code: newVehicleReq.area_code,
      tier: newVehicleReq.tier,
      issuer: newVehicleReq.issuer || Pb.authStore.record?.id || "",

      // authorized_area เป็น array ตามตัวอย่าง ["69imk303pw926ef"]
      authorized_area: Array.isArray(newVehicleReq.authorized_area)
        ? newVehicleReq.authorized_area
        : [],

      // Optional relation fields - ใส่เสมอ แต่อาจเป็น empty string
      invitation: newVehicleReq.invitation || "",
      house_id: newVehicleReq.house_id || "",
      stamper: newVehicleReq.stamper || "",
      note: newVehicleReq.note || "",
    };

    // DateTime fields - ตามตัวอย่าง format: "2025-05-29 05:14:30.000Z"
    // ถ้าไม่มีค่า ให้เป็น empty string ตามตัวอย่าง

    if (newVehicleReq.start_time && newVehicleReq.start_time.trim() !== "") {
      // แปลงจาก datetime-local input เป็น RFC3339 format
      const startDate = new Date(newVehicleReq.start_time);
      // ตัวอย่าง: "2025-05-29 05:14:30.000Z"
      data.start_time = startDate.toISOString().replace('T', ' ').replace(/Z$/, '.000Z');
    } else {
      data.start_time = ""; // Empty string ตามตัวอย่าง
    }

    if (newVehicleReq.expire_time && newVehicleReq.expire_time.trim() !== "") {
      const expireDate = new Date(newVehicleReq.expire_time);
      data.expire_time = expireDate.toISOString().replace('T', ' ').replace(/Z$/, '.000Z');
    } else {
      data.expire_time = ""; // Empty string ตามตัวอย่าง
    }

    if (newVehicleReq.stamped_time && newVehicleReq.stamped_time.trim() !== "") {
      const stampedDate = new Date(newVehicleReq.stamped_time);
      data.stamped_time = stampedDate.toISOString().replace('T', ' ').replace(/Z$/, '.000Z');
    } else {
      data.stamped_time = ""; // Empty string ตามตัวอย่าง
    }

    console.log("Final data to be sent:", data);

    // ตรวจสอบว่า user มี permission
    if (!Pb.authStore.record?.id) {
      throw new Error("User not authenticated");
    }

    // เรียก API
    const result = await Pb.collection(collectionName).create(data);
    console.log("Vehicle created successfully:", result);

    return null;
  } catch (error) {
    console.error("Error creating vehicle:", error);

    // แสดง error details สำหรับ debugging
    if (error && typeof error === 'object') {
      if ('response' in error) {
        const pbError = error as any;
        console.error("Status:", pbError.status);
        console.error("Response data:", pbError.response?.data);

        if (pbError.response?.data?.data) {
          console.error("Validation errors:", pbError.response.data.data);
        }
      }

      if ('data' in error) {
        console.error("Error data:", (error as any).data);
      }
    }

    throw error;
  }
};

const editVehicle = async (vehicleReq: newVehicleRequest): Promise<null> => {
  if (!vehicleReq.id) {
    throw new Error("Vehicle ID is required for editing");
  }

  try {
    const updateData: Record<string, any> = {};

    // Required fields
    updateData.license_plate = vehicleReq.license_plate;
    updateData.area_code = vehicleReq.area_code;
    updateData.tier = vehicleReq.tier;

    // Optional fields - only update if provided
    if (vehicleReq.start_time !== undefined) {
      updateData.start_time = vehicleReq.start_time;
    }
    if (vehicleReq.expire_time !== undefined) {
      updateData.expire_time = vehicleReq.expire_time;
    }
    if (vehicleReq.invitation !== undefined) {
      updateData.invitation = vehicleReq.invitation;
    }
    if (vehicleReq.house_id !== undefined) {
      updateData.house_id = vehicleReq.house_id;
    }
    if (vehicleReq.authorized_area !== undefined) {
      updateData.authorized_area = vehicleReq.authorized_area;
    }
    if (vehicleReq.stamper !== undefined) {
      updateData.stamper = vehicleReq.stamper;
    }
    if (vehicleReq.stamped_time !== undefined) {
      updateData.stamped_time = vehicleReq.stamped_time;
    }
    if (vehicleReq.note !== undefined) {
      updateData.note = vehicleReq.note;
    }
    if (vehicleReq.issuer !== undefined) {
      updateData.issuer = vehicleReq.issuer;
    }

    // Use PATCH method via PocketBase's update function
    await Pb.collection(collectionName).update(vehicleReq.id, updateData);
    return null;
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
};

// Additional function for partial updates (PATCH-like behavior)
const patchVehicle = async (
  id: string,
  patchData: Partial<Omit<newVehicleRequest, 'id'>>
): Promise<null> => {
  try {
    const updateData: Record<string, any> = {};

    // Only include fields that are explicitly provided
    Object.keys(patchData).forEach(key => {
      const value = patchData[key as keyof typeof patchData];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    await Pb.collection(collectionName).update(id, updateData);
    return null;
  } catch (error) {
    console.error("Error patching vehicle:", error);
    throw error;
  }
};

// Function to stamp a vehicle (approve/validate)
const stampVehicle = async (
  id: string,
  stamperId: string,
  stampedTime?: string
): Promise<null> => {
  try {
    const updateData = {
      stamper: stamperId,
      stamped_time: stampedTime || new Date().toISOString()
    };

    await Pb.collection(collectionName).update(id, updateData);
    return null;
  } catch (error) {
    console.error("Error stamping vehicle:", error);
    throw error;
  }
};

export {
  getVehicle,
  getAllVehicle,
  getVehicleById,
  getVehicleByLicensePlate,
  getVehiclesByTier,
  getVehiclesByHouse,
  getActiveVehicles,
  deleteVehicle,
  createVehicle,
  editVehicle,
  patchVehicle,
  stampVehicle,
};