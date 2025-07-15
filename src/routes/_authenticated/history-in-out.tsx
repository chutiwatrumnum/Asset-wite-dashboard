// src/routes/_authenticated/history-in-out.tsx
import Pb from "@/api/pocketbase";
import PassageLogs from "@/pages/passage_log"; // ✅ แก้ไข path ให้ตรงกับโฟลเดอร์จริง
import { createFileRoute, redirect } from "@tanstack/react-router";

const accessRoleLst = ["master", "staff"];

export const Route = createFileRoute("/_authenticated/history-in-out")({
  beforeLoad: async () => {
    if (!accessRoleLst.find((item) => item === Pb.authStore.record?.role)) {
      throw redirect({ to: "/Forbidden", replace: true });
    }
  },
  component: PassageLogs,
});
