import { Button } from "@/components/ui/button"

export const AppointmentLinkButton = () => {
    return (
        <Button variant="default" className="w-full sm:w-auto px-6 py-4 text-base" asChild>
            <a href="/agendar" className="w-full sm:w-auto text-center">
                Agendar Cita
            </a>
        </Button>
    )
}

export const WhatsappLinkButton = ({ children, whatsAppNumber }: { children: React.ReactNode, whatsAppNumber: string }) => {
    return (
        <Button variant="outline" className="w-full sm:w-auto px-6 py-4 text-base" asChild>
            <a
                href={"https://wa.me/" + whatsAppNumber.replace(/\D/g, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
            >
                <div className="flex items-center justify-center gap-2">
                    {children}
                    <span>Contáctanos</span>
                </div>

            </a>
        </Button>
    )
}