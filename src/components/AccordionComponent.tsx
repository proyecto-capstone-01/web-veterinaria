// src/components/AccordionComponent.tsx
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface AccordionComponentProps {
    name: string
    description: string
}

export default function AccordionComponent({ name, description }: AccordionComponentProps) {
    return (
        <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
                <AccordionTrigger className="md:text-2xl text-xl ">{name}</AccordionTrigger>
                <AccordionContent className="text-gray-700 text-lg md:text-xl">
                    {description}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}