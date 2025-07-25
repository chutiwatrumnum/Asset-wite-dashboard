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
import { useCreateSaffMutation } from "@/react-query/manage/auth";
import type { HouseItem } from "@/api/house/house";
import type { newSaffRequest } from "@/api/auth/auth";

type roleSelectList = {
  value: string;
  label: string;
};

const roleSelectList: roleSelectList[] = [
  {
    value: "master",
    label: "master",
  },
  {
    value: "staff",
    label: "staff",
  },
  {
    value: "guardsman",
    label: "guardsman",
  },
];

// สร้าง schema สำหรับตรวจสอบฟอร์ม
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
    house_id: z.string().min(1, { message: "House ID is required" }),
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

interface CreateSaffDrawerProps {
  onSaffCreated: () => void;
}

export function CreateSaffDrawer({ onSaffCreated }: CreateSaffDrawerProps) {
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

  const { mutateAsync: createSaff } = useCreateSaffMutation();

  // กำหนดค่า form ด้วย useForm และใช้ zodResolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      role: "",
      house_id: "",
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

  // Function to generate a secure password that meets Pocketbase requirements
  function generateSecurePassword() {
    // Define character sets
    const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijkmnopqrstuvwxyz";
    const numberChars = "23456789";
    const specialChars = "!@#$%^&*_-+=";

    // Generate a password with at least 12 characters
    const length = 12;
    let password = "";

    // Ensure at least one character from each required set
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

    // Fill the rest with random characters from all sets
    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to make it more random
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    // Set both password fields
    form.setValue("password", password);
    form.setValue("passwordConfirm", password);

    // Trigger validation
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
      await createSaff(values as newSaffRequest);

      toast.success("เพิ่มพนักงานสำเร็จแล้ว", {
        description: "ข้อมูลพนักงานใหม่ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว",
        duration: 4000,
      });

      form.reset();
      setOpen(false);
      onSaffCreated();
    } catch (error) {
      console.error("Create staff failed:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to handle image upload with improved error handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImageError(null);
      const files = e.target.files;

      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError("ขนาดไฟล์ต้องไม่เกิน 5MB");
        return;
      }

      form.setValue("avatar", file);

      // Create a URL for the image preview
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

  // Function to remove the image
  const removeImage = () => {
    setImagePreview(null);
    setImageError(null);
    form.setValue("avatar", undefined);

    // Reset the file input
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
                  เพิ่มพนักงาน
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>เพิ่มข้อมูลพนักงานใหม่</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>เพิ่มข้อมูลพนักงานใหม่</SheetTitle>
            <SheetDescription>
              กรอกข้อมูลพนักงานที่ต้องการเพิ่มในระบบ
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
                          image{" "}
                          <span className="text-muted-foreground text-sm">
                            optional
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
                              uploadImage
                            </Button>
                            {imagePreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeImage}
                                disabled={isLoading}>
                                <X className="h-4 w-4 mr-1" />
                                removeImage
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
                          first name{" "}
                          <span className="text-muted-foreground text-sm">
                            optional
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
                          last name{" "}
                          <span className="text-muted-foreground text-sm">
                            optional
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
                          <FormLabel>Password</FormLabel>
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
                                  generatePassword
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
                              placeholder="password"
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
                                      ? "hide password"
                                      : "show password"}
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
                        <FormLabel>confirm_password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="confirm_password"
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
                                      ? "hide password"
                                      : "show password"}
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
                        <FormLabel>role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="please select role" />
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
                        <FormDescription>ตำแหน่งงานของพนักงาน</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="house_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>บ้าน</FormLabel>
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
                          บ้านที่พนักงานดูแลอยู่
                        </FormDescription>
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

export default CreateSaffDrawer;