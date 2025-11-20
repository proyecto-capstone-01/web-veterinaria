import { Button } from './ui/button.tsx';
import { FlipWords } from "./ui/flip-words";



export function AnimatedHero() {

    const words = ["mascota", "perro", "gato"];
    const interval = 3_000;

    return (
        <section className="relative rounded-2xl shadow-lg overflow-hidden min-h-[70vh] lg:min-h-[640px]">
            {/* Animated gradient background behind imagery */}

            {/* Mobile full bleed image */}
            <img
                src="/portrait-dog.webp"
                alt="Perro feliz"
                className="absolute inset-0 w-full h-full object-cover lg:hidden z-0"
                width={800}
                height={600}
                loading='eager'
            />
            {/* Desktop side image (occupies right portion) */}
            <div className="hidden lg:block absolute inset-y-0 right-0 w-[48%] xl:w-[40%] z-0">
                <img
                    src="/portrait-dog.webp"
                    alt="Perro feliz"
                    width={800}
                    height={800}
                    loading='eager'
                    className="h-full w-full object-cover object-center"
                />
            </div>
            {/* Dark gradient overlay for readable text */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent lg:from-black/70 lg:via-black/30 lg:to-transparent" />
            <div className="relative z-20 max-w-screen-xl mx-auto px-6 sm:px-8 flex flex-col lg:flex-row items-center min-h-[70vh] lg:min-h-[640px]">
                <div className="w-full xl:w-3/5 lg:w-[60%] text-center lg:text-left flex flex-col justify-center items-center lg:items-start lg:py-24 gap-8 lg:gap-6">
                    <div className="flex flex-col justify-center items-center lg:items-start lg:pl-2">
                        <h1 className="text-4xl lg:text-6xl font-light leading-snug sm:leading-tight pt-16 lg:pt-0">
                            Tu <FlipWords words={words} className="font-semibold" duration={interval} /> <br /> <span>merece lo mejor</span>, nosotros se lo damos
                        </h1>
                        <p className="mt-4 text-xl max-w-prose">Reserva tu cita aquí de manera completamente on-line</p>
                    </div>
                    <div className="mt-auto flex flex-col sm:flex-row justify-center lg:justify-start gap-4 w-full md:w-auto lg:pl-2">
                        <Button variant="default" className="w-auto">
                            <a href="/agendar" className="flex items-center justify-center">
                                <span>Reservar cita</span>
                            </a>
                        </Button>
                        <a
                            href="https://wa.me/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-5 py-3 bg-white text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                        >
                            <img
                                src="/WhatsApp.svg"
                                className="h-6"
                                alt="WhatsApp"
                                width={24}
                                height={24}
                                loading='eager'
                            />
                            WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>

    )
}