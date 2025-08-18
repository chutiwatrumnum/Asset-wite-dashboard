// src/pages/vehicle/components/create-vehicle-dialog.tsx - แก้ไขปัญหา house_id
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { FormDialog } from "@/components/ui/form-dialog";
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
import { useAreaAllListQuery } from "@/react-query/manage/area";
import { useCreateVehicleMutation } from "@/react-query/manage/vehicle";
import type { AreaItem } from "@/api/area/area";
import type { newVehicleRequest } from "@/api/vehicle/vehicle";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
import { THAI_PROVINCES } from "@/utils/vehicleUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema
const formSchema = z.object({
  license_plate: z
    .string()
    .min(1, { message: "กรุณากรอกป้ายทะเบียน" })
    .max(20, { message: "ป้ายทะเบียนต้องไม่เกิน 20 ตัวอักษร" }),
  area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
  authorized_area: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  expire_time: z.string().optional(),
  note: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface CreateVehicleDrawerProps {
  onVehicleCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTriggerButton?: boolean;
}

export function CreateVehicleDrawer({
  onVehicleCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showTriggerButton = true,
}: CreateVehicleDrawerProps) {
  const { data: allAreas } = useAreaAllListQuery();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: createVehicle } = useCreateVehicleMutation();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_plate: "",
      area_code: "",
      authorized_area: [],
      start_time: "",
      expire_time: "",
      note: "",
    },
  });

  // Set default expire time when form opens
  useEffect(() => {
    if (open) {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      form.setValue("expire_time", formatForInput(oneYearLater));
      setIsDirty(false);
    }
  }, [open, form]);

  // Watch for form changes
  useEffect(() => {
    if (open) {
      const subscription = form.watch(() => {
        setIsDirty(true);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, open]);

 const handleSubmit = async (values: FormSchema) => {
   setIsLoading(true);

   let vehicleData: newVehicleRequest | null = null;

   try {
     console.log("=== Create Vehicle Form Submit ===");
     console.log("Form values:", values);

     // ✅ ตรวจสอบสถานะการล็อกอิน
     const currentUser = Pb.getCurrentUser();
     const isLoggedIn = Pb.isLoggedIn();
     const isUsingVMS = Pb.isUsingVMS();

     console.log("Auth Status:", {
       currentUser: currentUser,
       isLoggedIn,
       isUsingVMS,
       userRole: currentUser?.role,
       houseId: currentUser?.house_id,
     });

     if (!currentUser || !currentUser.id) {
       throw new Error("ไม่สามารถระบุผู้ใช้ปัจจุบันได้ กรุณาเข้าสู่ระบบใหม่");
     }

     if (!isLoggedIn) {
       throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
     }

     // ✅ ตรวจสอบสิทธิ์ในการสร้างยานพาหนะ
     const allowedRoles = ["master", "staff", "Project Super Admin"];
     if (!allowedRoles.includes(currentUser.role)) {
       throw new Error("คุณไม่มีสิทธิ์ในการสร้างยานพาหนะ");
     }

     // ✅ ตรวจสอบ house_id - ต้องมีข้อมูลจริง
     const houseId = currentUser.house_id;

     if (!houseId || houseId.trim() === "") {
       throw new Error("ไม่พบข้อมูล house_id กรุณาติดต่อผู้ดูแลระบบ");
     }

     // ✅ ตรวจสอบรูปแบบ house_id ให้ถูกต้อง (PocketBase ID format)
     if (houseId.includes("-") && houseId.length > 20) {
       throw new Error(
         "ข้อมูล house_id ไม่ถูกต้อง (UUID format) กรุณาตรวจสอบการล็อกอิน"
       );
     }

     console.log("✅ Using house_id:", houseId);

     if (isUsingVMS) {
       // ✅ เช็คว่า VMS config มีครบหรือไม่
       const vmsConfig = Pb.getVMSConfig();
       if (!vmsConfig?.vmsUrl || !vmsConfig?.vmsToken) {
         throw new Error("VMS configuration is missing. Please login again.");
       }

       console.log("VMS Config check:", {
         vmsUrl: vmsConfig.vmsUrl,
         hasToken: !!vmsConfig.vmsToken,
       });
     }

     // ✅ เตรียมข้อมูลสำหรับส่งไป API (แยกระหว่าง VMS และ PocketBase)
     if (isUsingVMS) {
       // ✅ สำหรับ VMS - ส่งเฉพาะข้อมูลที่จำเป็น
       vehicleData = {
         license_plate: values.license_plate.trim().toUpperCase(),
         tier: "staff", // ใช้ guest เป็น default
         area_code: values.area_code,
         house_id: houseId,
         authorized_area: values.authorized_area || [],
         start_time: values.start_time || undefined,
         expire_time: values.expire_time || undefined,
         // ✅ ไม่ส่ง fields เหล่านี้ไป VMS
         // invitation: "",
         // stamper: currentUser.id,
         // stamped_time: new Date().toISOString(),
         // issuer: currentUser.id,
         // note: values.note?.trim() || "",
       };
     } else {
       // ✅ สำหรับ PocketBase - ส่งข้อมูลครบ
       vehicleData = {
         license_plate: values.license_plate.trim().toUpperCase(),
         tier: "staff",
         area_code: values.area_code,
         house_id: houseId,
         authorized_area: values.authorized_area || [],
         start_time: values.start_time || undefined,
         expire_time: values.expire_time || undefined,
         invitation: "",
         stamper: currentUser.id,
         stamped_time: new Date().toISOString(),
         issuer: currentUser.id,
         note: values.note?.trim() || "",
       };
     }

     console.log("Vehicle data to create:", vehicleData);
     console.log("API Mode:", isUsingVMS ? "VMS" : "PocketBase");

     // เรียก API
     const result = await createVehicle(vehicleData);
     console.log("Vehicle created successfully:", result);

     toast.success("เพิ่มยานพาหนะสำเร็จแล้ว", {
       description: `เพิ่มยานพาหนะ ${values.license_plate} เรียบร้อยแล้ว`,
       duration: 4000,
     });

     form.reset();
     setIsDirty(false);
     setOpen(false);
     onVehicleCreated();
   } catch (error) {
     console.error("Create vehicle failed:", error);

     // ✅ ปรับปรุง error handling ให้ดีขึ้น
     let errorMessage = "เกิดข้อผิดพลาดในการเพิ่มยานพาหนะ";

     if (error instanceof Error) {
       errorMessage = error.message;

       // ✅ จัดการ error messages เฉพาะ
       if (error.message.includes("quota exceeded")) {
         errorMessage =
           "ปริมาณการใช้งานเกินกำหนด กรุณาติดต่อผู้ดูแลระบบ หรือลองใหม่ในภายหลัง";
       } else if (error.message.includes("house_id")) {
         errorMessage =
           "ข้อมูล house_id ไม่ถูกต้อง กรุณาล็อกเอาท์แล้วเข้าสู่ระบบใหม่";
       } else if (error.message.includes("UUID format")) {
         errorMessage =
           "พบข้อมูล house_id ในรูปแบบที่ผิด กรุณาล็อกเอาท์แล้วเข้าสู่ระบบใหม่";
       } else if (
         error.message.includes("validation") ||
         error.message.includes("ข้อมูลไม่ผ่านการตรวจสอบ")
       ) {
         errorMessage =
           "ข้อมูลที่กรอกไม่ถูกต้องตามข้อกำหนด กรุณาตรวจสอบอีกครั้ง";
       }
     }

     // แสดง toast error พร้อมรายละเอียดเพิ่มเติม
     toast.error("ไม่สามารถเพิ่มยานพาหนะได้", {
       description: errorMessage,
       duration: 8000,
     });

     // ✅ เพิ่ม debug information สำหรับการแก้ไขปัญหา
     console.group("🔍 Debug Information");
     console.log("Error details:", error);
     console.log("Current user:", Pb.getCurrentUser());
     console.log("House ID:", Pb.getCurrentUser()?.house_id);
     console.log("House ID format check:", {
       value: Pb.getCurrentUser()?.house_id,
       isUUID:
         Pb.getCurrentUser()?.house_id?.includes("-") &&
         Pb.getCurrentUser()?.house_id?.length > 20,
       expectedFormat: "PocketBase ID (15 chars, no dashes)",
     });
     console.log("Form values:", values);
     console.log("Vehicle data:", vehicleData);

     // ✅ แสดงข้อมูลที่จะส่งไป API
     console.log("API payload preview:", JSON.stringify(vehicleData, null, 2));
     console.groupEnd();

     // ถ้าเป็น house_id format error ให้แนะนำให้ล็อกเอาท์
     if (errorMessage.includes("house_id") || errorMessage.includes("UUID")) {
       setTimeout(() => {
         if (
           confirm("พบปัญหาข้อมูล house_id กรุณาล็อกเอาท์แล้วเข้าสู่ระบบใหม่")
         ) {
           window.location.href = "/login";
         }
       }, 2000);
     }
   } finally {
     setIsLoading(false);
   }
 };

  const handleCancel = () => {
    form.reset();
    setIsDirty(false);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      {showTriggerButton && (
        <Button
          variant="default"
          className="gap-2"
          onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          เพิ่มยานพาหนะ
        </Button>
      )}

      {/* FormDialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="เพิ่มยานพาหนะใหม่"
        description="กรอกข้อมูลเพื่อเพิ่มยานพาหนะใหม่เข้าสู่ระบบ"
        isLoading={isLoading}
        isDirty={isDirty}
        showConfirmClose={true}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        submitLabel={isLoading ? "กำลังเพิ่ม..." : "เพิ่มยานพาหนะ"}
        cancelLabel="ยกเลิก"
        submitDisabled={isLoading || !form.formState.isValid}
        size="md">
        <Form {...form}>
          <div className="space-y-4">
            {/* ✅ แสดงข้อมูล debug ถ้าอยู่ใน development mode */}
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <div>
                  <strong>Debug Info:</strong>
                </div>
                <div>Mode: {Pb.isUsingVMS() ? "VMS" : "PocketBase"}</div>
                <div>User: {Pb.getCurrentUser()?.email}</div>
                <div>Role: {Pb.getCurrentUser()?.role}</div>
                <div>
                  House ID: {Pb.getCurrentUser()?.house_id || "❌ Missing"}
                </div>
                {Pb.isUsingVMS() && (
                  <>
                    <div>VMS URL: {Pb.getVMSConfig()?.vmsUrl}</div>
                    <div>
                      VMS Token: {Pb.getVMSConfig()?.vmsToken ? "✅" : "❌"}
                    </div>
                    <div>
                      Project ID:{" "}
                      {Pb.getProjectInfo()?.myProjectId || "❌ Missing"}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-900">
                ข้อมูลยานพาหนะ
              </h3>

              <FormField
                control={form.control}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ป้ายทะเบียน *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น กข 1234, 1กข234"
                        {...field}
                        disabled={isLoading}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      ป้ายทะเบียนยานพาหนะ (จะถูกแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จังหวัด *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกจังหวัด" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {Object.entries(THAI_PROVINCES || {}).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>จังหวัดที่ออกป้ายทะเบียน</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time Settings */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-900">
                ช่วงเวลาใช้งาน (ไม่จำเป็น)
              </h3>

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่เริ่มใช้งาน</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      วันที่และเวลาที่เริ่มให้ยานพาหนะใช้งานได้
                      (ไม่ระบุหากต้องการให้ใช้ได้ทันที)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expire_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เวลาหมดอายุ</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      วันที่และเวลาที่สิ้นสุดการอนุญาต (ค่าเริ่มต้น 1 ปี)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Area Authorization */}
            {allAreas && allAreas.length > 0 && (
              <div className="space-y-4 border-b pb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  พื้นที่ที่อนุญาต
                </h3>

                <FormField
                  control={form.control}
                  name="authorized_area"
                  render={() => (
                    <FormItem>
                      <FormLabel>เลือกพื้นที่ที่อนุญาต</FormLabel>
                      <FormDescription>
                        เลือกพื้นที่ที่ยานพาหนะนี้สามารถเข้าถึงได้
                      </FormDescription>
                      <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                        {allAreas.map((area: AreaItem) => (
                          <FormField
                            key={area.id}
                            control={form.control}
                            name="authorized_area"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={area.id}
                                  className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(area.id)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                          ? field.onChange([
                                              ...currentValue,
                                              area.id,
                                            ])
                                          : field.onChange(
                                              currentValue.filter(
                                                (value) => value !== area.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {area.name}
                                      </span>
                                      {area.description && (
                                        <span className="text-xs text-gray-500">
                                          {area.description}
                                        </span>
                                      )}
                                    </div>
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Note */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">หมายเหตุ</h3>

              <FormField
                control={form.control}
                name="note"
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
                      ข้อมูลเพิ่มเติมเกี่ยวกับยานพาหนะ
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Form>
      </FormDialog>
    </>
  );
}

export default CreateVehicleDrawer;
