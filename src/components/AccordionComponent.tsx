import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface AccordionItemData {
    name: string
    description: string
}

interface AccordionComponentProps {
    items: AccordionItemData[]
}

export default function AccordionComponent({items}: AccordionComponentProps) {
    return (
        <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-0"
        >
            {items.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-medium">
                        {item.name}
                    </AccordionTrigger>

                    <AccordionContent
                        className="flex flex-col gap-4 text-balance"
                    >
                        {item.description}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}
