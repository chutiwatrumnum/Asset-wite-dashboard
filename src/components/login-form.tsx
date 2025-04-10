import React from "react";
import Pb from "@/api/pocketbase.tsx";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";

import { useNavigate, UseNavigateResult } from "@tanstack/react-router";
import { Loader2, MailOpen } from "lucide-react";

type AuthInputs = {
    email: string;
    password: string;
};

const onSubmit = async (navigate: UseNavigateResult<string>, data: AuthInputs) => {
    const { email, password } = data;
    await Pb.collection("admin").authWithPassword(email, password);

    if (Pb.authStore.isValid) {
        await navigate({ to: "/service" });
    }
};

export function LoginForm({ className }: React.ComponentProps<"form">) {
    const {
        control,
        handleSubmit,
        // watch,
        formState: {
            // errors,
            isSubmitting,
        },
    } = useForm<AuthInputs>();

    const navigate = useNavigate();

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit((data) => onSubmit(navigate, data))}>
            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Controller name="email" defaultValue={""} control={control} render={({ field }) => <Input {...field} type={"email"} placeholder={"login@email.com"} />} />
                </div>
                <div className="grid gap-3">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                            Forgot your password?
                        </a>
                    </div>
                    <Controller name="password" defaultValue={""} control={control} render={({ field }) => <Input {...field} type={"password"} />} />
                </div>
                <Button type="submit" className="w-full">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <MailOpen />} Login
                </Button>
            </div>
        </form>
    );
}
