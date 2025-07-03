// src/api/vehicle/vehicle.ts
import Pb from "../pocketbase";

const collectionName = "vehicle";

// Types
export interface newVehicleRequest {
  id?: string;
  license_plate: string;
  area_code: string; // ISO3166-2:TH (e.g., th-BT, th-10, th-11)
  tier: string; // resident, staff, invited, unknown, blacklisted (เปลี่ยนจาก group เป็น tier)
  start_time?: string; // RFC3339 format
  expire_time?: string; // RFC3339 format
  authorized_area?: string[];
  house_id?: string;
  issuer?: string; // ID of who created this record
  note?: string;
}

export interface vehicleItem {
  collectionId: string;
  collectionName: string;
  id: string;
  license_plate: string;
  area_code: string;
  tier: string; // resident, staff, invited, unknown, blacklisted (เปลี่ยนจาก group เป็น tier)
  start_time: string;
  expire_time: string;
  authorized_area: string[];
  house_id: string;
  issuer: string;
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
  const vehicleList = await Pb.collection(collectionName).getList<vehicleItem>(
    request.page || 1,
    request.perPage || 10,
    {
      filter: request.filter || "",
      sort: request.sort || "-created",
    }
  );
  return vehicleList;
};

const getAllVehicle = async (): Promise<vehicleItem[]> => {
  const vehicleList = await Pb.collection(
    collectionName
  ).getFullList<vehicleItem>({
    sort: "-created",
  });
  return vehicleList;
};

const getVehicleById = async (id: string): Promise<vehicleItem> => {
  const vehicle = await Pb.collection(collectionName).getOne<vehicleItem>(id);
  return vehicle;
};

const deleteVehicle = async (id: string): Promise<null> => {
  await Pb.collection(collectionName).delete(id);
  return null;
};

const createVehicle = async (
  newVehicleReq: newVehicleRequest
): Promise<null> => {
  const formData = new FormData();

  formData.append("license_plate", newVehicleReq.license_plate);
  formData.append("area_code", newVehicleReq.area_code);
  formData.append("tier", newVehicleReq.tier); // เปลี่ยนจาก group เป็น tier

  if (newVehicleReq.start_time) {
    formData.append("start_time", newVehicleReq.start_time);
  }
  if (newVehicleReq.expire_time) {
    formData.append("expire_time", newVehicleReq.expire_time);
  }
  if (newVehicleReq.authorized_area) {
    formData.append(
      "authorized_area",
      JSON.stringify(newVehicleReq.authorized_area)
    );
  } else {
    formData.append("authorized_area", "[]");
  }
  if (newVehicleReq.house_id) {
    formData.append("house_id", newVehicleReq.house_id);
  }
  if (newVehicleReq.note) {
    formData.append("note", newVehicleReq.note);
  }

  // Set issuer to current user
  if (Pb.authStore.record?.id) {
    formData.append("issuer", Pb.authStore.record.id);
  }

  await Pb.collection(collectionName).create(formData);
  return null;
};

const editVehicle = async (vehicleReq: newVehicleRequest): Promise<null> => {
  const formData = new FormData();

  formData.append("license_plate", vehicleReq.license_plate);
  formData.append("area_code", vehicleReq.area_code);
  formData.append("tier", vehicleReq.tier); // เปลี่ยนจาก group เป็น tier

  if (vehicleReq.start_time) {
    formData.append("start_time", vehicleReq.start_time);
  }
  if (vehicleReq.expire_time) {
    formData.append("expire_time", vehicleReq.expire_time);
  }
  if (vehicleReq.authorized_area) {
    formData.append(
      "authorized_area",
      JSON.stringify(vehicleReq.authorized_area)
    );
  }
  if (vehicleReq.house_id) {
    formData.append("house_id", vehicleReq.house_id);
  }
  if (vehicleReq.note) {
    formData.append("note", vehicleReq.note);
  }

  await Pb.collection(collectionName).update(vehicleReq.id!, formData);
  return null;
};

export {
  getVehicle,
  getAllVehicle,
  getVehicleById,
  deleteVehicle,
  createVehicle,
  editVehicle,
};