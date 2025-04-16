"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { UserRoundPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// สร้าง schema สำหรับตรวจสอบฟอร์ม
const formSchema = z.object({
  name: z.string().min(2, {
    message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร",
  }),
  email: z.string().email({
    message: "กรุณาใส่อีเมลที่ถูกต้อง",
  }),
  phone: z.string().min(9, {
    message: "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัวเลข",
  }),
  position: z.string({
    required_error: "กรุณาเลือกตำแหน่ง",
  }),
});

interface CreateSaffDialogProps {
  onSaffCreated: () => void;
}

export function CreateSaffDialog({ onSaffCreated }: CreateSaffDialogProps) {
  const [open, setOpen] = useState(false);

  // กำหนดค่า form ด้วย useForm และใช้ zodResolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      position: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // ส่วนนี้คุณจะต้องเพิ่ม API call เพื่อสร้างข้อมูล Saff ใหม่
      // ตัวอย่าง: await createSaff(values);

      console.log(values);
      toast.success("เพิ่มข้อมูลพนักงานสำเร็จ", {
        description: `เพิ่ม ${values.name} เข้าสู่ระบบเรียบร้อยแล้ว`,
      });
      form.reset();
      setOpen(false);
      onSaffCreated();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
      });
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <UserRoundPlus className="h-4 w-4" />
                เพิ่มพนักงาน
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>เพิ่มข้อมูลพนักงานใหม่</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>เพิ่มข้อมูลพนักงานใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลพนักงานที่ต้องการเพิ่มในระบบ
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ-นามสกุล</FormLabel>
                      <FormControl>
                        <Input placeholder="ชื่อ-นามสกุล" {...field} />
                      </FormControl>
                      <FormDescription>
                        ชื่อและนามสกุลของพนักงาน
                      </FormDescription>
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
                        <Input placeholder="อีเมล" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input placeholder="เบอร์โทรศัพท์" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ตำแหน่ง</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกตำแหน่ง" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manager">ผู้จัดการ</SelectItem>
                          <SelectItem value="staff">พนักงานทั่วไป</SelectItem>
                          <SelectItem value="receptionist">
                            พนักงานต้อนรับ
                          </SelectItem>
                          <SelectItem value="housekeeper">แม่บ้าน</SelectItem>
                          <SelectItem value="maintenance">
                            ช่างซ่อมบำรุง
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>ตำแหน่งงานของพนักงาน</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </DialogFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}