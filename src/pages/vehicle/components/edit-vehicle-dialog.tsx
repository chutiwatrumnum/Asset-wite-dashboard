// src/pages/vehicle/components/edit-vehicle-dialog.tsx - ใช้ shared components
"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// ใช้ FormDialog แทน Sheet
import { FormDialog } from "@/components/ui/form-dialog";
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
import type { vehicleItem, newVehicleRequest } from "@/api/vehicle/vehicle";
import { useEditVehicleMutation } from "@/react-query/manage/vehicle";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
import {
  VEHICLE_TIERS,
  THAI_PROVINCES,
  validateLicensePlate,
} from "@/utils/vehicleUtils";

// Form schema
const editFormSchema = z
  .object({
    license_plate: z
      .string()
      .min(1, { message: "กรุณากรอกป้ายทะเบียน" })
      .refine(validateLicensePlate, {
        message: "รูปแบบป้ายทะเบียนไม่ถูกต้อง (เช่น กข 1234 หรือ 1กค234)",
      }),
    area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
    tier: z
      .string()
      .min(1, { message: "กรุณาเลือกระดับ" })
      .refine((value) => Object.keys(VEHICLE_TIERS).includes(value), {
        message: "ระดับยานพาหนะไม่ถูกต้อง",
      }),
    authorized_area: z.array(z.string()),
    start_time: z.string().optional(),
    expire_time: z.string().optional(),
    house_id: z.string().optional(),
    invitation: z.string().optional(),
    stamper: z.string().optional(),
    stamped_time: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.expire_time && data.expire_time.trim() !== "") {
        try {
          const expireDate = new Date(data.expire_time);
          const now = new Date();
          return expireDate > now;
        } catch (error) {
          return false;
        }
      }
      return true;
    },
    {
      message: "วันหมดอายุต้องอยู่ในอนาคต",
      path: ["expire_time"],
    }
  )
  .refine(
    (data) => {
      if (
        data.start_time &&
        data.expire_time &&
        data.start_time.trim() !== "" &&
        data.expire_time.trim() !== ""
      ) {
        try {
          const startDate = new Date(data.start_time);
          const expireDate = new Date(data.expire_time);
          return startDate < expireDate;
        } catch (error) {
          return false;
        }
      }
      return true;
    },
    {
      message: "วันที่เริ่มมีผลต้องน้อยกว่าวันหมดอายุ",
      path: ["start_time"],
    }
  );

type EditFormSchema = z.infer<typeof editFormSchema>;

interface EditVehicleDialogProps {
  vehicleData: vehicleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleUpdated: () => void;
}

export function EditVehicleDialog({
  vehicleData,
  open,
  onOpenChange,
  onVehicleUpdated,
}: EditVehicleDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: updateVehicle } = useEditVehicleMutation();

  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      license_plate: "",
      area_code: "",
      tier: "",
      authorized_area: [],
      start_time: "",
      expire_time: "",
      house_id: "",
      invitation: "",
      stamper: "",
      stamped_time: "",
      note: "",
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

  // Safe function to parse array data
  const safeParseArray = (data: any): string[] => {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Safe function to validate tier
  const getValidTier = (tier: string): string => {
    if (Object.keys(VEHICLE_TIERS).includes(tier)) {
      return tier;
    }

    const tierMappings: { [key: string]: string } = {
      validation_required: "unknown visitor",
      "": "unknown visitor",
      null: "unknown visitor",
      undefined: "unknown visitor",
    };

    const mappedTier = tierMappings[tier] || "unknown visitor";
    console.warn(`Invalid tier "${tier}" mapped to "${mappedTier}"`);
    return mappedTier;
  };

  // Reset form when vehicleData changes
  useEffect(() => {
    if (vehicleData && open) {
      console.log("Original vehicleData:", vehicleData);

      try {
        const authorizedArea = safeParseArray(vehicleData.authorized_area);
        const validTier = getValidTier(vehicleData.tier);

        if (vehicleData.tier !== validTier) {
          toast.warning(
            `ระดับยานพาหนะไม่ถูกต้อง "${vehicleData.tier}" จะถูกเปลี่ยนเป็น "${validTier}"`
          );
        }

        const formData = {
          license_plate: vehicleData.license_plate || "",
          area_code: vehicleData.area_code || "",
          tier: validTier,
          authorized_area: authorizedArea,
          start_time: formatDateTimeForInput(vehicleData.start_time),
          expire_time: formatDateTimeForInput(vehicleData.expire_time),
          house_id: vehicleData.house_id || "",
          invitation: vehicleData.invitation || "",
          stamper: vehicleData.stamper || "",
          stamped_time: formatDateTimeForInput(vehicleData.stamped_time),
          note: vehicleData.note || "",
        };

        console.log("Setting form data:", formData);
        form.reset(formData);
        setIsDirty(false);
      } catch (error) {
        console.error("Error setting form data:", error);
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        onOpenChange(false);
      }
    }
  }, [vehicleData, open, form, onOpenChange]);

  // Watch for form changes
  useEffect(() => {
    if (!open) return;

    const subscription = form.watch(() => {
      if (open) {
        setIsDirty(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, open]);

  // Format datetime for API
  const formatDateTimeForAPI = (dateString: string): string => {
    if (!dateString || dateString.trim() === "") {
      return "";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toISOString();
    } catch (error) {
      console.error("Error formatting date for API:", error);
      return "";
    }
  };

  async function onSubmit(values: EditFormSchema) {
    setIsLoading(true);
    try {
      console.log("Form submission values:", values);

      if (!values.license_plate?.trim()) {
        throw new Error("ป้ายทะเบียนไม่สามารถเป็นค่าว่างได้");
      }

      if (!values.area_code) {
        throw new Error("กรุณาเลือกจังหวัด");
      }

      if (!values.tier || !Object.keys(VEHICLE_TIERS).includes(values.tier)) {
        throw new Error("กรุณาเลือกระดับยานพาหนะที่ถูกต้อง");
      }

      const reqData: newVehicleRequest = {
        id: vehicleData?.id,
        license_plate: values.license_plate.trim(),
        area_code: values.area_code,
        tier: values.tier,
        issuer: vehicleData?.issuer || Pb.authStore.record?.id || "",
        authorized_area: values.authorized_area,
      };

      // Optional fields
      if (
        values.house_id &&
        values.house_id.trim() !== "" &&
        values.house_id !== "none"
      ) {
        reqData.house_id = values.house_id;
      }

      if (values.note && values.note.trim() !== "") {
        reqData.note = values.note;
      }

      if (values.invitation && values.invitation.trim() !== "") {
        reqData.invitation = values.invitation;
      }

      if (values.stamper && values.stamper.trim() !== "") {
        reqData.stamper = values.stamper;
      }

      // DateTime fields
      if (values.start_time && values.start_time.trim() !== "") {
        const formattedStartTime = formatDateTimeForAPI(values.start_time);
        if (formattedStartTime) {
          reqData.start_time = formattedStartTime;
        }
      }

      if (values.expire_time && values.expire_time.trim() !== "") {
        const formattedExpireTime = formatDateTimeForAPI(values.expire_time);
        if (formattedExpireTime) {
          reqData.expire_time = formattedExpireTime;
        }
      }

      if (values.stamped_time && values.stamped_time.trim() !== "") {
        const formattedStampedTime = formatDateTimeForAPI(values.stamped_time);
        if (formattedStampedTime) {
          reqData.stamped_time = formattedStampedTime;
        }
      }

      console.log("Sending data to API:", reqData);

      await updateVehicle(reqData);

      toast.success("อัปเดตข้อมูลสำเร็จ");
      setIsDirty(false);
      onVehicleUpdated();
    } catch (error: any) {
      console.error("Update vehicle failed:", error);

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
  }

  const handleCancel = () => {
    form.reset();
    setIsDirty(false);
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="แก้ไขข้อมูลยานพาหนะ"
      description={`แก้ไขข้อมูลยานพาหนะ ${vehicleData?.license_plate}`}
      isLoading={isLoading}
      isDirty={isDirty}
      showConfirmClose={true}
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={handleCancel}
      submitLabel="อัปเดต"
      cancelLabel="ยกเลิก"
      submitDisabled={!form.formState.isValid}
      size="lg">
      <Form {...form}>
        <div className="space-y-4">
          {/* ข้อมูลหลัก (Required) */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลหลัก (จำเป็น)
            </h3>

            <FormField
              control={form.control}
              name="license_plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ป้ายทะเบียน *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น กข 1234 หรือ 1กค234"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    รูปแบบป้ายทะเบียนไทย (เก่า: กข 1234, ใหม่: 1กค234)
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
                    <SelectContent>
                      {Object.entries(THAI_PROVINCES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    รหัสจังหวัดตามมาตรฐาน ISO3166-2:TH
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ระดับยานพาหนะ *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกระดับ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(VEHICLE_TIERS).map(([value, info]) => (
                        <SelectItem key={value} value={value}>
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>ระดับของยานพาหนะ</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="house_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>บ้าน</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? "" : value);
                    }}
                    value={field.value || "none"}
                    disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบ้าน" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">ไม่ระบุ</SelectItem>
                      {houseList?.items.map((house: HouseItem) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    บ้านที่ยานพาหนะนี้เกี่ยวข้อง
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorized_area"
              render={() => (
                <FormItem>
                  <FormLabel>พื้นที่ที่ได้รับอนุญาต</FormLabel>
                  <FormDescription>
                    เลือกพื้นที่ที่ยานพาหนะนี้สามารถเข้าถึงได้ (ตามสิทธิ์ของคุณ)
                  </FormDescription>
                  <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                    {userAuthorizedAreas && userAuthorizedAreas.length > 0 ? (
                      userAuthorizedAreas.map((area: AreaItem) => (
                        <FormField
                          key={area.id}
                          control={form.control}
                          name="authorized_area"
                          render={({ field }) => {
                            const currentValue = field.value || [];
                            return (
                              <FormItem
                                key={area.id}
                                className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={currentValue.includes(area.id)}
                                    onCheckedChange={(checked) => {
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
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        คุณไม่มีสิทธิ์ในการกำหนดพื้นที่ใดๆ
                        กรุณาติดต่อผู้ดูแลระบบ
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* DateTime Fields */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ช่วงเวลาที่ใช้งาน (ไม่จำเป็น)
            </h3>

            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วันที่เริ่มมีผล</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    วันที่และเวลาที่อนุญาตให้ยานพาหนะเข้าใช้งาน
                    (ไม่ระบุหากต้องการให้เริ่มใช้ได้ทันที)
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
                  <FormLabel>วันหมดอายุ</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    วันที่และเวลาที่สิ้นสุดการอนุญาต (ต้องอยู่ในอนาคต หากระบุ)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Optional fields */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลเพิ่มเติม (ไม่จำเป็น)
            </h3>

            <FormField
              control={form.control}
              name="invitation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสคำเชิญ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Relation record ID สำหรับการนัดหมาย"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    รหัสการนัดหมายที่เกี่ยวข้อง (ถ้ามี)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Approval Fields */}
            <FormField
              control={form.control}
              name="stamper"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ผู้อนุมัติ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="รหัสผู้อนุมัติ"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    รหัสของผู้ที่อนุมัติการเข้า-ออก
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stamped_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เวลาอนุมัติ</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    วันที่และเวลาที่ทำการอนุมัติ
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Note Field */}
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}

export default EditVehicleDialog;
