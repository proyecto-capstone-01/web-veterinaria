import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useMemo, useState, useEffect } from "react"; // removed useRef
import { z } from "zod";
import { cn } from "@/lib/utils";
import { X, Info, ChevronDown, ChevronUp } from "lucide-react";
import { submitAppointmentForm, fetchServices, fetchWeekAvailability } from "@/lib/cms"; // updated import
import { loadTurnstile } from "@/lib/turnstile"; // added
// @ts-ignore
import { PUBLIC_TURNSTILE_KEY } from "astro:env/client"
// Add dialog imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";


// Tipos de datos locales
type ServiceItem = {
    id: number | string;
    title: string; // from CMS
    description?: string | null;
    price: number;
    icon?: string | null;
    availability?: boolean; // not provided, keep for compatibility
};

interface AvailabilityHour { hour: string; availability: boolean; }

// Esquema de validación con Zod
const schema = z.object({
    petType: z.enum(["dog", "cat"], {message: "Selecciona un tipo de mascota."}),
    petSex: z.enum(["male", "female"], {message: "Selecciona el sexo de tu mascota."}),
    petName: z.string().min(1, {message: "Ingresa el nombre de tu mascota."}).trim(),
    servicios: z.array(z.string()).min(1, {message: "Selecciona al menos un servicio."}),
    comentario: z.string().max(1000, {message: "Máximo 1000 caracteres."}).optional().transform(v => v ?? ""),
    slot: z.string().min(1, {message: "Selecciona un horario."}),
    rut: z.string().regex(/^\d{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$/, {message: "RUT inválido (formato 12.345.678-9)."}),
    firstName: z.string().min(2, {message: "Nombre debe tener al menos 2 caracteres."}).trim(),
    lastName: z.string().min(2, {message: "Apellido debe tener al menos 2 caracteres."}).trim(),
    phone: z.string().refine(v => (v.match(/\d/g) || []).length >= 7 && (v.match(/\d/g) || []).length <= 15, {message: "Ingresa un teléfono válido."}).trim(),
    email: z.string().email({message: "Correo electrónico inválido."}).trim(),
    weight: z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().positive('Peso inválido').max(100, 'Peso máximo 100 kg').optional()),
    age: z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().int('Edad debe ser un número entero').min(0, 'Edad inválida').max(40, 'Edad máxima 40').optional()),
    captchaToken: z.string().min(1, {message: "Resuelve el captcha."}), // added
});

type FormData = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormData, string>>;

// Helper to get current Date in America/Santiago timezone
function getNowInSantiago(): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value || "0");
    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function parseAvailabilityDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function parseAvailabilitySlotToDateTime(dateStr: string, timeStr: string): Date {
    const base = parseAvailabilityDate(dateStr);
    const [hh, mm] = timeStr.split(":").map(Number);
    base.setHours(hh || 0, mm || 0, 0, 0);
    return base;
}

function formatAvailabilityDayLabel(dateStr: string): string {
    const date = parseAvailabilityDate(dateStr);
    const formatter = new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const weekday = parts.find(p => p.type === "weekday")?.value || "";
    const day = parts.find(p => p.type === "day")?.value || "";
    const month = parts.find(p => p.type === "month")?.value || "";
    const weekdayTitle = weekday
        ? weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase()
        : "";
    return `${weekdayTitle} ${day}-${month}`;
}

export default function AppointmentForm() {
    // dynamic data state
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [availability, setAvailability] = useState<Record<string, AvailabilityHour>>({});
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

    // Estado del formulario controlado
    const [form, setForm] = useState<FormData>({
        petType: "dog",
        petSex: "male",
        petName: "",
        servicios: [],
        comentario: "",
        slot: "",
        rut: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        weight: undefined,
        age: undefined,
        captchaToken: "",
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // dynamic fetch effect
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingData(true);
                const [svcRes, availRes] = await Promise.all([
                    fetchServices(),
                    fetchWeekAvailability(),
                ]);
                if (!mounted) return;
                const svcDocs: any[] = svcRes?.docs || [];
                setServices(svcDocs.map(d => ({
                    id: d.id,
                    title: d.title,
                    description: d.description,
                    price: d.price,
                    icon: d.icon,
                })));
                setAvailability(availRes || {});
                setDataError(null);
            } catch (e: any) {
                if (!mounted) return;
                setDataError(e?.message || 'Error cargando datos.');
            } finally {
                if (mounted) setLoadingData(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // compute totalPrice from selected services
    const totalPrice = useMemo(() => {
        return form.servicios.reduce((sum, id) => {
            const s = services.find(sv => String(sv.id) === String(id));
            return sum + (s?.price || 0);
        }, 0);
    }, [form.servicios, services]);

    const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setForm(prev => ({...prev, [key]: value}));
        // Validación por campo
        validateField(key, value as any);
    };

    const validateField = (key: keyof FormData, value: any) => {
        try {
            switch (key) {
                case "petType":
                    schema.shape.petType.parse(value);
                    break;
                case "petSex":
                    schema.shape.petSex.parse(value);
                    break;
                case "petName":
                    schema.shape.petName.parse(value);
                    break;
                case "servicios":
                    schema.shape.servicios.parse(value);
                    break;
                case "comentario":
                    schema.shape.comentario.parse(value);
                    break;
                case "slot":
                    schema.shape.slot.parse(value);
                    break;
                case "rut":
                    schema.shape.rut.parse(value);
                    break;
                case "firstName":
                    schema.shape.firstName.parse(value);
                    break;
                case "lastName":
                    schema.shape.lastName.parse(value);
                    break;
                case "phone":
                    schema.shape.phone.parse(value);
                    break;
                case "email":
                    schema.shape.email.parse(value);
                    break;
                case "weight":
                    schema.shape.weight.parse(value as any);
                    break;
                case "age":
                    schema.shape.age.parse(value as any);
                    break;
                case "captchaToken":
                    schema.shape.captchaToken.parse(value);
                    break;
                default:
                    break;
            }
            setErrors(prev => ({...prev, [key]: undefined}));
        } catch (e) {
            const err = e as z.ZodError;
            setErrors(prev => ({...prev, [key]: err.issues?.[0]?.message || "Valor inválido"}));
        }
    };

    const validateAll = (): boolean => {
        const parsed = schema.safeParse(form);
        const next: FieldErrors = {};
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const k = issue.path[0] as keyof FormData;
                if (!next[k]) next[k] = issue.message;
            }
        }
        // remove static unavailable check (CMS does not provide availability per service currently)
        // dynamic slot availability validation
        if (form.slot) {
            const [date, time] = form.slot.split('::');
            const dayArr = availability[date];
            const ok = !!dayArr?.find(h => h.hour === time && h.availability);
            if (!ok) next.slot = 'El horario seleccionado no está disponible.';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate all fields. Do not open dialog if invalid
        const ok = validateAll();
        if (!ok) {
            setIsDialogOpen(false);
            return;
        }
        // Clear previous submission status and open dialog for confirmation
        setSubmitMessage(null);
        setSubmitError(null);
        setIsDialogOpen(true);
    };

    // Confirm submit action executed from Dialog
    const confirmSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitMessage(null);
        setSubmitError(null);
        try {
            const [date, time] = form.slot.split('::');
            const payload = {
                petType: form.petType,
                petSex: form.petSex,
                petName: form.petName,
                services: [...form.servicios.map(id => Number(id))],
                comment: form.comentario,
                date,
                time,
                rut: form.rut,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email,
                weight: form.weight,
                age: form.age,
                captchaToken: form.captchaToken,
            };
            const res = await submitAppointmentForm(payload);
            const msg = getResponseText(res);
            setSubmitMessage(msg || 'Solicitud enviada.');
            setSubmitError(null);
            // Reset form
            setForm({
                petType: 'dog',
                petSex: 'male',
                petName: '',
                servicios: [],
                comentario: '',
                slot: '',
                rut: '',
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                weight: undefined,
                age: undefined,
                captchaToken: '',
            });
            if (typeof window !== 'undefined' && (window as any).turnstile) {
                try { (window as any).turnstile.reset(); } catch {}
            }
        } catch (error: any) {
            const msg = error?.response?.data ? getResponseText(error.response.data) : (error?.message || 'Error al confirmar la cita.');
            setSubmitError(msg);
            setSubmitMessage(null);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleService = (id: string) => {
        const exists = form.servicios.includes(id);
        setField('servicios', exists ? form.servicios.filter(s => s !== id) : [...form.servicios, id] as any);
    };

    const toggleDayExpanded = (fecha: string) => {
        setExpandedDays(prev => ({
            ...prev,
            [fecha]: !prev[fecha],
        }));
    };

    // derive list of availability days into structure similar to previous HOURS for UI
    const availabilityDays = useMemo(() => {
        const now = getNowInSantiago();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        const entries = Object.entries(availability)
            .map(([date, arr]) => {
                const dayDate = parseAvailabilityDate(date);

                // Skip whole day if strictly before today in Santiago
                if (dayDate < todayMidnight) {
                    return null;
                }

                const isToday = dayDate.getFullYear() === now.getFullYear() &&
                    dayDate.getMonth() === now.getMonth() &&
                    dayDate.getDate() === now.getDate();

                const filteredHours = (arr || []).filter(h => {
                    if (!isToday) return true; // future days keep all hours
                    const slotDate = parseAvailabilitySlotToDateTime(date, h.hour);
                    return slotDate >= now; // only keep current/future times today
                });

                if (!filteredHours.length) return null; // no hours left for this day

                return {
                    fecha: date,
                    label: formatAvailabilityDayLabel(date),
                    slots: filteredHours.map(h => ({ time: h.hour, disponible: h.availability })),
                };
            })
            .filter((v): v is { fecha: string; label: string; slots: { time: string; disponible: boolean }[] } => v !== null);

        return entries.sort((a, b) => a.fecha.localeCompare(b.fecha));
    }, [availability]);

    // add back Turnstile setup effect
    useEffect(() => {
        let mounted = true;
        if (typeof window === 'undefined') return;
        loadTurnstile().then(() => {
            if (!mounted) return;
            if ((window as any).turnstile) {
                (window as any).turnstile.render('#turnstile-widget', {
                    sitekey: PUBLIC_TURNSTILE_KEY,
                    callback: (token: string) => {
                        setField('captchaToken', token as any);
                        setErrors(prev => ({...prev, captchaToken: undefined}));
                    },
                    'error-callback': () => {
                        setField('captchaToken', '' as any);
                        setErrors(prev => ({...prev, captchaToken: 'Error al cargar el captcha.'}));
                    },
                    'expired-callback': () => {
                        setField('captchaToken', '' as any);
                        setErrors(prev => ({...prev, captchaToken: 'Captcha expirado. Vuelve a intentarlo.'}));
                    },
                    theme: 'light',
                    retry: 'auto',
                    size: 'flexible',
                });
            }
        }).catch(() => {
            setErrors(prev => ({...prev, captchaToken: 'No se pudo cargar el captcha.'}));
        });
        return () => { mounted = false; };
    }, []);

    return (
        <form onSubmit={onSubmit} className="space-y-8 p-6 sm:p-8 lg:p-10">
            {/* Mascota */}
            <section>
                <h2 className="text-xl font-semibold mb-2">Tu mascota</h2>
                <p className="text-md mb-3 text-gray-500">Ingresa los datos de tu mascota:</p>

                <fieldset>
                    <legend className="sr-only">Tipo de mascota</legend>
                    <div className="relative"> {/* removed ref */}
                        <Label className="block text-sm font-medium mb-2">Especie <span className="text-red-600" aria-hidden>*</span></Label>
                        <RadioGroup
                            value={form.petType}
                            onValueChange={(value) => { setField('petType', value as any); }}
                            className="grid grid-cols-2 gap-3 mb-3"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem id="petType-dog" value="dog" />
                                <Label htmlFor="petType-dog" className="ml-2 cursor-pointer select-none border-2 rounded-md px-3 py-2 text-center w-full border-primary hover:scale-[1.01] transition">Perro 🐶</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem id="petType-cat" value="cat" />
                                <Label htmlFor="petType-cat" className="ml-2 cursor-pointer select-none border-2 rounded-md px-3 py-2 text-center w-full border-primary hover:scale-[1.01] transition">Gato 🐱</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {errors.petType && <p className="mt-1 text-sm text-red-600">{errors.petType}</p>}
                </fieldset>

                <div>
                    <Label htmlFor="petName" className="block text-sm font-medium mb-1">Nombre de tu mascota <span className="text-red-600" aria-hidden>*</span></Label>
                    <div className="relative">
                        <Input
                            id="petName"
                            placeholder="Ingresa el nombre de tu mascota aquí"
                            value={form.petName}
                            onChange={(e) => setField("petName", e.target.value)}
                            className={cn("w-full pr-12", errors.petName && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                            aria-invalid={!!errors.petName}
                            aria-describedby={errors.petName ? "petName-error" : undefined}
                        />
                        {form.petName && (
                            <button type="button" onClick={() => setField("petName", "")}
                                    aria-label="Limpiar nombre mascota"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    disabled={submitting}
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        )}
                    </div>
                    {errors.petName && <p id="petName-error" className="mt-1 text-sm text-red-600">{errors.petName}</p>}
                </div>

                {/* Sexo de la mascota */}
                <div className="mt-4">
                    <Label className="block text-sm font-medium mb-2">Sexo <span className="text-red-600" aria-hidden>*</span></Label>
                    <RadioGroup value={form.petSex} onValueChange={(value) => setField('petSex', value as any)} className="grid grid-cols-2 gap-3">
                        <div className="flex items-center">
                            <RadioGroupItem id="petSex-male" value="male" />
                            <Label htmlFor="petSex-male" className="ml-2 cursor-pointer select-none border-2 rounded-md px-3 py-2 text-center w-full border-primary hover:scale-[1.01] transition">Macho</Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem id="petSex-female" value="female" />
                            <Label htmlFor="petSex-female" className="ml-2 cursor-pointer select-none border-2 rounded-md px-3 py-2 text-center w-full border-primary hover:scale-[1.01] transition">Hembra</Label>
                        </div>
                    </RadioGroup>
                    {errors.petSex && <p className="mt-1 text-sm text-red-600">{errors.petSex}</p>}
                </div>

                {/* Peso y edad (opcionales) */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="weight" className="block text-sm font-medium mb-1">Peso (kg)</Label>
                        <Input id="weight" type="number" inputMode="decimal" placeholder="Opcional" max={100} min={0.1} step="0.1" value={form.weight ?? ''}
                               onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                               onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t.trim().startsWith('-')) e.preventDefault(); }}
                               onChange={(e) => {
                                   const val = e.target.value;
                                   if (val === '') { setField('weight', undefined as any); return; }
                                   const n = Number(val);
                                   if (Number.isNaN(n) || n < 0) return; // block negatives
                                   setField('weight', n as any);
                               }}
                               className={cn(errors.weight && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")} aria-invalid={!!errors.weight} aria-describedby={errors.weight ? 'weight-error' : undefined} />
                        {errors.weight && <p id="weight-error" className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                    </div>
                    <div>
                        <Label htmlFor="age" className="block text-sm font-medium mb-1">Edad (años)</Label>
                        <Input id="age" type="number" inputMode="numeric" placeholder="Opcional" max={40} min={0} step="1" value={form.age ?? ''}
                               onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                               onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t.trim().startsWith('-')) e.preventDefault(); }}
                               onChange={(e) => {
                                   const val = e.target.value;
                                   if (val === '') { setField('age', undefined as any); return; }
                                   const n = Number(val);
                                   if (Number.isNaN(n) || n < 0) return; // block negatives
                                   setField('age', n as any);
                               }}
                               className={cn(errors.age && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")} aria-invalid={!!errors.age} aria-describedby={errors.age ? 'age-error' : undefined} />
                        {errors.age && <p id="age-error" className="mt-1 text-sm text-red-600">{errors.age}</p>}
                    </div>
                </div>
            </section>

            {/* Servicios */}
            <section>
                <h2 className="text-xl font-semibold my-2">Servicio <span className="text-red-600" aria-hidden>*</span></h2>
                {loadingData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                )}
                {dataError && <p className="text-sm text-red-600">{dataError}</p>}
                {!loadingData && !dataError && (
                    <>
                        {services.length === 0 && <p className="text-sm">No hay servicios disponibles.</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((servicio) => {
                                const idStr = String(servicio.id);
                                const checked = form.servicios.includes(idStr);
                                return (
                                    <div key={idStr}
                                         className={cn("relative border-2 rounded-lg px-4 py-2 transition", checked ? "bg-primary-dark text-white border-primary-dark" : "border-primary")}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id={`svc-${idStr}`}
                                                checked={checked}
                                                onCheckedChange={() => toggleService(idStr)}
                                                className={cn("mt-1", errors.servicios && !form.servicios.length ? "border-red-500 focus-visible:ring-red-500" : undefined)}
                                                aria-describedby={errors.servicios ? "servicios-error" : undefined}
                                            />
                                            <div className="flex-1">
                                                <Label htmlFor={`svc-${idStr}`} className={cn("cursor-pointer flex items-center gap-2 font-semibold")}>{servicio.title}
                                                    {servicio.description && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span tabIndex={0} className="inline-flex items-center"><Info className="h-4 w-4"/></span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs text-white">{servicio.description}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </Label>
                                                <div className="text-sm mt-0.5">${servicio.price.toLocaleString("es-CL")}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {errors.servicios && <p id="servicios-error" className="mt-1 text-sm text-red-600">{errors.servicios}</p>}
                        <div className="mt-4">
                            <blockquote className="border-l-4 border-primary pl-4 italic text-primary-dark">Precio total estimado: $<span id="totalPriceEstimate">{totalPrice.toLocaleString("es-CL")}</span></blockquote>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-end justify-between mb-1">
                                <Label htmlFor="comentario" className="block text-sm font-medium mb-1">Comentarios adicionales</Label>
                                <span className={cn("text-xs", (form.comentario?.length ?? 0) > 1000 ? "text-red-600" : "text-muted-foreground")}>{form.comentario?.length ?? 0}/1000</span>
                            </div>
                            <Textarea id="comentario" placeholder="¿Tienes comentarios adicionales? Escríbelos aquí." className={cn("w-full resize-none overflow-hidden", errors.comentario && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")} rows={5} value={form.comentario} onChange={(e) => setField("comentario", e.target.value)} maxLength={1000} aria-invalid={!!errors.comentario} aria-describedby={errors.comentario ? "comentario-error" : undefined} />
                            {errors.comentario && <p id="comentario-error" className="mt-1 text-sm text-red-600">{errors.comentario}</p>}
                        </div>
                    </>
                )}
            </section>

            {/* Horarios dinámicos */}
            <section>
                <h2 className="text-xl font-semibold my-2">Elige un horario para la consulta <span className="text-red-600" aria-hidden>*</span></h2>
                {loadingData && (
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-64" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                        <Skeleton className="h-6 w-64" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                    </div>
                )}
                {!loadingData && availabilityDays.length === 0 && <p className="text-sm">No hay disponibilidad esta semana.</p>}
                {!loadingData && availabilityDays.length > 0 && (
                    <fieldset className="space-y-4" aria-describedby={errors.slot ? "slot-error" : undefined}>
                        <legend className="sr-only">Horario</legend>
                        {availabilityDays.map((dia) => {
                            const isExpanded = !!expandedDays[dia.fecha];
                            const maxRowsCollapsed = 3;
                            const maxVisibleSlots = maxRowsCollapsed * 4; // assuming up to 4 per row on md
                            const hasMore = dia.slots.length > maxVisibleSlots;
                            const visibleSlots = isExpanded ? dia.slots : dia.slots.slice(0, maxVisibleSlots);

                            return (
                                <div key={dia.fecha} className="border-1 border-primary/40 p-3 rounded-md">
                                    <p className="font-medium">{dia.label}</p>
                                    <RadioGroup
                                        value={form.slot}
                                        onValueChange={(value) => setField("slot", value)}
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2"
                                    >
                                        {visibleSlots.map((s) => {
                                            const value = `${dia.fecha}::${s.time}`;
                                            return (
                                                <div key={value} className="flex items-center">
                                                    <RadioGroupItem id={value} value={value} disabled={!s.disponible} />
                                                    <Label
                                                        htmlFor={value}
                                                        className={cn(
                                                            "ml-2 cursor-pointer select-none border-2 rounded-md px-3 py-2 text-center w-full",
                                                            !s.disponible
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : "border-primary hover:scale-[1.01] transition"
                                                        )}
                                                    >
                                                        {s.time}
                                                        {!s.disponible && (
                                                            <span className="block text-xs text-red-600">No disponible</span>
                                                        )}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                    {hasMore && (
                                        <div className="mt-2 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDayExpanded(dia.fecha)}
                                                className="flex items-center gap-1"
                                            >
                                                {isExpanded ? "Mostrar menos horas" : "Mostrar más horas"}
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </fieldset>
                )}
                {errors.slot && <p id="slot-error" className="mt-1 text-sm text-red-600">{errors.slot}</p>}
            </section>

            <div className="w-full h-1 bg-primary my-2"></div>

            {/* Datos personales */}
            <section className="space-y-4 max-w-2xl mx-auto gap-4">
                <h2 className="text-xl font-semibold my-2">Tus datos</h2>
                <p className="text-md mb-2">Por favor, completa el formulario con tus datos personales para confirmar la cita:</p>

                <div>
                    <Label htmlFor="rut" className="block text-sm font-medium mb-1">RUT <span className="text-red-600" aria-hidden>*</span></Label>
                    <div className="relative">
                        <Input
                            id="rut"
                            placeholder="RUT (ej: 12.345.678-9)"
                            value={form.rut}
                            onChange={(e) => setField("rut", e.target.value)}
                            className={cn("w-full pr-12", errors.rut && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                            aria-invalid={!!errors.rut}
                            aria-describedby={errors.rut ? "rut-error" : undefined}
                            disabled={submitting}
                        />
                        {form.rut && (
                            <button
                                type="button"
                                onClick={() => setField("rut", "")}
                                aria-label="Limpiar RUT"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                disabled={submitting}
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        )}
                    </div>
                    {errors.rut && <p id="rut-error" className="mt-1 text-sm text-red-600">{errors.rut}</p>}
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label htmlFor="firstName" className="block text-sm font-medium mb-1">Nombre <span className="text-red-600" aria-hidden>*</span></Label>
                        <div className="relative">
                            <Input id="firstName" value={form.firstName}
                                   onChange={(e) => setField("firstName", e.target.value)} placeholder="Nombre"
                                   className={cn("pr-12", errors.firstName && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                                   aria-invalid={!!errors.firstName}
                                   aria-describedby={errors.firstName ? "firstName-error" : undefined}/>
                            {form.firstName && (
                                <button type="button" onClick={() => setField("firstName", "")} aria-label="Limpiar nombre"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                        disabled={submitting}
                                ><X
                                    className="h-4 w-4"/></button>
                            )}
                        </div>
                        {errors.firstName &&
                            <p id="firstName-error" className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    <div className="flex-1">
                        <Label htmlFor="lastName" className="block text-sm font-medium mb-1">Apellido <span className="text-red-600" aria-hidden>*</span></Label>
                        <div className="relative">
                            <Input id="lastName" value={form.lastName}
                                   onChange={(e) => setField("lastName", e.target.value)} placeholder="Apellido"
                                   className={cn("pr-12", errors.lastName && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                                   aria-invalid={!!errors.lastName}
                                   aria-describedby={errors.lastName ? "lastName-error" : undefined}/>
                            {form.lastName && (
                                <button type="button" onClick={() => setField("lastName", "")} aria-label="Limpiar apellido"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                        disabled={submitting}
                                ><X
                                    className="h-4 w-4"/></button>
                            )}
                        </div>
                        {errors.lastName &&
                            <p id="lastName-error" className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                </div>

                <div className="mt-2">
                    <Label htmlFor="phone" className="block text-sm font-medium mb-1">Teléfono <span className="text-red-600" aria-hidden>*</span></Label>
                    <div className="relative flex w-full border border-primary rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                        <span className="bg-primary text-white px-3 py-2 flex items-center font-semibold select-none">+56 9</span>
                        <div className="relative flex-1">
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Teléfono"
                                value={form.phone}
                                onChange={(e) => setField("phone", e.target.value)}
                                className={cn("flex-1 border-0 rounded-none focus:ring-0 pr-12", errors.phone && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                                aria-invalid={!!errors.phone}
                                aria-describedby={errors.phone ? "phone-error" : undefined}
                            />
                            {form.phone && (
                                <button type="button" onClick={() => setField("phone", "")} aria-label="Limpiar teléfono"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                        disabled={submitting}
                                ><X className="h-4 w-4"/></button>
                            )}
                        </div>
                    </div>
                </div>
                {errors.phone && <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>}

                <div>
                    <Label htmlFor="email" className="block text-sm font-medium mb-1">Correo electrónico <span className="text-red-600" aria-hidden>*</span></Label>
                    <div className="relative">
                        <Input
                            id="email"
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

                <div id="turnstile-wrapper" className="mt-4 w-full flex flex-col items-center">
                    <Label className="block text-sm font-medium mb-2">Verificación <span className="text-red-600" aria-hidden>*</span></Label>
                    <div
                        id="turnstile-widget"
                        className={cn("w-full lg:max-w-sm")}
                        aria-describedby={errors.captchaToken ? 'captchaToken-error' : undefined}
                        aria-invalid={!!errors.captchaToken}
                    />
                    {errors.captchaToken && (
                        <p id="captchaToken-error" className="mt-1 text-sm text-red-600">{errors.captchaToken}</p>
                    )}
                </div>
                <Button type="submit" disabled={submitting} className="w-full mt-2 text-white">
                    {submitting ? "Confirmando..." : "Confirmar cita"}
                </Button>

                {/* Dialog resumen de la cita */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-lg bg-white">
                        <DialogHeader>
                            <DialogTitle>Resumen de la cita</DialogTitle>
                            <DialogDescription>Revisa los datos antes de enviar.</DialogDescription>
                        </DialogHeader>

                        {/* Summary content */}
                        <div className="space-y-2 text-sm">
                            <p><span className="font-semibold">Mascota:</span> {form.petType === 'dog' ? 'Perro' : 'Gato'} ({form.petSex === 'male' ? 'Macho' : 'Hembra'})</p>
                            <p><span className="font-semibold">Nombre:</span> {form.petName}</p>
                            <p><span className="font-semibold">Servicios:</span> {form.servicios.map(id => services.find(s => String(s.id) === String(id))?.title || id).join(', ')}</p>
                            <p><span className="font-semibold">Fecha y hora:</span> {form.slot.replace('::', ' ')}</p>
                            <p><span className="font-semibold">RUT:</span> {form.rut}</p>
                            <p><span className="font-semibold">Nombre completo:</span> {form.firstName} {form.lastName}</p>
                            <p><span className="font-semibold">Teléfono:</span> +56 9 {form.phone}</p>
                            <p><span className="font-semibold">Correo:</span> {form.email}</p>
                            {form.weight != null && <p><span className="font-semibold">Peso:</span> {form.weight} kg</p>}
                            {form.age != null && <p><span className="font-semibold">Edad:</span> {form.age} años</p>}
                            {form.comentario && <p><span className="font-semibold">Comentarios:</span> {form.comentario}</p>}
                        </div>

                        {/* Submission status */}
                        {submitMessage && (
                            <div className="mt-3 p-2 rounded bg-green-100 text-green-800 text-sm" role="status">{submitMessage}</div>
                        )}
                        {submitError && (
                            <div className="mt-3 p-2 rounded bg-red-100 text-red-800 text-sm" role="alert">{submitError}</div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>Cerrar</Button>
                            <Button type="button" onClick={confirmSubmit} disabled={submitting} className="text-white">
                                {submitting ? 'Enviando...' : 'Enviar solicitud'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </section>
        </form>
    );
}
