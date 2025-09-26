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

export default function AccordionComponent({ items }: AccordionComponentProps) {
  return (
    <Accordion type="single" collapsible>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-xl font-semibold">
            {item.name}
          </AccordionTrigger>

          <AccordionContent
            className="overflow-hidden text-gray-700 text-lg md:text-xl
                       data-[state=open]:animate-slideDown
                       data-[state=closed]:animate-slideUp"
          >
            {item.description}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
