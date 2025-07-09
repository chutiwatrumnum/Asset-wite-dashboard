// src/pages/invitation/components/create-invitation-dialog.tsx - แก้ไขให้รับ props แทน ref
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { UserPlusIcon } from "lucide-react";
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
import { useCreateInvitationMutation } from "@/react-query/manage/invitation";
import type { HouseItem } from "@/api/house/house";
import type { AreaItem } from "@/api/area/area";
import type { newInvitationRequest } from "@/api/invitation/invitation";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
import { validateInvitationTimeRange } from "@/utils/invitationUtils";

// ใช้ FormDialog component แทน Sheet
import { FormDialog } from "@/components/ui/form-dialog";

// Form schema with validation
const formSchema = z
  .object({
    // Required fields
    visitor_name: z
      .string()
      .min(1, { message: "กรุณากรอกชื่อผู้เยี่ยม" })
      .max(100, { message: "ชื่อผู้เยี่ยมต้องไม่เกิน 100 ตัวอักษร" }),
    start_time: z.string().min(1, { message: "กรุณาระบุเวลาเริ่มต้น" }),
    expire_time: z.string().min(1, { message: "กรุณาระบุเวลาสิ้นสุด" }),
    house_id: z.string().min(1, { message: "กรุณาเลือกบ้าน" }),
    authorized_area: z
      .array(z.string())
      .min(1, { message: "กรุณาเลือกพื้นที่อนุญาตอย่างน้อย 1 พื้นที่" }),

    // Optional fields
    note: z.string().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const validation = validateInvitationTimeRange(
        data.start_time,
        data.expire_time
      );
      return validation === null;
    },
    {
      message: "ช่วงเวลาไม่ถูกต้อง",
      path: ["expire_time"],
    }
  );

type FormSchema = z.infer<typeof formSchema>;

interface CreateInvitationDrawerProps {
  onInvitationCreated: () => void;
  // แก้ไข: รับ props แทน ref
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // เพิ่ม props สำหรับ trigger button
  showTriggerButton?: boolean;
}

export function CreateInvitationDrawer({
  onInvitationCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showTriggerButton = true,
}: CreateInvitationDrawerProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();

  // ใช้ state internal หรือ external
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createInvitation } = useCreateInvitationMutation();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitor_name: "",
      start_time: "",
      expire_time: "",
      house_id: "",
      authorized_area: [],
      note: "",
      active: true,
    },
  });

  // Set default times when form opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Format for datetime-local input
      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      form.setValue("start_time", formatForInput(now));
      form.setValue("expire_time", formatForInput(oneHourLater));
    }
  }, [open, form]);

  // Watch for form changes to determine if it's dirty
  const watchedValues = form.watch();
  const isDirty = Object.values(watchedValues).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value !== true; // active ค่าเริ่มต้นเป็น true
    return value !== "" && value !== undefined;
  });

  const handleSubmit = async (values: FormSchema) => {
    try {
      setIsLoading(true);
      console.log("Form submission values:", values);

      // Additional validation
      const timeValidation = validateInvitationTimeRange(
        values.start_time,
        values.expire_time
      );
      if (timeValidation) {
        throw new Error(timeValidation);
      }

      // Create data object
      const invitationData: newInvitationRequest = {
        visitor_name: values.visitor_name.trim(),
        start_time: values.start_time,
        expire_time: values.expire_time,
        house_id: values.house_id,
        authorized_area: values.authorized_area,
        issuer: Pb.authStore.record?.id || "",
        active: values.active !== undefined ? values.active : true,
        note: values.note?.trim() || "",
      };

      console.log("Final invitationData to send:", invitationData);

      await createInvitation(invitationData);

      toast.success("สร้างบัตรเชิญสำเร็จแล้ว", {
        description: `สร้างบัตรเชิญสำหรับ ${values.visitor_name} เรียบร้อยแล้ว`,
        duration: 4000,
      });

      form.reset();
      setOpen(false);
      onInvitationCreated();
    } catch (error) {
      console.error("Create invitation failed:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการสร้างบัตรเชิญ";

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

      toast.error("ไม่สามารถสร้างบัตรเชิญได้", {
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

  return (
    <>
      {/* Trigger Button - แสดงเฉพาะเมื่อ showTriggerButton = true */}
      {showTriggerButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setOpen(true)}>
                <UserPlusIcon className="h-4 w-4" />
                สร้างบัตรเชิญ
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>สร้างบัตรเชิญใหม่สำหรับผู้เยี่ยม</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* FormDialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="สร้างบัตรเชิญใหม่"
        description="กรอกข้อมูลเพื่อสร้างบัตรเชิญสำหรับผู้เยี่ยม"
        isLoading={isLoading}
        isDirty={isDirty}
        showConfirmClose={true}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        submitLabel="สร้างบัตรเชิญ"
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
                    <FormDescription>ชื่อของบุคคลที่จะมาเยี่ยม</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="house_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>บ้านที่จะเยี่ยม *</FormLabel>
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
                      บ้านที่ผู้เยี่ยมต้องการเข้าชม
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time Settings */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-900">กำหนดเวลา</h3>

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เวลาเริ่มต้น *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      วันที่และเวลาที่อนุญาตให้เข้าใช้งาน
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
                    <FormLabel>เวลาสิ้นสุด *</FormLabel>
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

            {/* Area Authorization */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-900">
                พื้นที่ที่อนุญาต
              </h3>

              <FormField
                control={form.control}
                name="authorized_area"
                render={() => (
                  <FormItem>
                    <FormLabel>เลือกพื้นที่ที่อนุญาต *</FormLabel>
                    <FormDescription>
                      เลือกพื้นที่ที่ผู้เยี่ยมสามารถเข้าถึงได้ (ตามสิทธิ์ของคุณ)
                    </FormDescription>
                    <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                      {userAuthorizedAreas && userAuthorizedAreas.length > 0 ? (
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
                                      checked={field.value?.includes(area.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              area.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
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

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                ตั้งค่าเพิ่มเติม
              </h3>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>เปิดใช้งานทันที</FormLabel>
                      <FormDescription>
                        หากไม่เลือก บัตรเชิญจะถูกสร้างแต่ยังไม่สามารถใช้งานได้
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

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
                      ข้อมูลเพิ่มเติมเกี่ยวกับการเยี่ยม
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

export default CreateInvitationDrawer;
