"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Car, Plus } from "lucide-react";
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
import { useCreateVehicleMutation } from "@/react-query/manage/vehicle";
import type { HouseItem } from "@/api/house/house";
import type { newVehicleRequest } from "@/api/vehicle/vehicle";

type groupSelectList = {
  value: string;
  label: string;
};

const groupSelectList: groupSelectList[] = [
  { value: "resident", label: "ลูกบ้าน" },
  { value: "staff", label: "เจ้าหน้าที่" },
  { value: "invited", label: "ผู้มาเยี่ยม" },
  { value: "unknown", label: "ไม่ทราบ" },
  { value: "blacklisted", label: "ถูกแบน" },
];

const thaiProvinces = [
  { value: "th-10", label: "กรุงเทพฯ" },
  { value: "th-11", label: "สมุทรปราการ" },
  { value: "th-12", label: "นนทบุรี" },
  { value: "th-13", label: "ปทุมธานี" },
  { value: "th-14", label: "พระนครศรีอยุธยา" },
  { value: "th-15", label: "อ่างทอง" },
  { value: "th-16", label: "ลพบุรี" },
  { value: "th-17", label: "สิงห์บุรี" },
  { value: "th-18", label: "ชัยนาท" },
  { value: "th-19", label: "สระบุรี" },
];

const formSchema = z.object({
  license_plate: z.string().min(1, { message: "กรุณากรอกป้ายทะเบียน" }),
  area_code: z.string().min(1, { message: "กรุณาเลือกจังหวัด" }),
  group: z.string().min(1, { message: "กรุณาเลือกประเภทยานพาหนะ" }),
  start_time: z.string().min(1, { message: "กรุณาเลือกวันเวลาเริ่มต้น" }),
  expire_time: z.string().min(1, { message: "กรุณาเลือกวันเวลาสิ้นสุด" }),
  house_id: z.string().optional(),
  note: z.string().optional(),
});

interface CreateVehicleDrawerProps {
  onVehicleCreated: () => void;
}

export function CreateVehicleDrawer({
  onVehicleCreated,
}: CreateVehicleDrawerProps) {
  const { data: houseList } = useHouseListQuery({});
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { mutateAsync: createVehicle } = useCreateVehicleMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_plate: "",
      area_code: "",
      group: "",
      start_time: "",
      expire_time: "",
      house_id: "",
      note: "",
    },
  });

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
      setConfirmOpen(false);
      setIsDirty(false);
      form.reset();
    }
  }, [open, form]);

  // Watch for form changes
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

  // Generate default date times
  const generateDefaultTimes = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startTime = now.toISOString().slice(0, 16);
    const expireTime = tomorrow.toISOString().slice(0, 16);

    form.setValue("start_time", startTime);
    form.setValue("expire_time", expireTime);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const vehicleData: newVehicleRequest = {
        ...values,
        start_time: new Date(values.start_time).toISOString(),
        expire_time: new Date(values.expire_time).toISOString(),
      };

      await createVehicle(vehicleData);

      toast.success("เพิ่มยานพาหนะสำเร็จแล้ว", {
        description: "ข้อมูลยานพาหนะใหม่ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว",
        duration: 4000,
      });

      form.reset();
      setOpen(false);
      onVehicleCreated();
    } catch (error) {
      console.error("Create vehicle failed:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
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
                  <Plus className="h-4 w-4" />
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
            <SheetTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              เพิ่มข้อมูลยานพาหนะใหม่
            </SheetTitle>
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
                  <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ป้ายทะเบียน</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="เช่น กข 1234"
                            {...field}
                            disabled={isLoading}
                            className="font-mono"
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
                        <FormLabel>จังหวัด</FormLabel>
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
                            {thaiProvinces.map((province) => (
                              <SelectItem
                                key={province.value}
                                value={province.value}>
                                {province.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ประเภทยานพาหนะ</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกประเภท" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {groupSelectList.map((group) => (
                              <SelectItem key={group.value} value={group.value}>
                                {group.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>ประเภทของยานพาหนะ</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เริ่มต้น</FormLabel>
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
                          <FormLabel>สิ้นสุด</FormLabel>
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

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDefaultTimes}
                      disabled={isLoading}>
                      ตั้งเวลาเริ่มต้น
                    </Button>
                  </div>

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
                        <FormDescription>บ้านที่เกี่ยวข้อง</FormDescription>
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
                          <Input
                            placeholder="หมายเหตุเพิ่มเติม"
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

      {/* Confirmation Dialog */}
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
