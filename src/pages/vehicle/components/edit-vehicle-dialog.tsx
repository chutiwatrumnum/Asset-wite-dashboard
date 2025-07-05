// src/pages/vehicle/components/edit-vehicle-dialog.tsx
"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Card, CardContent } from "@/components/ui/card";
import { useHouseListQuery } from "@/react-query/manage/house";
import { useUserAuthorizedAreasQuery } from "@/react-query/manage/area";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type { vehicleItem, newVehicleRequest } from "@/api/vehicle/vehicle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEditVehicleMutation } from "@/react-query/manage/vehicle";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
// Import from vehicleUtils
import {
  VEHICLE_TIERS,
  THAI_PROVINCES,
  validateLicensePlate,
} from "@/utils/vehicleUtils";

// Convert constants to select list format
const tierSelectList = Object.entries(VEHICLE_TIERS).map(([value, info]) => ({
  value,
  label: info.label,
}));

const provinceList = Object.entries(THAI_PROVINCES).map(([value, label]) => ({
  value,
  label,
}));

// Schema with validation using vehicleUtils
const editFormSchema = z.object({
  // Required fields based on API requirements
  license_plate: z
    .string()
    .min(1, { message: "กรุณากรอกป้ายทะเบียน" })
    .refine(validateLicensePlate, {
      message: "รูปแบบป้ายทะเบียนไม่ถูกต้อง (เช่น กข 1234 หรือ 1กค234)",
    }),
  area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
  tier: z.string().min(1, { message: "กรุณาเลือกระดับ" }),
  start_time: z.string().min(1, { message: "กรุณาระบุวันที่เริ่มมีผล" }),
  expire_time: z.string().min(1, { message: "กรุณาระบุวันหมดอายุ" }),
  house_id: z.string().min(1, { message: "กรุณาเลือกบ้าน" }),
  authorized_area: z
    .array(z.string())
    .min(1, { message: "กรุณาเลือกพื้นที่ที่ได้รับอนุญาตอย่างน้อย 1 พื้นที่" }),

  // Optional fields
  invitation: z.string().optional(),
  stamper: z.string().optional(),
  stamped_time: z.string().optional(),
  note: z.string().optional(),
});

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: updateVehicle } = useEditVehicleMutation();

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      license_plate: "",
      area_code: "",
      tier: "",
      start_time: "",
      expire_time: "",
      house_id: "",
      authorized_area: [],
      invitation: "",
      stamper: "",
      stamped_time: "",
      note: "",
    },
  });

  // Complete reset function
  const resetAllStates = useCallback(() => {
    setIsLoading(false);
    setConfirmOpen(false);
    setIsDirty(false);

    form.reset({
      license_plate: "",
      area_code: "",
      tier: "",
      start_time: "",
      expire_time: "",
      house_id: "",
      authorized_area: [],
      invitation: "",
      stamper: "",
      stamped_time: "",
      note: "",
    });
  }, [form]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      resetAllStates();
    }
  }, [open, resetAllStates]);

  // Format datetime for input
  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  // Populate form when vehicleData changes and drawer opens
  useEffect(() => {
    if (vehicleData && open) {
      const formData = {
        license_plate: vehicleData.license_plate || "",
        area_code: vehicleData.area_code || "",
        tier: vehicleData.tier || "",
        start_time: formatDateTimeForInput(vehicleData.start_time),
        expire_time: formatDateTimeForInput(vehicleData.expire_time),
        house_id: vehicleData.house_id || "",
        authorized_area: vehicleData.authorized_area || [],
        invitation: vehicleData.invitation || "",
        stamper: vehicleData.stamper || "",
        stamped_time: formatDateTimeForInput(vehicleData.stamped_time),
        note: vehicleData.note || "",
      };

      form.reset(formData);
      setIsDirty(false);
    }
  }, [vehicleData, open, form]);

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

  // Handle close with confirmation
  const handleClose = () => {
    if (isDirty && !isLoading) {
      setConfirmOpen(true);
    } else {
      resetAllStates();
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    resetAllStates();
    onOpenChange(false);
  };

  const handleCancelClose = () => {
    setConfirmOpen(false);
  };

  // Handle sheet open change (includes X button click)
  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      onOpenChange(open);
    }
  };

  async function onSubmit(values: z.infer<typeof editFormSchema>) {
    setIsLoading(true);
    try {
      console.log("Form submission values:", values);

      // ข้อมูลเริ่มต้นที่จำเป็น
      const reqData: newVehicleRequest = {
        id: vehicleData?.id,
        license_plate: values.license_plate.trim(),
        area_code: values.area_code,
        tier: values.tier,
        issuer: vehicleData?.issuer || Pb.authStore.record?.id || "",
        authorized_area: values.authorized_area,
        house_id: values.house_id,
        start_time: values.start_time,
        expire_time: values.expire_time,
      };

      // ฟิลด์ที่เป็น optional
      if (values.invitation) reqData.invitation = values.invitation;
      if (values.stamper) reqData.stamper = values.stamper;
      if (values.stamped_time) reqData.stamped_time = values.stamped_time;
      if (values.note) reqData.note = values.note;

      console.log("Sending data to API:", reqData);

      await updateVehicle(reqData);

      toast.success("อัปเดตข้อมูลสำเร็จ");
      resetAllStates();
      onVehicleUpdated();
    } catch (error: any) {
      console.error("Update vehicle failed:", error);

      // ตรวจสอบรายละเอียดข้อผิดพลาด
      let errorMessage = "เกิดข้อผิดพลาดในการอัปเดตข้อมูล";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.data) {
        // แสดง validation errors
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

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>แก้ไขข้อมูลยานพาหนะ</SheetTitle>
            <SheetDescription>
              แก้ไขข้อมูลยานพาหนะ {vehicleData?.license_plate}
            </SheetDescription>
          </SheetHeader>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4">
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
                              {provinceList.map((province) => (
                                <SelectItem
                                  key={province.value}
                                  value={province.value}>
                                  {province.label}
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
                              {tierSelectList.map((tier) => (
                                <SelectItem key={tier.value} value={tier.value}>
                                  {tier.label}
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
                          <FormLabel>บ้าน *</FormLabel>
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
                          <FormLabel>พื้นที่ที่ได้รับอนุญาต *</FormLabel>
                          <FormDescription>
                            เลือกพื้นที่ที่ยานพาหนะนี้สามารถเข้าถึงได้
                            (ตามสิทธิ์ของคุณ)
                          </FormDescription>
                          <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                            {userAuthorizedAreas &&
                            userAuthorizedAreas.length > 0 ? (
                              userAuthorizedAreas.map((area: AreaItem) => (
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
                                            checked={field.value?.includes(
                                              area.id
                                            )}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([
                                                    ...field.value,
                                                    area.id,
                                                  ])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) =>
                                                        value !== area.id
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
                      ช่วงเวลาที่ใช้งาน (จำเป็น)
                    </h3>

                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>วันที่เริ่มมีผล *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            วันที่และเวลาที่อนุญาตให้ยานพาหนะเข้าใช้งาน
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
                          <FormLabel>วันหมดอายุ *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            วันที่และเวลาที่สิ้นสุดการอนุญาต
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

                  <SheetFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "กำลังอัปเดต..." : "อัปเดต"}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะปิดแบบฟอร์มนี้
              ข้อมูลที่คุณทำการเปลี่ยนแปลงอาจไม่ถูกบันทึก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default EditVehicleDialog;
