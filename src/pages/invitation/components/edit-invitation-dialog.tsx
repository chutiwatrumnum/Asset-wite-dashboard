// src/pages/invitation/components/edit-invitation-dialog.tsx
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
import type {
  InvitationItem,
  newInvitationRequest,
} from "@/api/invitation/invitation";
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
import { useEditInvitationMutation } from "@/react-query/manage/invitation";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";
import { validateInvitationTimeRange } from "@/utils/invitationUtils";

// Form schema
const editFormSchema = z
  .object({
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

type EditFormSchema = z.infer<typeof editFormSchema>;

interface EditInvitationDialogProps {
  invitationData: InvitationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationUpdated: () => void;
}

export function EditInvitationDialog({
  invitationData,
  open,
  onOpenChange,
  onInvitationUpdated,
}: EditInvitationDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const { data: userAuthorizedAreas } = useUserAuthorizedAreasQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: updateInvitation } = useEditInvitationMutation();

  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editFormSchema),
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

  // Complete reset function
  const resetAllStates = useCallback(() => {
    setIsLoading(false);
    setConfirmOpen(false);
    setIsDirty(false);

    form.reset({
      visitor_name: "",
      start_time: "",
      expire_time: "",
      house_id: "",
      authorized_area: [],
      note: "",
      active: true,
    });
  }, [form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetAllStates();
    }
  }, [open, resetAllStates]);

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

  // Populate form when invitationData changes and dialog opens
  useEffect(() => {
    if (invitationData && open) {
      console.log("Original invitationData:", invitationData);

      try {
        const authorizedArea = safeParseArray(invitationData.authorized_area);
        console.log("Parsed authorized_area:", authorizedArea);

        const formData = {
          visitor_name: invitationData.visitor_name || "",
          start_time: formatDateTimeForInput(invitationData.start_time),
          expire_time: formatDateTimeForInput(invitationData.expire_time),
          house_id: invitationData.house_id || "",
          authorized_area: authorizedArea,
          note: invitationData.note || "",
          active:
            invitationData.active !== undefined ? invitationData.active : true,
        };

        console.log("Setting form data:", formData);
        form.reset(formData);
        setIsDirty(false);
      } catch (error) {
        console.error("Error setting form data:", error);
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        resetAllStates();
        onOpenChange(false);
      }
    }
  }, [invitationData, open, form, resetAllStates, onOpenChange]);

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

  async function onSubmit(values: EditFormSchema) {
    setIsLoading(true);
    try {
      console.log("Form submission values:", values);

      // Additional validation
      const timeValidation = validateInvitationTimeRange(
        values.start_time,
        values.expire_time
      );
      if (timeValidation) {
        throw new Error(timeValidation);
      }

      const reqData: newInvitationRequest = {
        id: invitationData?.id,
        visitor_name: values.visitor_name.trim(),
        start_time: values.start_time,
        expire_time: values.expire_time,
        house_id: values.house_id,
        authorized_area: values.authorized_area,
        issuer: invitationData?.issuer || Pb.authStore.record?.id || "",
        active: values.active !== undefined ? values.active : true,
        note: values.note?.trim() || "",
      };

      console.log("Sending data to API:", reqData);

      await updateInvitation(reqData);

      toast.success("อัปเดตบัตรเชิญสำเร็จ");
      resetAllStates();
      onInvitationUpdated();
    } catch (error: any) {
      console.error("Update invitation failed:", error);

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

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>แก้ไขข้อมูลบัตรเชิญ</SheetTitle>
            <SheetDescription>
              แก้ไขข้อมูลบัตรเชิญ {invitationData?.visitor_name}
            </SheetDescription>
          </SheetHeader>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4">
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
                            ชื่อของบุคคลที่จะมาเยี่ยม
                          </FormDescription>
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
                    <h3 className="text-sm font-medium text-gray-900">
                      กำหนดเวลา
                    </h3>

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
                          <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                            {userAuthorizedAreas &&
                            userAuthorizedAreas.length > 0 ? (
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
                                            checked={currentValue.includes(
                                              area.id
                                            )}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([
                                                    ...currentValue,
                                                    area.id,
                                                  ])
                                                : field.onChange(
                                                    currentValue.filter(
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
                            <FormLabel>เปิดใช้งาน</FormLabel>
                            <FormDescription>
                              เปิด/ปิดการใช้งานบัตรเชิญ
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

export default EditInvitationDialog;
