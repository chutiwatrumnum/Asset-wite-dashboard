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
      await externalLogin({
        username: data.username,
        password: data.password,
      });
      await navigate({ to: "/dashboard", replace: true });
    } catch (error: any) {
      console.log(error);
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
