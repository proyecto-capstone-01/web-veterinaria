import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useMemo, useState } from "react"; // replaced useMemo/useState import to include React
import { z } from "zod";
import { cn } from "@/lib/utils";
import { X, Info } from "lucide-react";
import { submitAppointmentForm } from "@/lib/cms";
import { loadTurnstile } from "@/lib/turnstile"; // added
// @ts-ignore
import { PUBLIC_TURNSTILE_KEY } from "astro:env/client"


// Tipos de datos locales
type ServiceItem = {
    id: string;
    nombre: string;
    precio: number;
    descripcion?: string | null;
    disponible?: boolean;
};

type DaySlots = {
    fecha: string; // etiqueta visible
    slots: { time: string; disponible: boolean }[];
};

// Datos de ejemplo enriquecidos
const SERVICES: ServiceItem[] = [
    {
        id: "consulta",
        nombre: "Consulta veterinaria",
        precio: 10000,
        descripcion: "Evaluación general y diagnóstico",
        disponible: true
    },
    {id: "bano", nombre: "Baño y peluquería", precio: 15000, descripcion: "Higiene y corte de pelo", disponible: true},
    {id: "rx", nombre: "Radiografías", precio: 30000, descripcion: "Imágenes para diagnóstico", disponible: false},
    {id: "sangre", nombre: "Exámenes de sangre", precio: 20000, descripcion: null, disponible: true},
    {id: "vacunas", nombre: "Vacunas anuales", precio: 15000, descripcion: "Calendario al día", disponible: true},
    {id: "unas", nombre: "Corte de uñas", precio: 5000, descripcion: "Corte seguro", disponible: true},
    {id: "desparasitacion", nombre: "Desparasitación", precio: 8000, descripcion: "Interna/externa", disponible: true},
    {
        id: "cirugia",
        nombre: "Cirugía menor",
        precio: 60000,
        descripcion: "Procedimientos ambulatorios",
        disponible: false
    },
    {id: "odontologia", nombre: "Limpieza dental", precio: 25000, descripcion: "Profilaxis dental", disponible: true},
    {
        id: "hospitalizacion",
        nombre: "Hospitalización",
        precio: 35000,
        descripcion: "Observación y cuidados",
        disponible: true
    },
    {id: "nutricion", nombre: "Asesoría nutricional", precio: 12000, descripcion: "Plan alimenticio", disponible: true},
    {
        id: "entrenamiento",
        nombre: "Entrenamiento básico",
        precio: 18000,
        descripcion: "Órdenes básicas",
        disponible: true
    },
    {
        id: "microchip",
        nombre: "Implantación de microchip",
        precio: 22000,
        descripcion: "Identificación permanente",
        disponible: true
    },
];

const HOURS: DaySlots[] = [
    {
        fecha: "Viernes • 07/11/2025", slots: [
            {time: "09:00", disponible: true},
            {time: "11:00", disponible: true},
            {time: "13:00", disponible: false},
            {time: "15:00", disponible: true},
        ]
    },
    {
        fecha: "Sábado • 08/11/2025", slots: [
            {time: "08:30", disponible: true},
            {time: "10:00", disponible: false},
            {time: "12:00", disponible: true},
            {time: "14:00", disponible: true},
        ]
    },
    {
        fecha: "Domingo • 09/11/2025", slots: [
            {time: "09:00", disponible: true},
            {time: "11:00", disponible: true},
            {time: "13:00", disponible: true},
            {time: "15:00", disponible: true},
            {time: "17:00", disponible: false},
            {time: "19:00", disponible: true},
            {time: "21:00", disponible: true},
            {time: "23:00", disponible: true},
            {time: "23:30", disponible: true},
            {time: "23:59", disponible: true},
        ]
    },
];

// Esquema de validación con Zod
const schema = z.object({
    petType: z.enum(["perro", "gato"], {message: "Selecciona un tipo de mascota."}),
    petName: z.string().min(1, {message: "Ingresa el nombre de tu mascota."}).trim(),
    servicios: z.array(z.string()).min(1, {message: "Selecciona al menos un servicio."}),
    comentario: z.string().max(1000, {message: "Máximo 1000 caracteres."}).optional().transform(v => v ?? ""),
    slot: z.string().min(1, {message: "Selecciona un horario."}),
    rut: z.string().regex(/^\d{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$/, {message: "RUT inválido (formato 12.345.678-9)."}),
    firstName: z.string().min(2, {message: "Nombre debe tener al menos 2 caracteres."}).trim(),
    lastName: z.string().min(2, {message: "Apellido debe tener al menos 2 caracteres."}).trim(),
    phone: z.string().refine(v => (v.match(/\d/g) || []).length >= 7 && (v.match(/\d/g) || []).length <= 15, {message: "Ingresa un teléfono válido."}).trim(),
    email: z.string().email({message: "Correo electrónico inválido."}).trim(),
    captchaToken: z.string().min(1, {message: "Resuelve el captcha."}), // added
});

type FormData = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormData, string>>;

export default function AppointmentForm() {
    // Estado del formulario controlado
    const [form, setForm] = useState<FormData>({
        petType: "perro",
        petName: "",
        servicios: [],
        comentario: "",
        slot: "",
        rut: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        captchaToken: "", // added
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const totalPrice = useMemo(() => {
        return form.servicios.reduce((sum, id) => {
            const s = SERVICES.find(sv => sv.id === id);
            return sum + (s?.precio || 0);
        }, 0);
    }, [form.servicios]);

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

        // Servicios disponibles
        const unavailableSelected = form.servicios.filter(id => SERVICES.find(s => s.id === id && s.disponible === false));
        if (unavailableSelected.length > 0) {
            next.servicios = "Hay servicios no disponibles seleccionados.";
        }

        // Slot disponible
        if (form.slot) {
            const [fecha, hora] = form.slot.split("::");
            const day = HOURS.find(d => d.fecha === fecha);
            const ok = !!day?.slots.find(s => s.time === hora && s.disponible);
            if (!ok) next.slot = "El horario seleccionado no está disponible.";
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
        if (!validateAll()) return;
        if (!form.captchaToken) { // ensure captcha solved
            setErrors(prev => ({...prev, captchaToken: "Resuelve el captcha."}));
            return;
        }
        setSubmitting(true);
        try {
            const [fecha, hora] = form.slot.split("::");
            const payload = {
                petType: form.petType,
                petName: form.petName,
                servicios: form.servicios,
                comentario: form.comentario,
                fecha,
                hora,
                rut: form.rut,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email,
                totalPrice,
                captchaToken: form.captchaToken, // added
            };

            const res = await submitAppointmentForm(payload);
            const msg = getResponseText(res);
            // Feedback podría integrarse con un toast en el futuro
            console.info("Cita confirmada:", msg);
            // Reset
            setForm({
                petType: "perro",
                petName: "",
                servicios: [],
                comentario: "",
                slot: "",
                rut: "",
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
                captchaToken: "", // reset
            });
            if (typeof window !== 'undefined' && (window as any).turnstile) {
                try { (window as any).turnstile.reset(); } catch {}
            }
        } catch (error: any) {
            const msg = error?.response?.data ? getResponseText(error.response.data) : (error?.message || "Error al confirmar la cita.");
            console.error("Error al confirmar la cita:", msg);
        } finally {
            setSubmitting(false);
        }
    };

    const comentarioLen = form.comentario?.length ?? 0;

    const toggleService = (id: string) => {
        const svc = SERVICES.find(s => s.id === id);
        if (!svc || svc.disponible === false) return; // ignorar si no disponible
        setField("servicios", form.servicios.includes(id)
            ? form.servicios.filter(s => s !== id)
            : [...form.servicios, id]
        );
    };

    // Turnstile setup
    React.useEffect(() => {
        let mounted = true;
        if (typeof window === 'undefined') return;
        loadTurnstile().then(() => {
            if (!mounted) return;
            if ((window as any).turnstile) {
                (window as any).turnstile.render('#turnstile-widget', {
                    sitekey: PUBLIC_TURNSTILE_KEY,
                    callback: (token: string) => {
                        setField('captchaToken', token);
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
                    theme: 'auto',
                    retry: 'auto',
                });
            }
        }).catch(() => {
            setErrors(prev => ({...prev, captchaToken: 'No se pudo cargar el captcha.'}));
        });
        return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <form onSubmit={onSubmit} className="space-y-8 p-6 sm:p-8 lg:p-10">
            {/* Mascota */}
            <section>
                <h2 className="text-xl font-semibold mb-2">Tu mascota</h2>
                <p className="text-md mb-3 text-gray-500">Selecciona el tipo de mascota que tienes:</p>
                <fieldset>
                    <legend className="sr-only">Tipo de mascota</legend>
                    <div className="flex gap-3 mb-3">
                        {(["perro", "gato"] as const).map((tipo) => (
                            <label key={tipo} className="flex-1">
                                <input
                                    type="radio"
                                    name="mascota"
                                    value={tipo}
                                    checked={form.petType === tipo}
                                    onChange={() => setField("petType", tipo)}
                                    className="hidden peer"
                                />
                                <div className={cn(
                                    "select-none border-2 rounded-md px-4 text-center cursor-pointer border-primary py-3 font-medium transition transform hover:scale-[1.01] hover:shadow-md",
                                    form.petType === tipo && "bg-primary-dark text-white"
                                )}>
                                    {tipo === "perro" ? "Perro 🐶" : "Gato 🐱"}
                                </div>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div>
                    <Label htmlFor="petName" className="block text-sm font-medium mb-1">Nombre de tu mascota</Label>
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
            </section>

            {/* Servicios */}
            <section>
                <h2 className="text-xl font-semibold my-2">Servicio</h2>
                <p className="text-md mb-3 text-gray-500">Selecciona los servicios que deseas para tu mascota:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map((servicio) => {
                        const checked = form.servicios.includes(servicio.id);
                        const disabled = servicio.disponible === false;
                        return (
                            <div key={servicio.id}
                                 className={cn("relative border-2 rounded-lg px-4 py-2 transition", checked ? "bg-primary-dark text-white border-primary-dark" : "border-primary", disabled && "opacity-60 cursor-not-allowed")}
                                 aria-disabled={disabled}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id={`svc-${servicio.id}`}
                                        checked={checked}
                                        disabled={disabled}
                                        onCheckedChange={() => toggleService(servicio.id)}
                                        className={cn("mt-1", errors.servicios && !form.servicios.length ? "border-red-500 focus-visible:ring-red-500" : undefined)}
                                        aria-describedby={errors.servicios ? "servicios-error" : undefined}
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor={`svc-${servicio.id}`}
                                               className={cn("cursor-pointer flex items-center gap-2 font-semibold")}
                                        >
                                            {servicio.nombre}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                            <span tabIndex={0} className="inline-flex items-center">
                              <Info className="h-4 w-4"/>
                            </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs text-white">
                                                        {servicio.descripcion ? servicio.descripcion : "Sin descripción"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </Label>
                                        <div className="text-sm mt-0.5">${servicio.precio.toLocaleString("es-CL")}</div>
                                        {!servicio.disponible && (
                                            <div className="text-xs text-red-600 mt-1">No disponible</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {errors.servicios &&
                    <p id="servicios-error" className="mt-1 text-sm text-red-600">{errors.servicios}</p>}

                <div className="mt-4">
                    <blockquote className="border-l-4 border-primary pl-4 italic text-primary-dark">
                        Precio total estimado: $<span id="totalPriceEstimate">{totalPrice.toLocaleString("es-CL")}</span>
                    </blockquote>
                </div>

                <div className="mt-3">
                    <div className="flex items-end justify-between mb-1">
                        <Label htmlFor="comentario" className="block text-sm font-medium mb-1">Comentarios adicionales</Label>
                        <span
                            className={cn("text-xs", comentarioLen > 1000 ? "text-red-600" : "text-muted-foreground")}>{comentarioLen}/1000</span>
                    </div>
                    <Textarea
                        id="comentario"
                        placeholder="¿Tienes comentarios adicionales? Escríbelos aquí. Ya sean síntomas, cuidados específicos u otros."
                        className={cn("w-full resize-none overflow-hidden", errors.comentario && "border-red-500 focus-visible:ring-red-500 placeholder:text-red-400")}
                        rows={5}
                        value={form.comentario}
                        onChange={(e) => setField("comentario", e.target.value)}
                        maxLength={1000}
                        aria-invalid={!!errors.comentario}
                        aria-describedby={errors.comentario ? "comentario-error" : undefined}
                    />
                    {errors.comentario &&
                        <p id="comentario-error" className="mt-1 text-sm text-red-600">{errors.comentario}</p>}
                </div>
            </section>

            {/* Horarios */}
            <section>
                <h2 className="text-xl font-semibold my-2">Elige un horario para la consulta</h2>
                <p className="text-md mb-3 text-gray-500">Selecciona el horario que mejor te acomode:</p>
                <fieldset className="space-y-4" aria-describedby={errors.slot ? "slot-error" : undefined}>
                    <legend className="sr-only">Horario</legend>
                    {HOURS.map((dia) => (
                        <div key={dia.fecha} className="border-1 border-primary/40 p-3 rounded-md">
                            <p className="font-medium">{dia.fecha}</p>
                            <RadioGroup value={form.slot} onValueChange={(value) => setField("slot", value)}
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                                {dia.slots.map((s) => {
                                    const value = `${dia.fecha}::${s.time}`;
                                    return (
                                        <div key={value} className="flex items-center">
                                            <RadioGroupItem id={value} value={value} disabled={!s.disponible}/>
                                            <Label htmlFor={value}
                                                   className={cn("ml-2 cursor-pointer select-none border-2 rounded-md px-3 py-2 text-center w-full", !s.disponible ? "opacity-50 cursor-not-allowed" : "border-primary hover:scale-[1.01] transition")}
                                            >
                                                {s.time}
                                                {!s.disponible &&
                                                    <span className="block text-xs text-red-600">No disponible</span>}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </RadioGroup>
                        </div>
                    ))}
                </fieldset>
                {errors.slot && <p id="slot-error" className="mt-1 text-sm text-red-600">{errors.slot}</p>}
            </section>

            <div className="w-full h-1 bg-primary my-2"></div>

            {/* Datos personales */}
            <section
                className="space-y-4 max-w-2xl mx-auto gap-4"
            >
                <h2 className="text-xl font-semibold my-2">Tus datos</h2>
                <p className="text-md mb-2">Por favor, completa el formulario con tus datos personales para confirmar la
                    cita:</p>

                <div>
                    <Label htmlFor="rut" className="block text-sm font-medium mb-1">RUT</Label>
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
                        <Label htmlFor="firstName" className="block text-sm font-medium mb-1">Nombre</Label>
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
                        <Label htmlFor="lastName" className="block text-sm font-medium mb-1">Apellido</Label>
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

                <div
                    className="relative flex w-full border border-primary rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary mt-2">
                    <span
                        className="bg-primary text-white px-3 py-2 flex items-center font-semibold select-none">+56 9</span>
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
                            ><X
                                className="h-4 w-4"/></button>
                        )}
                    </div>
                </div>
                {errors.phone && <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>}

                <div>
                    <Label htmlFor="email" className="block text-sm font-medium mb-1">Correo electrónico</Label>
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

                <div className="md:w-full max-w-xl sm:w-sm text-center flex items-center justify-center">
                    <p className="mt-2 text-center">Al confirmar, estarás aceptando los
                        <a href="/terminos-y-condiciones" className="text-primary font-semibold"> términos y condiciones</a> y
                        <a href="/privacidad" className="text-primary font-semibold"> política de privacidad</a>
                    </p>
                </div>

                <div id="turnstile-wrapper" className="mt-4">
                    <div
                        id="turnstile-widget"
                        className={cn(errors.captchaToken && 'block')}
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
            </section>
        </form>
    );
}
