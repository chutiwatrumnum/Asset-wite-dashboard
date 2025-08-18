// src/components/login-form.tsx - เพิ่ม import Pb
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Globe } from "lucide-react";
import { useExternalLoginMutation } from "@/react-query/login/external-login";
import { MessageDialog } from "./modal";
import Pb from "@/api/pocketbase"; // ✅ เพิ่ม import นี้

type AuthInputs = {
  username: string;
  password: string;
};

export function LoginForm({ className }: React.ComponentProps<"form">) {
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const { control, handleSubmit, formState } = useForm<AuthInputs>();
  const navigate = useNavigate();
  const { mutateAsync: externalLogin } = useExternalLoginMutation();

  const onSubmit = async (data: AuthInputs) => {
    setIsFormDisabled(true);
    try {
      console.log("🔐 Starting login process...");

      await externalLogin({
        username: data.username,
        password: data.password,
      });

      console.log("✅ External login mutation completed");

      // ✅ รอให้ระบบตั้งค่าเสร็จก่อน redirect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // ✅ ตรวจสอบสถานะการล็อกอินก่อน redirect
      const isLoggedIn = Pb.isLoggedIn();
      const currentUser = Pb.getCurrentUser();

      console.log("Login status check:", {
        isLoggedIn,
        hasUser: !!currentUser,
        userId: currentUser?.id,
        userRole: currentUser?.role,
      });

      if (isLoggedIn && currentUser) {
        console.log("✅ Login verification successful, redirecting...");
        await navigate({ to: "/dashboard", replace: true });
      } else {
        console.warn("⚠️ Login verification failed");

        // ✅ รอเพิ่มอีกนิดแล้วลองอีกครั้ง
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const finalCheck = Pb.isLoggedIn();
        const finalUser = Pb.getCurrentUser();

        console.log("Final login check:", {
          isLoggedIn: finalCheck,
          hasUser: !!finalUser,
        });

        if (finalCheck && finalUser) {
          console.log("✅ Final check successful, redirecting...");
          await navigate({ to: "/dashboard", replace: true });
        } else {
          throw new Error("Login verification failed after retry");
        }
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      setErrorMessage({
        title: "Login Failed",
        description: error?.message || "Invalid username or password",
      });
    } finally {
      setIsFormDisabled(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="username">Username</Label>
          <Controller
            name="username"
            defaultValue=""
            control={control}
            render={({ field }) => (
              <Input
                disabled={isFormDisabled}
                {...field}
                type="text"
                placeholder="your-username"
                id="username"
              />
            )}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Controller
            name="password"
            defaultValue=""
            control={control}
            render={({ field }) => (
              <Input
                disabled={isFormDisabled}
                {...field}
                type="password"
                id="password"
              />
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isFormDisabled}>
          {formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          Connect to System
        </Button>
      </div>
      <MessageDialog Message={errorMessage} />
    </form>
  );
}
