"use client";

import type React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, X, Eye, EyeOff, Wand2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHouseListQuery } from "@/react-query/manage/house";
import type { HouseItem } from "@/api/house/house";
import type { saffItem, newSaffRequest } from "@/api/auth/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEditSaffMutation } from "@/react-query/manage/auth";
import Pb from "@/api/pocketbase";

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
                message: "Password must contain uppercase, lowercase and numbers if provided",
            }),
        passwordConfirm: z.string().optional(),
        role: z.string().min(1, { message: "Role is required" }),
        house_id: z.string().min(1, { message: "House ID is required" }),
        first_name: z.string().max(500, { message: "First name must be less than 500 characters" }).optional(),
        last_name: z.string().max(500, { message: "Last name must be less than 500 characters" }).optional(),
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

interface EditStaffDrawerProps {
    staffData: saffItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStaffUpdated: () => void;
}

export function EditStaffDrawer({ staffData, open, onOpenChange, onStaffUpdated }: EditStaffDrawerProps) {
    const { data: houseList } = useHouseListQuery({});
    // const [showPassword, setShowPassword] = useState(false);
    // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const { mutateAsync: updateStaff } = useEditSaffMutation();

    const form = useForm<z.infer<typeof editFormSchema>>({
        resolver: zodResolver(editFormSchema),
        defaultValues: {
            email: "",
            role: "",
            house_id: "",
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

        // setShowPassword(false);
        // setShowConfirmPassword(false);
        setImagePreview(null);
        setImageError(null);
        setIsLoading(false);
        setConfirmOpen(false);
        setIsDirty(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        form.reset({
            email: "",
            role: "",
            house_id: "",
            first_name: "",
            last_name: "",
            avatar: undefined,
        });
    }, [form]);

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            // Reset immediately when drawer closes
            resetAllStates();
        }
    }, [open, resetAllStates]);
    async function imageUrlToFile(url: string): Promise<string> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${url}`);
        }

        const blob = await response.blob();

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result); // includes data:image/...;base64,...
                } else {
                    reject("Failed to convert image to base64 string.");
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    // Populate form when staffData changes and drawer opens
    useEffect(() => {
        const fetchData = async () => {
            if (staffData && open) {
                staffData.collectionName = "admin";
                const formData = {
                    email: staffData.email || "",
                    role: staffData.role || "",
                    house_id: staffData.house_id || "",
                    first_name: staffData.first_name || "",
                    last_name: staffData.last_name || "",
                };
                const imageUrl = Pb.files.getURL(staffData, staffData.avatar);
                const file = await imageUrlToFile(imageUrl);
                form.reset(formData);

                if (staffData.avatar) {
                    setImagePreview(file);
                }
                setIsDirty(false);
            }
        };
        fetchData();
    }, [staffData, open, form]);

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

        password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
        password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
        password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
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
            // Close immediately if no changes
            resetAllStates();
            onOpenChange(false);
        }
    };

    const handleConfirmClose = () => {
        // Reset everything and close
        setConfirmOpen(false);
        resetAllStates();
        onOpenChange(false);
    };

    const handleCancelClose = () => {
        // Just close the confirmation dialog
        setConfirmOpen(false);
    };

    async function onSubmit(values: z.infer<typeof editFormSchema>) {
        // if (!staffData || isLoading || !isMountedRef.current) return;

        // const isDataChanged =
        //   values.email !== staffData.email ||
        //   values.role !== staffData.role ||
        //   values.house_id !== staffData.house_id ||
        //   values.first_name !== staffData.first_name ||
        //   values.last_name !== staffData.last_name ||
        //   values.password !== "" ||
        //   values.avatar !== undefined;

        // if (!isDataChanged) {
        //   toast.warning("ไม่มีการเปลี่ยนแปลงข้อมูล");
        //   return;
        // }

        setIsLoading(true);
        try {
            // const updateData: newSaffRequest = {
            //   email: values.email,
            //   role: values.role,
            //   house_id: values.house_id,
            //   first_name: values.first_name ,
            //   last_name: values.last_name,
            //   password: values.password!,
            //   passwordConfirm: values.passwordConfirm!
            // };

            // if (values.password) {
            //   updateData.password = values.password;
            //   updateData.passwordConfirm = values.passwordConfirm || "";
            // }

            // if (values.avatar) {
            //   updateData.avatar = values.avatar;
            // }
            const reqData = values as newSaffRequest;
            reqData.id = staffData?.id;
            await updateStaff(reqData);

            // Check if component is still mounted before updating state
            if (isMountedRef.current) {
                toast.success("อัปเดตข้อมูลสำเร็จ");
                resetAllStates();
                onStaffUpdated();
            }
        } catch (error: any) {
            console.error("Update staff failed:", error);
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
        setImagePreview(staffData?.avatar || null);
        setImageError(null);
        form.setValue("avatar", undefined);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <Sheet
                open={open}
                onOpenChange={(open) => {
                    if (isMountedRef.current) {
                        setConfirmOpen(open);
                    }
                }}
            >
                <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>แก้ไขข้อมูลพนักงาน</SheetTitle>
                        <SheetDescription>แก้ไขข้อมูลพนักงาน {staffData?.email}</SheetDescription>
                    </SheetHeader>

                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="avatar"
                                        render={() => (
                                            <FormItem className="flex flex-col items-center">
                                                <FormLabel className="self-start">
                                                    image <span className="text-muted-foreground text-sm">optional</span>
                                                </FormLabel>
                                                <div className="flex flex-col items-center gap-3 w-full">
                                                    <Avatar className="h-24 w-24">{imagePreview ? <AvatarImage src={imagePreview || "/placeholder.svg"} alt="Profile preview" /> : <AvatarFallback>{form.watch("first_name")?.charAt(0) || form.watch("email")?.charAt(0) || "?"}</AvatarFallback>}</Avatar>
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                                            <Upload className="h-4 w-4 mr-1" />
                                                            uploadImage
                                                        </Button>
                                                        {imagePreview && (
                                                            <Button type="button" variant="outline" size="sm" onClick={removeImage} disabled={isLoading}>
                                                                <X className="h-4 w-4 mr-1" />
                                                                removeImage
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
                                                    {imageError && <p className="text-sm text-destructive mt-1">{imageError}</p>}
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
                                                    first name <span className="text-muted-foreground text-sm">optional</span>
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
                                                    last name <span className="text-muted-foreground text-sm">optional</span>
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
                                                    <Input placeholder="อีเมล" type="email" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>
                            Password{" "}
                            <span className="text-muted-foreground text-sm">
                              (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
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
                          </Button>
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
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}

                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>role</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="please select role" />
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
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
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
                                                <FormDescription>บ้านที่พนักงานดูแลอยู่</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <SheetFooter className="pt-4">
                                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
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

            {/* Confirmation Dialog - Only render when needed */}
            {confirmOpen && (
                <AlertDialog
                    open={confirmOpen}
                    onOpenChange={(open) => {
                        if (isMountedRef.current) {
                            setConfirmOpen(open);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                            <AlertDialogDescription>คุณกำลังจะปิดแบบฟอร์มนี้ ข้อมูลที่คุณทำการเปลี่ยนแปลงอาจไม่ถูกบันทึก</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCancelClose}>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmClose}>ยืนยัน</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}

export default EditStaffDrawer;
