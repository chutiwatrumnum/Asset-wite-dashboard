import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";

import { useNavigate } from "@tanstack/react-router";
import { Loader2, MailOpen } from "lucide-react";
import { useLoginMutation } from "@/react-query/login/login";
import { MessageDialog } from "./modal";

type AuthInputs = {
    email: string;
    password: string;
};

export function LoginForm({ className }: React.ComponentProps<"form">) {
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [ErrorMessageLoginFaild, setErrorMessageLoginFaild] = useState<{
        title: string;
        description: string;
    }>({
        title: "",
        description: "",
    });
    const { control, handleSubmit, formState } = useForm<AuthInputs>();
    const navigate = useNavigate();
    const loginMutation = useLoginMutation();

    const onSubmit = async (data: AuthInputs) => {
        setIsFormDisabled(true);

        try {
            await loginMutation.mutateAsync({
                identity: data.email,
                password: data.password,
            });
            await navigate({ to: "/", replace: true });
        } catch (error) {
            console.log(error);
            setErrorMessageLoginFaild({
                title: "Login Failed",
                description: "Invalid email or password",
            });
        } finally {
            setIsFormDisabled(false);
        }
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Controller name="email" defaultValue="" control={control} render={({ field }) => <Input disabled={isFormDisabled} {...field} type="email" placeholder="login@email.com" />} />
                </div>
                <div className="grid gap-3">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                            Forgot your password?
                        </a>
                    </div>
                    <Controller name="password" defaultValue="" control={control} render={({ field }) => <Input disabled={isFormDisabled} {...field} type="password" />} />
                </div>
                <Button type="submit" className="w-full">
                    {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <MailOpen />} Login
                </Button>
            </div>
            <MessageDialog Message={ErrorMessageLoginFaild} />
        </form>
    );
}
