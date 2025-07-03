import Pb from "@/api/pocketbase";
import Vehicles from "@/pages/vehicle";
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff"];

export const Route = createFileRoute("/_authenticated/vehicles")({
  beforeLoad: async () => {
    if (!accessRoleLst.find((item) => item === Pb.authStore.record?.role)) {
      throw redirect({ to: "/Forbidden", replace: true });
    }
  },
  component: Vehicles,
});
