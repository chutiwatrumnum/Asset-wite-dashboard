// src/pages/external_vehicle/components/create-visitor-dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouseListQuery } from "@/react-query/manage/house";
import { useUserAuthorizedAreasQuery } from "@/react-query/manage/area";
import { useCreateVisitorMutation } from "@/react-query/manage/external_vehicle/visitor";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type { newVisitorRequest } from "@/api/external_vehicle/visitor";
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

// Form schema with validation
const formSchema = z.object({
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
  authorized_area: z.array(z.string()).optional(),
  note: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface CreateVisitorDialogProps {
  onVisitorCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTriggerButton?: boolean;
}

export function CreateVisitorDialog({
  onVisitorCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showTriggerButton = true,
}: CreateVisitorDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: createVisitor } = useCreateVisitorMutation();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
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

      const visitorData: newVisitorRequest = {
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
        issuer: Pb.authStore.record?.id || "",
        note: values.note?.trim() || "",
      };

      await createVisitor(visitorData);

      toast.success("เพิ่มผู้เยี่ยมภายนอกสำเร็จแล้ว", {
        description: `เพิ่มข้อมูล ${values.first_name} ${values.last_name} เรียบร้อยแล้ว`,
        duration: 4000,
      });

      form.reset();
      setIsDirty(false);
      setOpen(false);
      onVisitorCreated();
    } catch (error) {
      console.error("Create visitor failed:", error);
      let errorMessage = "เกิดข้อผิดพลาดในการเพิ่มผู้เยี่ยมภายนอก";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("ไม่สามารถเพิ่มผู้เยี่ยมภายนอกได้", {
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
          เพิ่มผู้เยี่ยมภายนอก
        </Button>
      )}

      {/* FormDialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="เพิ่มผู้เยี่ยมภายนอกใหม่"
        description="กรอกข้อมูลเพื่อเพิ่มผู้เยี่ยมภายนอกใหม่เข้าสู่ระบบ"
        isLoading={isLoading}
        isDirty={isDirty}
        showConfirmClose={true}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        submitLabel="เพิ่มผู้เยี่ยมภายนอก"
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
              <h3 className="text-sm font-medium text-gray-900">
                ข้อมูลที่พัก
              </h3>

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
                        เลือกพื้นที่ที่ผู้เยี่ยมสามารถเข้าถึงได้
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
    </>
  );
}

export default CreateVisitorDialog;
