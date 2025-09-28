import React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function ProductFilters({
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    products,
}) {
    const categories = ["all", ...new Set(products.map((p) => p.category))];

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
            <div className="w-full lg:flex-1">
                <Input
                    type="text"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-row gap-4 w-full lg:w-auto">
                <Select value={category} onValueChange={setCategory} className="w-full sm:w-1/2 lg:w-auto">
                    <SelectTrigger className="lg:w-[200px] sm:w-full">
                        <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat.toUpperCase()}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sort} onValueChange={setSort} className="w-full sm:w-1/2 lg:w-auto">
                    <SelectTrigger className="lg:w-[200px] sm:w-full">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Ordenar por</SelectItem>
                        <SelectItem value="asc">Precio: Menor a Mayor</SelectItem>
                        <SelectItem value="desc">Precio: Mayor a Menor</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}