// src/pages/residents/components/edit-resident-dialog.tsx
"use client";

import type React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, X, Eye, EyeOff, Wand2 } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHouseListQuery } from "@/react-query/manage/house";
import type { HouseItem } from "@/api/house/house";
import type { residentItem, newResidentRequest } from "@/api/resident/resident";
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
import { useEditResidentMutation } from "@/react-query/manage/resident";
import { Checkbox } from "@/components/ui/checkbox";
import Pb from "@/api/pocketbase";

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

const editFormSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, {
        message: "Password must be at least 8 characters if provided",
      })
      .refine((val) => !val || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val), {
        message:
          "Password must contain uppercase, lowercase and numbers if provided",
      }),
    passwordConfirm: z.string().optional(),
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
  .refine(
    (data) => {
      if (data.password || data.passwordConfirm) {
        return data.password === data.passwordConfirm;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["passwordConfirm"],
    }
  );

interface EditResidentDialogProps {
  residentData: residentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResidentUpdated: () => void;
}

export function EditResidentDialog({
  residentData,
  open,
  onOpenChange,
  onResidentUpdated,
}: EditResidentDialogProps) {
  const { data: houseList } = useHouseListQuery({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutateAsync: updateResident } = useEditResidentMutation();

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      email: "",
      role: "",
      house_id: [],
      authorized_area: [],
      first_name: "",
      last_name: "",
      avatar: undefined,
    },
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Complete reset function
  const resetAllStates = useCallback(() => {
    if (!isMountedRef.current) return;

    setImagePreview(null);
    setImageError(null);
    setIsLoading(false);
    setConfirmOpen(false);
    setIsDirty(false);
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    form.reset({
      email: "",
      role: "",
      house_id: [],
      authorized_area: [],
      first_name: "",
      last_name: "",
      avatar: undefined,
    });
  }, [form]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      resetAllStates();
    }
  }, [open, resetAllStates]);

  async function imageUrlToFile(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${url}`);
      }
      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject("Failed to convert image to base64 string.");
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image URL to file:", error);
      return "";
    }
  }

  // Populate form when residentData changes and drawer opens
  useEffect(() => {
    const fetchData = async () => {
      if (residentData && open) {
        // Prepare house_id as array
        let houseIdArray: string[] = [];
        if (typeof residentData.house_id === "string") {
          try {
            houseIdArray = JSON.parse(residentData.house_id);
          } catch {
            houseIdArray = [residentData.house_id];
          }
        } else if (Array.isArray(residentData.house_id)) {
          houseIdArray = residentData.house_id;
        }

        const formData = {
          email: residentData.email || "",
          role: residentData.role || "",
          house_id: houseIdArray,
          authorized_area: residentData.authorized_area || [],
          first_name: residentData.first_name || "",
          last_name: residentData.last_name || "",
        };

        form.reset(formData);

        // Handle avatar
        if (residentData.avatar) {
          try {
            residentData.collectionName = "resident";
            const imageUrl = Pb.files.getURL(residentData, residentData.avatar);
            const file = await imageUrlToFile(imageUrl);
            if (file) {
              setImagePreview(file);
            }
          } catch (error) {
            console.error("Error loading avatar:", error);
          }
        }

        setIsDirty(false);
      }
    };
    fetchData();
  }, [residentData, open, form]);

  // Watch for form changes
  useEffect(() => {
    if (!open) return;

    const subscription = form.watch(() => {
      if (open && isMountedRef.current) {
        setIsDirty(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
      const reqData = values as newResidentRequest;
      reqData.id = residentData?.id;
      await updateResident(reqData);

      if (isMountedRef.current) {
        toast.success("อัปเดตข้อมูลสำเร็จ");
        resetAllStates();
        onResidentUpdated();
      }
    } catch (error: any) {
      console.error("Update resident failed:", error);
      if (isMountedRef.current) {
        toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImageError(null);
      const files = e.target.files;

      if (!files || files.length === 0) return;

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
        if (typeof reader.result === "string") {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling image upload:", error);
      setImageError("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    }
  };

  const removeImage = () => {
    setImagePreview(residentData?.avatar || null);
    setImageError(null);
    form.setValue("avatar", undefined);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>แก้ไขข้อมูลลูกบ้าน</SheetTitle>
            <SheetDescription>
              แก้ไขข้อมูลลูกบ้าน {residentData?.email}
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
                          <FormLabel>
                            รหัสผ่าน{" "}
                            <span className="text-muted-foreground text-sm">
                              (เว้นว่างถ้าไม่ต้องการเปลี่ยน)
                            </span>
                          </FormLabel>
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
                              placeholder="รหัสผ่านใหม่"
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
                              placeholder="ยืนยันรหัสผ่านใหม่"
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
                            {roleSelectList.map((role) => (
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

export default EditResidentDialog;
