// src/routes/_authenticated/invitations.tsx
import Pb from "@/api/pocketbase";
import Invitations from "@/pages/invitation";
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff"];

export const Route = createFileRoute("/_authenticated/invitations")({
  beforeLoad: async () => {
    if (!accessRoleLst.find((item) => item === Pb.authStore.record?.role)) {
      throw redirect({ to: "/Forbidden", replace: true });
    }
  },
  component: Invitations,
});
