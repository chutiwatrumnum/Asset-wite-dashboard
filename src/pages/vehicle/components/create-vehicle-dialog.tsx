"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { CarIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useHouseListQuery } from "@/react-query/manage/house";
import { useUserAuthorizedAreasQuery } from "@/react-query/manage/area";
import { useCreateVehicleMutation } from "@/react-query/manage/vehicle";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type { newVehicleRequest } from "@/api/vehicle/vehicle";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
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

// แก้ไข form schema
const formSchema = z.object({
  // Required fields
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

  // Optional fields
  start_time: z.string().optional(),
  expire_time: z.string().optional(),
  house_id: z.string().optional(),
  authorized_area: z.array(z.string()).default([]),
  invitation: z.string().optional(),
  stamper: z.string().optional(),
  stamped_time: z.string().optional(),
  note: z.string().optional(),
});

// แก้ไข type definition
type FormSchema = z.infer<typeof formSchema>;

interface CreateVehicleDrawerProps {
  onVehicleCreated: () => void;
}

export function CreateVehicleDrawer({
  onVehicleCreated,
}: CreateVehicleDrawerProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: createVehicle } = useCreateVehicleMutation();

  // แก้ไข form definition
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_plate: "",
      area_code: "",
      tier: "",
      start_time: "",
      expire_time: "",
      invitation: "",
      house_id: "",
      authorized_area: [],
      stamper: "",
      stamped_time: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setIsLoading(false);
      setConfirmOpen(false);
      setIsDirty(false);
      form.reset();
    }
  }, [open, form]);

  useEffect(() => {
    if (!open) return;

    const subscription = form.watch(() => {
      setIsDirty(true);
    });

    return () => subscription.unsubscribe();
  }, [form, open]);

  const handleClose = () => {
    if (isDirty && !isLoading) {
      setConfirmOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setOpen(false);
  };

  const handleCancelClose = () => {
    setConfirmOpen(false);
  };

  // แก้ไข onSubmit function
  async function onSubmit(values: FormSchema) {
    try {
      setIsLoading(true);
      console.log("Form submission values:", values);

      // Validate required fields
      if (!values.license_plate?.trim()) {
        throw new Error("ป้ายทะเบียนไม่สามารถเป็นค่าว่างได้");
      }

      if (!values.area_code) {
        throw new Error("กรุณาเลือกจังหวัด");
      }

      if (!values.tier || !Object.keys(VEHICLE_TIERS).includes(values.tier)) {
        throw new Error("กรุณาเลือกระดับยานพาหนะที่ถูกต้อง");
      }

      // Create data object being careful with DateTime fields
      const vehicleData: newVehicleRequest = {
        // Required fields
        license_plate: values.license_plate.trim(),
        area_code: values.area_code,
        tier: values.tier,
        issuer: Pb.authStore.record?.id || "",
        authorized_area: values.authorized_area || [],
      };

      // Optional string fields
      if (
        values.house_id &&
        values.house_id.trim() !== "" &&
        values.house_id !== "none"
      ) {
        vehicleData.house_id = values.house_id;
      }

      if (values.note && values.note.trim() !== "") {
        vehicleData.note = values.note;
      }

      if (values.invitation && values.invitation.trim() !== "") {
        vehicleData.invitation = values.invitation;
      }

      if (values.stamper && values.stamper.trim() !== "") {
        vehicleData.stamper = values.stamper;
      }

      // DateTime fields - ส่งเฉพาะที่มีค่า
      if (values.start_time && values.start_time.trim() !== "") {
        vehicleData.start_time = values.start_time;
      }

      if (values.expire_time && values.expire_time.trim() !== "") {
        vehicleData.expire_time = values.expire_time;
      }

      if (values.stamped_time && values.stamped_time.trim() !== "") {
        vehicleData.stamped_time = values.stamped_time;
      }

      console.log("Final vehicleData to send:", vehicleData);

      await createVehicle(vehicleData);

      // Success handling
      toast.success("เพิ่มยานพาหนะสำเร็จแล้ว", {
        description: "ข้อมูลยานพาหนะใหม่ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว",
        duration: 4000,
      });

      form.reset();
      setOpen(false);
      onVehicleCreated();
    } catch (error) {
      console.error("Create vehicle failed:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการเพิ่มข้อมูล";

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

      toast.error("ไม่สามารถเพิ่มข้อมูลได้", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button variant="default" className="gap-2">
                  <CarIcon className="h-4 w-4" />
                  เพิ่มยานพาหนะ
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>เพิ่มข้อมูลยานพาหนะใหม่</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>เพิ่มข้อมูลยานพาหนะใหม่</SheetTitle>
            <SheetDescription>
              กรอกข้อมูลยานพาหนะที่ต้องการเพิ่มในระบบ
            </SheetDescription>
          </SheetHeader>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4">
                  {/* Required Fields Section */}
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
                            <SelectContent className="max-h-60">
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
                  </div>

                  {/* Optional Relation Fields */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      ข้อมูลความสัมพันธ์ (ไม่จำเป็น)
                    </h3>

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
                            วันที่และเวลาที่สิ้นสุดการอนุญาต
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
                      {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะปิดแบบฟอร์มนี้ ข้อมูลที่คุณกรอกอาจไม่ถูกบันทึก
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

export default CreateVehicleDrawer;
