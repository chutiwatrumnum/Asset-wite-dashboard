// src/pages/external_vehicle/components/edit-visitor-dialog.tsx
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
import type {
  VisitorItem,
  newVisitorRequest,
} from "@/api/external_vehicle/visitor";
import { useEditVisitorMutation } from "@/react-query/manage/external_vehicle/visitor";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
import {
  VISITOR_GENDERS,
  THAI_PROVINCES,
  validateLicensePlate,
  validateThaiName,
  validateThaiIdCard,
} from "@/utils/visitorUtils";

// Form schema
const editFormSchema = z.object({
  first_name: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อ" })
    .refine(validateThaiName, {
      message:
        "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษรและประกอบด้วยตัวอักษรที่ถูกต้อง",
    }),
  last_name: z
    .string()
    .min(1, { message: "กรุณากรอกนามสกุล" })
    .refine(validateThaiName, {
      message:
        "นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษรและประกอบด้วยตัวอักษรที่ถูกต้อง",
    }),
  gender: z.enum(["male", "female", "other"], {
    message: "กรุณาเลือกเพศ",
  }),
  id_card: z
    .string()
    .optional()
    .refine((value) => !value || validateThaiIdCard(value), {
      message: "เลขบัตรประชาชนไม่ถูกต้อง",
    }),
  license_plate: z
    .string()
    .min(1, { message: "กรุณากรอกป้ายทะเบียน" })
    .refine(validateLicensePlate, {
      message: "รูปแบบป้ายทะเบียนไม่ถูกต้อง (เช่น กข 1234 หรือ 1กค234)",
    }),
  area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
  house_id: z.string().min(1, { message: "กรุณาเลือกบ้าน" }),
  authorized_area: z.array(z.string()),
  note: z.string().optional(),
});

type EditFormSchema = z.infer<typeof editFormSchema>;

interface EditVisitorDialogProps {
  visitorData: VisitorItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisitorUpdated: () => void;
}

export function EditVisitorDialog({
  visitorData,
  open,
  onOpenChange,
  onVisitorUpdated,
}: EditVisitorDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: updateVisitor } = useEditVisitorMutation();

  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "male",
      id_card: "",
      license_plate: "",
      area_code: "",
      house_id: "",
      authorized_area: [],
      note: "",
    },
  });

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

  // Reset form when visitorData changes
  useEffect(() => {
    if (visitorData && open) {
      console.log("Original visitorData:", visitorData);

      try {
        const authorizedArea = safeParseArray(visitorData.authorized_area);

        const formData = {
          first_name: visitorData.first_name || "",
          last_name: visitorData.last_name || "",
          gender: visitorData.gender as "male" | "female" | "other",
          id_card: visitorData.id_card || "",
          license_plate: visitorData.vehicle.license_plate || "",
          area_code: visitorData.vehicle.area_code || "",
          house_id: visitorData.house_id || "",
          authorized_area: authorizedArea,
          note: visitorData.note || "",
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
  }, [visitorData, open, form, onOpenChange]);

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

  async function onSubmit(values: EditFormSchema) {
    setIsLoading(true);
    try {
      console.log("Form submission values:", values);

      if (!values.first_name?.trim()) {
        throw new Error("ชื่อไม่สามารถเป็นค่าว่างได้");
      }

      if (!values.last_name?.trim()) {
        throw new Error("นามสกุลไม่สามารถเป็นค่าว่างได้");
      }

      if (!values.license_plate?.trim()) {
        throw new Error("ป้ายทะเบียนไม่สามารถเป็นค่าว่างได้");
      }

      if (!values.area_code) {
        throw new Error("กรุณาเลือกจังหวัด");
      }

      if (!values.house_id) {
        throw new Error("กรุณาเลือกบ้าน");
      }

      const reqData: newVisitorRequest = {
        id: visitorData?.id,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        gender: values.gender,
        id_card: values.id_card?.trim() || "",
        vehicle: {
          license_plate: values.license_plate.trim().toUpperCase(),
          area_code: values.area_code,
        },
        house_id: values.house_id,
        authorized_area: values.authorized_area || [],
        issuer: visitorData?.issuer || Pb.authStore.record?.id || "",
        note: values.note?.trim() || "",
      };

      console.log("Sending data to API:", reqData);

      await updateVisitor(reqData);

      toast.success("อัปเดตข้อมูลสำเร็จ");
      setIsDirty(false);
      onVisitorUpdated();
    } catch (error: any) {
      console.error("Update visitor failed:", error);

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
      title="แก้ไขข้อมูลผู้เยี่ยมภายนอก"
      description={`แก้ไขข้อมูล ${visitorData?.first_name} ${visitorData?.last_name} (${visitorData?.vehicle.license_plate})`}
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
          {/* ข้อมูลส่วนบุคคล */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">
              ข้อมูลส่วนบุคคล
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อ"
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
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>นามสกุล *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="นามสกุล"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เพศ *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเพศ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(VISITOR_GENDERS).map(
                          ([value, info]) => (
                            <SelectItem key={value} value={value}>
                              {info.icon} {info.label}
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
                name="id_card"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขบัตรประชาชน</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1-3xxx-xxxxx-xx-x"
                        {...field}
                        disabled={isLoading}
                        maxLength={17}
                      />
                    </FormControl>
                    <FormDescription>
                      เลขบัตรประชาชน 13 หลัก (ไม่จำเป็น)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ข้อมูลยานพาหนะ */}
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
                      placeholder="เช่น กข 1234, 1กค234"
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

          {/* ข้อมูลที่พัก */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-900">ข้อมูลที่พัก</h3>

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
                    บ้านที่ผู้เยี่ยมจะเข้าไปเยี่ยม
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* พื้นที่ที่อนุญาต */}
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
                      เลือกพื้นที่ที่ผู้เยี่ยมสามารถเข้าถึงได้ (ตามสิทธิ์ของคุณ)
                    </FormDescription>
                    <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                      {userAuthorizedAreas.map((area: AreaItem) => (
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
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* หมายเหตุ */}
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
                    ข้อมูลเพิ่มเติมเกี่ยวกับผู้เยี่ยม
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </Form>
    </FormDialog>
  );
}

export default EditVisitorDialog;
