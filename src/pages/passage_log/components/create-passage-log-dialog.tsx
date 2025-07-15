// src/pages/passage-log/components/create-passage-log-dialog.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHouseListQuery } from "@/react-query/manage/house";
import { useUserAuthorizedAreasQuery } from "@/react-query/manage/area";
import { useCreatePassageLogMutation } from "@/react-query/manage/passage_log";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type { NewPassageLogRequest } from "@/api/passage_log/passage_log";
import { Textarea } from "@/components/ui/textarea";
import Pb from "@/api/pocketbase";
import {
  validatePassageLogTimeRange,
  VERIFICATION_METHODS,
  PASSAGE_TYPES,
} from "@/utils/passageLogUtils";

// ใช้ FormDialog component
import { FormDialog } from "@/components/ui/form-dialog";

// Form schema with validation
const formSchema = z
  .object({
    // Required fields
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

    // Optional fields
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

type FormSchema = z.infer<typeof formSchema>;

interface CreatePassageLogDialogProps {
  onPassageLogCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTriggerButton?: boolean;
}

export function CreatePassageLogDialog({
  onPassageLogCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showTriggerButton = true,
}: CreatePassageLogDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();

  // ใช้ state internal หรือ external
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createPassageLog } = useCreatePassageLogMutation();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
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

  // Set default times when form opens
  useEffect(() => {
    if (open) {
      const now = new Date();

      // Format for datetime-local input
      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      form.setValue("entry_time", formatForInput(now));

      // Set staff_verified_by to current user if verification method is manual
      if (form.getValues("verification_method") === "manual") {
        form.setValue("staff_verified_by", Pb.authStore.record?.id || "");
      }
    }
  }, [open, form]);

  // Watch for form changes to determine if it's dirty
  const watchedValues = form.watch();
  const isDirty = Object.values(watchedValues).some((value) => {
    if (typeof value === "boolean") return value !== true;
    return value !== "" && value !== undefined;
  });

  const handleSubmit = async (values: FormSchema) => {
    try {
      setIsLoading(true);
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

      // Create data object
      const passageLogData: NewPassageLogRequest = {
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

      console.log("Final passageLogData to send:", passageLogData);

      await createPassageLog(passageLogData);

      toast.success("สร้างประวัติการเข้าออกสำเร็จแล้ว", {
        description: `บันทึกการ${values.passage_type === "entry" ? "เข้า" : "ออก"}ของ ${values.visitor_name} เรียบร้อยแล้ว`,
        duration: 4000,
      });

      form.reset();
      setOpen(false);
      onPassageLogCreated();
    } catch (error) {
      console.error("Create passage log failed:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการสร้างประวัติการเข้าออก";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "response" in error) {
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.data) {
          const validationErrors = apiError.response.data.data;
          const errorMessages = Object.entries(validationErrors)
            .map(([field, error]: [string, any]) => {
              const message = error.message || error.toString();
              return `${field}: ${message}`;
            })
            .join(", ");
          errorMessage = errorMessages;
        }
      }

      toast.error("ไม่สามารถสร้างประวัติการเข้าออกได้", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  // Watch verification method to auto-set staff_verified_by
  const verificationMethod = form.watch("verification_method");
  useEffect(() => {
    if (verificationMethod === "manual") {
      form.setValue("staff_verified_by", Pb.authStore.record?.id || "");
    } else {
      form.setValue("staff_verified_by", "");
    }
  }, [verificationMethod, form]);

  // Watch passage type to manage time fields
  const passageType = form.watch("passage_type");
  useEffect(() => {
    if (passageType === "exit") {
      // For exit, we might want to set exit_time to now
      const now = new Date();
      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      if (!form.getValues("exit_time")) {
        form.setValue("exit_time", formatForInput(now));
      }
    }
  }, [passageType, form]);

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
    <>
      {/* Trigger Button */}
      {showTriggerButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                บันทึกการเข้าออก
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>สร้างประวัติการเข้าออกใหม่</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* FormDialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="บันทึกการเข้าออกใหม่"
        description="กรอกข้อมูลเพื่อบันทึกประวัติการเข้าออกของผู้เยี่ยม"
        isLoading={isLoading}
        isDirty={isDirty}
        showConfirmClose={true}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        submitLabel="บันทึก"
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
                      <FormDescription>
                        การเข้าหรือออกจากพื้นที่
                      </FormDescription>
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
                      <FormDescription>
                        พื้นที่ที่เกิดการเข้าออก
                      </FormDescription>
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
                    <FormDescription>
                      วิธีการที่ใช้ในการยืนยันตัวตน
                    </FormDescription>
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
                    <FormDescription>
                      ข้อมูลที่ใช้ในการยืนยันตัวตน (ถ้ามี)
                    </FormDescription>
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
                      <FormDescription>เวลาที่เข้าสู่พื้นที่</FormDescription>
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
                      <FormDescription>
                        เวลาที่ออกจากพื้นที่ (ถ้ามี)
                      </FormDescription>
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
                      <FormDescription>
                        บ้านที่เกี่ยวข้องกับการเยี่ยม
                      </FormDescription>
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
                      <FormDescription>สถานะของการเข้าออก</FormDescription>
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
                      <FormDescription>
                        รหัสบัตรเชิญที่เกี่ยวข้อง
                      </FormDescription>
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
                      <FormDescription>
                        รหัสยานพาหนะที่เกี่ยวข้อง
                      </FormDescription>
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
                    <FormDescription>
                      ข้อมูลเพิ่มเติมเกี่ยวกับการเข้าออก
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </FormDialog>
    </>
  );
}

export default CreatePassageLogDialog;
