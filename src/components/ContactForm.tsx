import React, { useState } from "react";
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

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      alert("Debes aceptar los términos y condiciones.");
      return;
    }

    setOpen(true);
    setForm({ name: "", email: "", message: "" });
    setAcceptedTerms(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-2xl mx-auto"
        id="contact-form"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <Input
              type="text"
              required
              value={form.name}
              placeholder="Tu nombre"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <Input
              type="email"
              required
              value={form.email}
              placeholder="Tu correo"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mensaje</label>
          <Textarea
            required
            placeholder="Escribe tu mensaje aquí..."
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            className="shrink-0 text-white"
            onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
          />
          <Label htmlFor="terms" className="ml-2">
            Acepto los{" "}
            <a href="/terms" className="text-primary underline">
              términos y condiciones
            </a>
          </Label>
        </div>

        <button
          type="submit"
          className="inline-block px-5 py-3 text-md rounded-lg transition duration-200 ease-in-out text-center bg-primary text-white hover:bg-primary-dark"
        >
          Enviar
        </button>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensaje enviado</DialogTitle>
            <DialogDescription>
              Tu mensaje ha sido enviado correctamente.
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