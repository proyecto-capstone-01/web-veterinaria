import React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { InfoIcon } from "lucide-react"; // ejemplo de icono de información

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
        <div className="space-y-4 rounded-lg bg-white">
            <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                    Buscar producto
                    <InfoIcon className="w-4 h-4 text-gray-400" title="Escribe palabras clave para encontrar productos rápidamente" />
                </label>
                <Input
                    type="text"
                    placeholder="Ej: Correas, alimentos, juguetes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Puedes buscar por nombre o descripción del producto
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                    Categoría
                    <InfoIcon className="w-4 h-4 text-gray-400" title="Filtra productos según su categoría" />
                </label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                            {cat === "all" ? "Todas las categorías" : cat.toUpperCase()}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                    Elige una categoría para ver solo los productos relacionados
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                    Ordenar por
                    <InfoIcon className="w-4 h-4 text-gray-400" title="Ordena los productos por precio" />
                </label>
                <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un orden" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Por defecto</SelectItem>
                        <SelectItem value="asc">Precio: Menor a Mayor</SelectItem>
                        <SelectItem value="desc">Precio: Mayor a Menor</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                    Ordena los productos según tu preferencia de precio
                </p>
            </div>
        </div>
    );
}