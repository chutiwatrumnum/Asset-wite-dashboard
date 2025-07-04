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
import type { HouseItem } from "@/api/house/house";
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
  license_plate: z
    .string()
    .min(1, { message: "กรุณากรอกป้ายทะเบียน" })
    .refine(validateLicensePlate, {
      message: "รูปแบบป้ายทะเบียนไม่ถูกต้อง (เช่น กข 1234 หรือ 1กค234)",
    }),
  area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
  tier: z.string().min(1, { message: "กรุณาเลือกระดับ" }),
  start_time: z.string().optional(),
  expire_time: z.string().optional(),
  house_id: z.string().optional(),
  authorized_area: z.array(z.string()).optional(),
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
      const reqData = values as newVehicleRequest;
      reqData.id = vehicleData?.id;

      // แปลงวันที่เป็น ISO string ถ้ามีการกรอก
      if (values.start_time) {
        reqData.start_time = new Date(values.start_time).toISOString();
      }
      if (values.expire_time) {
        reqData.expire_time = new Date(values.expire_time).toISOString();
      }

      await updateVehicle(reqData);

      toast.success("อัปเดตข้อมูลสำเร็จ");
      resetAllStates();
      onVehicleUpdated();
    } catch (error: any) {
      console.error("Update vehicle failed:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
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
                        <FormLabel>
                          บ้าน{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            // Handle special "none" value
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
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          วันที่เริ่มมีผล{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
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
                        <FormLabel>
                          วันหมดอายุ{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
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

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          หมายเหตุ{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
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
