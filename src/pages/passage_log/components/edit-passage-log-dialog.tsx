// src/pages/passage-log/components/edit-passage-log-dialog.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouseListQuery } from "@/react-query/manage/house";
import { useUserAuthorizedAreasQuery } from "@/react-query/manage/area";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type {
  PassageLogItem,
  NewPassageLogRequest,
} from "@/api/passage_log/passage_log";
import { useEditPassageLogMutation } from "@/react-query/manage/passage_log";
import { Textarea } from "@/components/ui/textarea";
import {
  validatePassageLogTimeRange,
  VERIFICATION_METHODS,
  PASSAGE_TYPES,
} from "@/utils/passageLogUtils";

// ใช้ FormDialog component
import { FormDialog } from "@/components/ui/form-dialog";

// Form schema
const editFormSchema = z
  .object({
    visitor_name: z
      .string()
      .min(1, { message: "กรุณากรอกชื่อผู้เยี่ยม" })
      .max(100, { message: "ชื่อผู้เยี่ยมต้องไม่เกิน 100 ตัวอักษร" }),
    passage_type: z.enum(["entry", "exit"], {
      message: "กรุณาเลือกประเภทการผ่าน",
    }),
    location_area: z.string().min(1, { message: "กรุณาเลือกพื้นที่" }),
    verification_method: z.enum(
      ["qr_code", "manual", "vehicle_plate", "facial_recognition"],
      {
        message: "กรุณาเลือกวิธีการยืนยัน",
      }
    ),
    entry_time: z.string().optional(),
    exit_time: z.string().optional(),
    verification_data: z.string().optional(),
    staff_verified_by: z.string().optional(),
    invitation_id: z.string().optional(),
    vehicle_id: z.string().optional(),
    house_id: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["success", "failed", "pending"]).optional(),
  })
  .refine(
    (data) => {
      if (data.entry_time && data.exit_time) {
        const validation = validatePassageLogTimeRange(
          data.entry_time,
          data.exit_time
        );
        return validation === null;
      }
      return true;
    },
    {
      message: "ช่วงเวลาไม่ถูกต้อง",
      path: ["exit_time"],
    }
  );

type EditFormSchema = z.infer<typeof editFormSchema>;

interface EditPassageLogDialogProps {
  passageLogData: PassageLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPassageLogUpdated: () => void;
}

export function EditPassageLogDialog({
  passageLogData,
  open,
  onOpenChange,
  onPassageLogUpdated,
}: EditPassageLogDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: updatePassageLog } = useEditPassageLogMutation();

  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      visitor_name: "",
      passage_type: "entry",
      location_area: "",
      verification_method: "manual",
      entry_time: "",
      exit_time: "",
      verification_data: "",
      staff_verified_by: "",
      invitation_id: "",
      vehicle_id: "",
      house_id: "",
      notes: "",
      status: "success",
    },
  });

  // Format datetime for input
  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString || dateString === "") return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Watch for form changes to determine if it's dirty
  const isDirty = form.formState.isDirty;

  // Populate form when passageLogData changes and dialog opens
  useEffect(() => {
    if (passageLogData && open) {
      console.log("Original passageLogData:", passageLogData);

      try {
        const formData = {
          visitor_name: passageLogData.visitor_name || "",
          passage_type: passageLogData.passage_type || "entry",
          location_area: passageLogData.location_area || "",
          verification_method: passageLogData.verification_method || "manual",
          entry_time: passageLogData.entry_time
            ? formatDateTimeForInput(passageLogData.entry_time)
            : "",
          exit_time: passageLogData.exit_time
            ? formatDateTimeForInput(passageLogData.exit_time)
            : "",
          verification_data: passageLogData.verification_data || "",
          staff_verified_by: passageLogData.staff_verified_by || "",
          invitation_id: passageLogData.invitation_id || "",
          vehicle_id: passageLogData.vehicle_id || "",
          house_id: passageLogData.house_id || "",
          notes: passageLogData.notes || "",
          status: passageLogData.status || "success",
        };

        console.log("Setting form data:", formData);
        form.reset(formData);
      } catch (error) {
        console.error("Error setting form data:", error);
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        onOpenChange(false);
      }
    }
  }, [passageLogData, open, form, onOpenChange]);

  const handleSubmit = async (values: EditFormSchema) => {
    setIsLoading(true);
    try {
      console.log("Form submission values:", values);

      // Additional validation
      if (values.entry_time && values.exit_time) {
        const timeValidation = validatePassageLogTimeRange(
          values.entry_time,
          values.exit_time
        );
        if (timeValidation) {
          throw new Error(timeValidation);
        }
      }

      const reqData: NewPassageLogRequest = {
        id: passageLogData?.id,
        visitor_name: values.visitor_name.trim(),
        passage_type: values.passage_type,
        location_area: values.location_area,
        verification_method: values.verification_method,
        entry_time: values.entry_time || undefined,
        exit_time: values.exit_time || undefined,
        verification_data: values.verification_data?.trim() || "",
        staff_verified_by: values.staff_verified_by || "",
        invitation_id: values.invitation_id || "",
        vehicle_id: values.vehicle_id || "",
        house_id: values.house_id || "",
        notes: values.notes?.trim() || "",
        status: values.status || "success",
      };

      console.log("Sending data to API:", reqData);

      await updatePassageLog(reqData);

      toast.success("อัปเดตประวัติการเข้าออกสำเร็จ");
      onPassageLogUpdated();
    } catch (error: any) {
      console.error("Update passage log failed:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการอัปเดตข้อมูล";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.data) {
        const validationErrors = error.response.data.data;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, error]: [string, any]) => {
            const message = error.message || error.toString();
            return `${field}: ${message}`;
          })
          .join(", ");
        errorMessage = errorMessages;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("ไม่สามารถอัปเดตข้อมูลได้", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const verificationMethodOptions = Object.entries(VERIFICATION_METHODS).map(
    ([key, value]) => ({
      value: key,
      label: value.label,
    })
  );

  const passageTypeOptions = Object.entries(PASSAGE_TYPES).map(
    ([key, value]) => ({
      value: key,
      label: value.label,
    })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="แก้ไขประวัติการเข้าออก"
      description={`แก้ไขข้อมูลการ${passageLogData?.passage_type === "entry" ? "เข้า" : "ออก"}ของ ${passageLogData?.visitor_name}`}
      isLoading={isLoading}
      isDirty={isDirty}
      showConfirmClose={true}
      onSubmit={form.handleSubmit(handleSubmit)}
      onCancel={handleCancel}
      submitLabel="อัปเดต"
      cancelLabel="ยกเลิก"
      submitDisabled={isLoading}
      size="lg">
      <Form {...form}>
        <form className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลผู้เยี่ยม
            </h3>

            <FormField
              control={form.control}
              name="visitor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้เยี่ยม *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="กรอกชื่อผู้เยี่ยม"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    ชื่อของบุคคลที่เข้า/ออกจากพื้นที่
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passage_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทการผ่าน *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {passageTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>พื้นที่ *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกพื้นที่" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userAuthorizedAreas?.map((area: AreaItem) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Verification Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลการยืนยัน
            </h3>

            <FormField
              control={form.control}
              name="verification_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วิธีการยืนยัน *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกวิธียืนยัน" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {verificationMethodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verification_data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ข้อมูลการยืนยัน</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น QR Code data, ป้ายทะเบียน, etc."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Time Settings */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">กำหนดเวลา</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เวลาเข้า</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exit_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เวลาออก</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Related Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลเกี่ยวข้อง
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="house_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>บ้านเกี่ยวข้อง</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบ้าน (ถ้าเกี่ยวข้อง)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {houseList?.items.map((house: HouseItem) => (
                          <SelectItem key={house.id} value={house.id}>
                            {house.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="success">สำเร็จ</SelectItem>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                        <SelectItem value="failed">ล้มเหลว</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invitation_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสบัตรเชิญ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="รหัสบัตรเชิญ (ถ้าเกี่ยวข้อง)"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสยานพาหนะ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="รหัสยานพาหนะ (ถ้าเกี่ยวข้อง)"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลเพิ่มเติม
            </h3>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="หมายเหตุเพิ่มเติม..."
                      className="resize-none"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </FormDialog>
  );
}

export default EditPassageLogDialog;
