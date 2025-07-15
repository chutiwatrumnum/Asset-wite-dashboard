"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { Cell } from "@tanstack/react-table";
import type { PassageLogItem } from "@/api/passage_log/passage_log";
import { useState } from "react";
import { toast } from "sonner";
import { ViewPassageLogDialog } from "./view-passage-log-dialog";

function PassageLogActionButton({ info }: { info: Cell<PassageLogItem, any> }) {
  const [showViewDialog, setShowViewDialog] = useState(false);

  // ✅ เพิ่ม safe check
  const passageLogData = info?.row?.original as PassageLogItem;

  // ✅ Guard clause
  if (!passageLogData) {
    console.error("❌ PassageLogData is undefined:", info);
    return (
      <Button variant="ghost" size="sm" disabled>
        <Eye className="h-4 w-4" />
        ดู
      </Button>
    );
  }

  const handleViewClick = () => {
    try {
      setShowViewDialog(true);
    } catch (error) {
      console.error("Error opening view:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าดูรายละเอียด");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleViewClick}
        className="gap-2"
        title="ดูรายละเอียด">
        <Eye className="h-4 w-4" />
        ดู
      </Button>

      {/* View Dialog */}
      <ViewPassageLogDialog
        passageLogData={passageLogData}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />
    </>
  );
}

export default PassageLogActionButton;
