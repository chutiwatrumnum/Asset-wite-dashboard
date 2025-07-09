// src/pages/vehicle/components/create-vehicle-dialog.tsx - ใช้ shared components
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

// ใช้ FormDialog แทน Sheet โดยตรง
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouseListQuery } from "@/react-query/manage/house";
import { useUserAuthorizedAreasQuery } from "@/react-query/manage/area";
import { useCreateVehicleMutation } from "@/react-query/manage/vehicle";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type { newVehicleRequest } from "@/api/vehicle/vehicle";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
import { VEHICLE_TIERS, THAI_PROVINCES } from "@/utils/vehicleUtils";

// Form schema with validation - เพิ่มฟิลด์ที่หายไป
const formSchema = z.object({
  license_plate: z
    .string()
    .min(1, { message: "กรุณากรอกป้ายทะเบียน" })
    .max(20, { message: "ป้ายทะเบียนต้องไม่เกิน 20 ตัวอักษร" }),
  tier: z.string().min(1, { message: "กรุณาเลือกระดับยานพาหนะ" }),
  area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
  house_id: z.string().optional(),
  authorized_area: z.array(z.string()).optional(),
  start_time: z.string().optional(), // เพิ่มฟิลด์ที่หายไป
  expire_time: z.string().optional(),
  invitation: z.string().optional(), // เพิ่มฟิลด์ที่หายไป
  stamper: z.string().optional(), // เพิ่มฟิลด์ที่หายไป
  stamped_time: z.string().optional(), // เพิ่มฟิลด์ที่หายไป
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
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();

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
      tier: "",
      area_code: "",
      house_id: "",
      authorized_area: [],
      start_time: "", // เพิ่มฟิลด์ที่หายไป
      expire_time: "",
      invitation: "", // เพิ่มฟิลด์ที่หายไป
      stamper: "", // เพิ่มฟิลด์ที่หายไป
      stamped_time: "", // เพิ่มฟิลด์ที่หายไป
      note: "",
    },
  });

  // Set default expire time when form opens (1 year from now)
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

  // Watch for form changes to set dirty state
  useEffect(() => {
    if (open) {
      const subscription = form.watch(() => {
        setIsDirty(true);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, open]);

  const handleSubmit = async (values: FormSchema) => {
    try {
      setIsLoading(true);
      console.log("Form submission values:", values);

      const vehicleData: newVehicleRequest = {
        license_plate: values.license_plate.trim().toUpperCase(),
        tier: values.tier,
        area_code: values.area_code,
        house_id: values.house_id || undefined,
        authorized_area: values.authorized_area || [],
        start_time: values.start_time || undefined, // เพิ่มฟิลด์ที่หายไป
        expire_time: values.expire_time || undefined,
        invitation: values.invitation || undefined, // เพิ่มฟิลด์ที่หายไป
        stamper: values.stamper || undefined, // เพิ่มฟิลด์ที่หายไป
        stamped_time: values.stamped_time || undefined, // เพิ่มฟิลด์ที่หายไป
        issuer: Pb.authStore.record?.id || "",
        note: values.note?.trim() || "",
      };

      await createVehicle(vehicleData);

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
      let errorMessage = "เกิดข้อผิดพลาดในการเพิ่มยานพาหนะ";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("ไม่สามารถเพิ่มยานพาหนะได้", {
        description: errorMessage,
      });
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

      {/* FormDialog แทน Sheet */}
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
        submitLabel="เพิ่มยานพาหนะ"
        cancelLabel="ยกเลิก"
        submitDisabled={!form.formState.isValid}
        size="lg">
        <Form {...form}>
          <div className="space-y-4">
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
                          <SelectValue placeholder="เลือกระดับยานพาหนะ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(VEHICLE_TIERS || {}).map(
                          ([value, info]) => (
                            <SelectItem key={value} value={value}>
                              {info?.label || value}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Information */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-900">
                ข้อมูลเพิ่มเติม
              </h3>

              <FormField
                control={form.control}
                name="house_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>บ้าน (ถ้ามี)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบ้าน" />
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

              {/* เพิ่ม start_time ที่หายไป */}
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

              {/* เพิ่ม invitation field ที่หายไป */}
              <FormField
                control={form.control}
                name="invitation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสคำเชิญ (ถ้ามี)</FormLabel>
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

              {/* เพิ่ม stamper field ที่หายไป */}
              <FormField
                control={form.control}
                name="stamper"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ผู้อนุมัติ (ถ้ามี)</FormLabel>
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

              {/* เพิ่ม stamped_time field ที่หายไป */}
              <FormField
                control={form.control}
                name="stamped_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เวลาอนุมัติ (ถ้ามี)</FormLabel>
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

            {/* Area Authorization */}
            {userAuthorizedAreas && userAuthorizedAreas.length > 0 && (
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
                        (ตามสิทธิ์ของคุณ)
                      </FormDescription>
                      <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                        {userAuthorizedAreas.map((area: AreaItem) => (
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

            {/* Additional Settings */}
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
