"use client";

import {
    Navbar,
    NavBody,
    NavItems,
    MobileNav,
    NavbarLogo,
    NavbarButton,
    MobileNavHeader,
    MobileNavToggle,
    MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState, useEffect } from "react";

export type ResizableNavItem = {
    name: string;
    href: string;
};

export type ResizableNavbarCTA = {
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "dark" | "gradient";
};

export type ResizableNavbarProps = {
    items?: ResizableNavItem[];
    logo?: {
        href?: string;
        src?: string;
        alt?: string;
        label?: string;
    };
    ctas?: ResizableNavbarCTA[];
    className?: string;
};

export function ResizableNavbar({
    items,
    logo,
    ctas,
}: ResizableNavbarProps) {
    // Provide sensible defaults for this project if not passed in
    const navItems: ResizableNavItem[] =
        items ?? [
            { name: "Inicio", href: "/" },
            { name: "Productos", href: "/products" },
            { name: "Blog Educativo", href: "/blog" },
            { name: "Contacto", href: "/formulario-contacto" },
        ];

    const actions: ResizableNavbarCTA[] =
        ctas ?? [
            { label: "Agendar Cita", href: "/agendar", variant: "gradient" },
        ];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeHref, setActiveHref] = useState<string>("/");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setActiveHref(window.location.pathname);
        }
    }, []);

    return (
        <div className="relative w-full">
            <Navbar activeHref={activeHref} initialMaxWidth={1280} shrunkMaxWidth={880}>
                {/* Desktop Navigation */}
                <NavBody>
                    <NavbarLogo
                        href={logo?.href ?? "/"}
                        src={logo?.src ?? "/favicon.svg"}
                        alt={logo?.alt ?? "Veterinaria Pucará"}
                        label={logo?.label ?? "Veterinaria Pucará"}
                    />
                    <NavItems
                        items={navItems.map((i) => ({ name: i.name, link: i.href }))}
                        activeHref={activeHref}
                    />
                    <div className="flex items-center gap-4">
                        {actions.map((a, idx) => (
                            <NavbarButton key={`cta-${idx}`} href={a.href} variant={a.variant ?? (idx === 0 ? "primary" : "secondary")}>{a.label}</NavbarButton>
                        ))}
                    </div>
                </NavBody>

                {/* Mobile Navigation */}
                <MobileNav>
                    <MobileNavHeader>
                        <NavbarLogo
                            href={logo?.href ?? "/"}
                            src={logo?.src ?? "/favicon.svg"}
                            alt={logo?.alt ?? "Pucará Vet"}
                            label={logo?.label ?? "Pucará Vet"}
                        />
                        <MobileNavToggle
                            isOpen={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        />
                    </MobileNavHeader>

                    <MobileNavMenu
                        isOpen={isMobileMenuOpen}
                        onClose={() => setIsMobileMenuOpen(false)}
                    >
                        {navItems.map((item, idx) => (
                            <a
                                key={`mobile-link-${idx}`}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="relative text-neutral-600 dark:text-neutral-300"
                            >
                                <span className="block">{item.name}</span>
                            </a>
                        ))}
                        {actions.length > 0 && (
                            <div className="flex w-full flex-col gap-4">
                                {actions.map((a, idx) => (
                                    <NavbarButton
                                        key={`mobile-cta-${idx}`}
                                        href={a.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        variant={a.variant ?? (idx === 0 ? "primary" : "secondary")}
                                        className="w-full"
                                    >
                                        {a.label}
                                    </NavbarButton>
                                ))}
                            </div>
                        )}
                    </MobileNavMenu>
                </MobileNav>
            </Navbar>
        </div>
    );
}
