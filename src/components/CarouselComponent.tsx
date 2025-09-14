"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import StaffCard from "./StaffCard"

type Staff = {
    nombre: string
    cargo: string
    imagen: string
}

export default function CarouselComponent({ staff }: { staff: Staff[] }) {
    const plugin = React.useMemo(
        () =>
        Autoplay({
            delay: 3000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
        }),
        []
    )

    return (
        <Carousel
        plugins={[plugin]}
        opts={{
            align: "start",
            loop: true,
        }}
        className="w-full max-w-6xl mx-auto pt-6"
        >
            <CarouselContent>
                {staff.map((persona, index) => (
                <CarouselItem
                    key={index}
                    className="basis-full sm:basis-1/3 md:basis-1/2 lg:basis-1/3"
                >
                    <StaffCard
                    nombre={persona.nombre}
                    cargo={persona.cargo}
                    imagen={persona.imagen}
                    />
                </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    )
}
