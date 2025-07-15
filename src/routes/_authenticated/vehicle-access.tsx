// src/routes/_authenticated/vehicle-access.tsx
import Pb from "@/api/pocketbase";
import VehicleAccessPage from "@/pages/vehicle_access";
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff"];

export const Route = createFileRoute("/_authenticated/vehicle-access")({
  beforeLoad: async () => {
    if (!accessRoleLst.find((item) => item === Pb.authStore.record?.role)) {
      throw redirect({ to: "/Forbidden", replace: true });
    }
  },
  component: VehicleAccessPage,
});
