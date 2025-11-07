import React, { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitContactForm } from "@/lib/cms";
import type { ContactFormType } from "@/types";
import { X } from "lucide-react";


const contactSchema = z.object({
    name: z
        .string()
        .min(2, {message: "El nombre debe tener al menos 2 caracteres."})
        .trim(),
    email: z
        .string()
        .min(1, {message: "El correo es obligatorio."})
        .email({message: "Ingresa un correo electrónico válido."})
        .trim(),
    phone: z
        .string()
        .min(1, {message: "El teléfono es obligatorio."})
        .refine(
            (val) => {
                // Permite +, espacios, guiones, paréntesis; valida 7-15 dígitos
                const digits = (val.match(/\d/g) || []).length;
                return digits >= 7 && digits <= 15;
            },
            {message: "Ingresa un número de teléfono válido."}
        )
        .trim(),
    message: z
        .string()
        .max(1000, {message: "El mensaje no puede superar 1000 caracteres."})
        .optional()
        .transform((v) => v ?? ""),
    contactPreference: z.enum(["phone", "email"]),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Extiende errores para incluir el checkbox de términos
type FieldErrors = Partial<Record<keyof ContactFormData | "terms", string>>;

export default function ContactForm() {
    // Estado del formulario actualizado con teléfono y preferencia de contacto
    const [form, setForm] = useState<ContactFormData>({
        name: "",
        email: "",
        phone: "",
        message: "",
        contactPreference: "phone", // phone | email
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [dialog, setDialog] = useState<{ title: string; message: string; variant: "success" | "error" }>({
        title: "",
        message: "",
        variant: "success",
    });

    const setField = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) => {
        setForm((prev) => ({...prev, [key]: value}));
        // Validación inmediata por campo
        validateField(key, value as string);
    };

    const validateField = (key: keyof ContactFormData, value: string) => {
        // Usa la definición del esquema por campo
        let result: { success: boolean; error?: string } = {success: true};

        try {
            switch (key) {
                case "name":
                    contactSchema.shape.name.parse(value);
                    break;
                case "email":
                    contactSchema.shape.email.parse(value);
                    break;
                case "phone":
                    contactSchema.shape.phone.parse(value);
                    break;
                case "message":
                    contactSchema.shape.message.parse(value);
                    break;
                case "contactPreference":
                    contactSchema.shape.contactPreference.parse(value);
                    break;
                default:
                    break;
            }
        } catch (e) {
            const err = e as z.ZodError;
            result = {success: false, error: err.issues?.[0]?.message ?? "Valor inválido"};
        }

        setErrors((prev) => ({...prev, [key]: result.success ? undefined : result.error}));
    };

    const validateAll = (): boolean => {
        const parsed = contactSchema.safeParse(form);
        const nextErrors: FieldErrors = {};
        if (!acceptedTerms) {
            nextErrors.terms = "Debes aceptar los términos y condiciones.";
        }

        if (parsed.success) {
            setErrors(nextErrors);
            return Object.keys(nextErrors).length === 0;
        }

        for (const issue of parsed.error.issues) {
            const path = issue.path[0] as keyof ContactFormData;
            if (!nextErrors[path]) nextErrors[path] = issue.message;
        }
        setErrors(nextErrors);
        return false;
    };

    const getResponseText = (data: unknown) => {
        if (data == null) return "Solicitud enviada.";
        if (typeof data === "string") return data;
        if (typeof data === "object") {
            // @ts-ignore
            if (typeof (data as any).message === "string") return (data as any).message;
            try {
                return JSON.stringify(data);
            } catch {
                return "Solicitud enviada.";
            }
        }
        return String(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const ok = validateAll();
        if (!ok) return;

        setSubmitting(true);
        try {
            const payload: ContactFormType = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                message: form.message,
                contactPreference: form.contactPreference,
            };

            const res = await submitContactForm(payload);
            const msg = getResponseText(res);

            setDialog({title: "Mensaje enviado", message: msg, variant: "success"});
            setOpen(true);

            // Limpia el formulario tras éxito
            setForm({name: "", email: "", phone: "", message: "", contactPreference: "phone"});
            setErrors({});
            setAcceptedTerms(false);
        } catch (error) {
            let msg = "Ocurrió un error al enviar el formulario.";
            const anyErr = error as any;
            if (anyErr?.response?.data) msg = getResponseText(anyErr.response.data);
            else if (anyErr?.message) msg = anyErr.message;

            setDialog({title: "Error", message: msg, variant: "error"});
            setOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    const msgLength = form.message?.length ?? 0;

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="space-y-4 max-w-2xl mx-auto"
                id="contact-form"
                noValidate
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={form.name}
                                placeholder="Tu nombre"
                                onChange={(e) => setField("name", e.target.value)}
                                className={cn("pr-12", errors.name && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? "name-error" : undefined}
                                disabled={submitting}
                            />
                            {form.name && (
                                <button
                                    type="button"
                                    onClick={() => setField("name", "")}
                                    aria-label="Limpiar nombre"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            )}
                        </div>
                        {errors.name && (
                            <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Correo electrónico</label>
                        <div className="relative">
                            <Input
                                type="email"
                                value={form.email}
                                placeholder="Tu correo"
                                onChange={(e) => setField("email", e.target.value)}
                                className={cn("pr-12", errors.email && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? "email-error" : undefined}
                                disabled={submitting}
                            />
                            {form.email && (
                                <button
                                    type="button"
                                    onClick={() => setField("email", "")}
                                    aria-label="Limpiar correo"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            )}
                        </div>
                        {errors.email && (
                            <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <div className="relative">
                            <Input
                                type="tel"
                                value={form.phone}
                                placeholder="Tu número de teléfono"
                                onChange={(e) => setField("phone", e.target.value)}
                                className={cn("pr-12", errors.phone && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                                aria-invalid={!!errors.phone}
                                aria-describedby={errors.phone ? "phone-error" : undefined}
                                disabled={submitting}
                            />
                            {form.phone && (
                                <button
                                    type="button"
                                    onClick={() => setField("phone", "")}
                                    aria-label="Limpiar teléfono"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            )}
                        </div>
                        {errors.phone && (
                            <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                    </div>
                </div>

                {/* Preferencia de contacto */}
                <fieldset className="space-y-2">
                    <legend className="block text-sm font-medium">¿Cómo prefieres que te contactemos?</legend>
                    <RadioGroup
                        value={form.contactPreference}
                        onValueChange={(value) => setField("contactPreference", value as "phone" | "email")}
                        className="flex items-center gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <RadioGroupItem id="pref-phone" value="phone" disabled={submitting}/>
                            <Label htmlFor="pref-phone" className="cursor-pointer">Teléfono/WhatsApp</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem id="pref-email" value="email" disabled={submitting}/>
                            <Label htmlFor="pref-email" className="cursor-pointer">Correo electrónico</Label>
                        </div>
                    </RadioGroup>
                </fieldset>

                <div>
                    <div className="flex items-end justify-between mb-1">
                        <label className="block text-sm font-medium">Mensaje</label>
                        <span
                            className={cn("text-xs", msgLength > 1000 ? "text-red-600" : "text-muted-foreground")}>{msgLength}/1000</span>
                    </div>
                    <div className="relative">
                        <Textarea
                            placeholder="Escribe tu mensaje aquí..."
                            rows={4}
                            value={form.message}
                            onChange={(e) => setField("message", e.target.value)}
                            maxLength={1000}
                            className={cn(errors.message && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                            aria-invalid={!!errors.message}
                            aria-describedby={errors.message ? "message-error" : undefined}
                            disabled={submitting}
                        />
                    </div>
                    {errors.message && (
                        <p id="message-error" className="mt-1 text-sm text-red-600">{errors.message}</p>
                    )}
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        className={cn("shrink-0", errors.terms ? "border-red-500 focus-visible:ring-red-500" : "text-white")}
                        onCheckedChange={(checked) => {
                            const val = !!checked;
                            setAcceptedTerms(val);
                            setErrors((prev) => ({
                                ...prev,
                                terms: val ? undefined : "Debes aceptar los términos y condiciones."
                            }));
                        }}
                        aria-invalid={!!errors.terms}
                        aria-describedby={errors.terms ? "terms-error" : undefined}
                        disabled={submitting}
                    />
                    <Label htmlFor="terms" className="ml-2">
                        Acepto los {" "}
                        <a href="/terms" className="text-primary underline">
                            términos y condiciones
                        </a>
                    </Label>
                </div>
                {errors.terms && (
                    <p id="terms-error" className="mt-1 text-sm text-red-600">{errors.terms}</p>
                )}

                <Button
                    type="submit"
                    disabled={submitting}
                    className="inline-block transition duration-200 ease-in-out text-center bg-primary text-white hover:bg-primary-dark"
                >
                    {submitting ? "Enviando..." : "Enviar"}
                </Button>
            </form>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialog.title}</DialogTitle>
                        <DialogDescription>
                            {dialog.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}