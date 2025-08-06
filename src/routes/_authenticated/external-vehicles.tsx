// src/routes/_authenticated/external-vehicles.tsx
import Pb from "@/api/pocketbase";
import ExternalVehicles from "@/pages/external_vehicle";
import { createFileRoute, redirect } from "@tanstack/react-router";

// กำหนดสิทธิ์การเข้าถึง - เฉพาะ admin และ guardsman เท่านั้น
const accessRoleLst = ["master", "admin", "guardsman"];

export const Route = createFileRoute("/_authenticated/external-vehicles")({
  beforeLoad: async () => {
    if (!accessRoleLst.find((item) => item === Pb.authStore.record?.role)) {
      throw redirect({ to: "/Forbidden", replace: true });
    }
  },
  component: ExternalVehicles,
});
