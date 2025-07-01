// src/pages/residents/components/create-resident-dialog.tsx
"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, UserRoundPlus, X, Eye, EyeOff, Wand2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useCreateResidentMutation } from "@/react-query/manage/resident";
import type { HouseItem } from "@/api/house/house";
import type { newResidentRequest } from "@/api/resident/resident";
import { Checkbox } from "@/components/ui/checkbox";

type roleSelectList = {
  value: string;
  label: string;
};

const roleSelectList: roleSelectList[] = [
  {
    value: "primary",
    label: "Primary Resident",
  },
  {
    value: "co-resident",
    label: "Co-Resident",
  },
];

// Schema สำหรับ resident form
const formSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: "Password must contain uppercase, lowercase and numbers",
      }),
    passwordConfirm: z.string(),
    role: z.string().min(1, { message: "Role is required" }),
    house_id: z
      .array(z.string())
      .min(1, { message: "At least one house must be selected" }),
    authorized_area: z.array(z.string()).optional(),
    first_name: z
      .string()
      .max(500, { message: "First name must be less than 500 characters" })
      .optional(),
    last_name: z
      .string()
      .max(500, { message: "Last name must be less than 500 characters" })
      .optional(),
    avatar: z.any().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

interface CreateResidentDrawerProps {
  onResidentCreated: () => void;
}

export function CreateResidentDrawer({
  onResidentCreated,
}: CreateResidentDrawerProps) {
  const { data: houseList } = useHouseListQuery({});
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createResident } = useCreateResidentMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      role: "",
      house_id: [],
      authorized_area: [],
      first_name: "",
      last_name: "",
      avatar: undefined,
    },
  });

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setShowConfirmPassword(false);
      setImagePreview(null);
      setImageError(null);
      setIsLoading(false);
      setConfirmOpen(false);
      setIsDirty(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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

  function generateSecurePassword() {
    const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijkmnopqrstuvwxyz";
    const numberChars = "23456789";
    const specialChars = "!@#$%^&*_-+=";

    const length = 12;
    let password = "";

    password += uppercaseChars.charAt(
      Math.floor(Math.random() * uppercaseChars.length)
    );
    password += lowercaseChars.charAt(
      Math.floor(Math.random() * lowercaseChars.length)
    );
    password += numberChars.charAt(
      Math.floor(Math.random() * numberChars.length)
    );
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length)
    );

    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    form.setValue("password", password);
    form.setValue("passwordConfirm", password);
    form.trigger(["password", "passwordConfirm"]);
  }

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Convert house_id array to appropriate format for API
      const residentData: newResidentRequest = {
        ...values,
        house_id: values.house_id, // Keep as array
      };

      await createResident(residentData);

      toast.success("เพิ่มลูกบ้านสำเร็จแล้ว", {
        description: "ข้อมูลลูกบ้านใหม่ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว",
        duration: 4000,
      });

      form.reset();
      setOpen(false);
      onResidentCreated();
    } catch (error) {
      console.error("Create resident failed:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImageError(null);
      const files = e.target.files;

      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      if (!file.type.startsWith("image/")) {
        setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setImageError("ขนาดไฟล์ต้องไม่เกิน 5MB");
        return;
      }

      form.setValue("avatar", file);

      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (typeof reader.result === "string") {
            setImagePreview(reader.result);
          }
        } catch (error) {
          console.error("Error creating image preview:", error);
          setImageError("เกิดข้อผิดพลาดในการแสดงตัวอย่างรูปภาพ");
        }
      };

      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        setImageError("เกิดข้อผิดพลาดในการอ่านไฟล์");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling image upload:", error);
      setImageError("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageError(null);
    form.setValue("avatar", undefined);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button variant="default" className="gap-2">
                  <UserRoundPlus className="h-4 w-4" />
                  เพิ่มลูกบ้าน
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>เพิ่มข้อมูลลูกบ้านใหม่</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>เพิ่มข้อมูลลูกบ้านใหม่</SheetTitle>
            <SheetDescription>
              กรอกข้อมูลลูกบ้านที่ต้องการเพิ่มในระบบ
            </SheetDescription>
          </SheetHeader>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4">
                  {/* Avatar Field */}
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={() => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="self-start">
                          รูปภาพ{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
                        <div className="flex flex-col items-center gap-3 w-full">
                          <Avatar className="h-24 w-24">
                            {imagePreview ? (
                              <AvatarImage
                                src={imagePreview || "/placeholder.svg"}
                                alt="Profile preview"
                                onError={() => {
                                  setImageError(
                                    "เกิดข้อผิดพลาดในการแสดงรูปภาพ"
                                  );
                                  setImagePreview(null);
                                }}
                              />
                            ) : (
                              <AvatarFallback>
                                {form.watch("first_name")?.charAt(0) ||
                                  form.watch("email")?.charAt(0) ||
                                  "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isLoading}>
                              <Upload className="h-4 w-4 mr-1" />
                              อัปโหลดรูป
                            </Button>
                            {imagePreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeImage}
                                disabled={isLoading}>
                                <X className="h-4 w-4 mr-1" />
                                ลบรูป
                              </Button>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                          {imageError && (
                            <p className="text-sm text-destructive mt-1">
                              {imageError}
                            </p>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* First name field */}
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          ชื่อ{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Last name field */}
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          นามสกุล{" "}
                          <span className="text-muted-foreground text-sm">
                            ไม่จำเป็น
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="อีเมล"
                            type="email"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>รหัสผ่าน</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={generateSecurePassword}
                                  disabled={isLoading}>
                                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                                  สร้างรหัสผ่าน
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>สร้างรหัสผ่านใหม่</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="รหัสผ่าน"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                                  onClick={() => setShowPassword(!showPassword)}
                                  disabled={isLoading}>
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    {showPassword
                                      ? "ซ่อนรหัสผ่าน"
                                      : "แสดงรหัสผ่าน"}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {showPassword
                                    ? "ซ่อนรหัสผ่าน"
                                    : "แสดงรหัสผ่าน"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="ยืนยันรหัสผ่าน"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  disabled={isLoading}>
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    {showConfirmPassword
                                      ? "ซ่อนรหัสผ่าน"
                                      : "แสดงรหัสผ่าน"}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {showConfirmPassword
                                    ? "ซ่อนรหัสผ่าน"
                                    : "แสดงรหัสผ่าน"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>บทบาท</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกบทบาท" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleSelectList.map((role: roleSelectList) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>บทบาทของลูกบ้าน</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="house_id"
                    render={() => (
                      <FormItem>
                        <FormLabel>บ้าน</FormLabel>
                        <FormDescription>
                          เลือกบ้านที่ลูกบ้านคนนี้สามารถเข้าถึงได้
                          (สามารถเลือกได้หลายบ้าน)
                        </FormDescription>
                        <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                          {houseList?.items.map((house: HouseItem) => (
                            <FormField
                              key={house.id}
                              control={form.control}
                              name="house_id"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={house.id}
                                    className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          house.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...field.value,
                                                house.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== house.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {house.address}
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

export default CreateResidentDrawer;
