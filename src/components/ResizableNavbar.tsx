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
                            alt={logo?.alt ?? "Veterinaria Pucará"}
                            label={logo?.label ?? "Veterinaria Pucará"}
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
                                className="relative text-neutral-700 dark:text-neutral-700"
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

export function NoScriptNavbarFallback() {
    return (
        <noscript>
            <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-2 md:px-4">
                <nav aria-label="Primary" className="pointer-events-auto w-full max-w-[1280px] rounded-md bg-white/90 backdrop-blur py-3 px-6 shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08)] flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 font-medium text-neutral-700 hover:text-neutral-900">
                        <img src="/favicon.svg" alt="Logo" width="30" height="30" />
                        Veterinaria Pucará
                    </a>
                    <ul className="hidden md:flex items-center gap-1 text-sm font-medium text-neutral-600">
                        <li><a className="px-3 py-2 rounded-full hover:bg-gray-100" href="/">Inicio</a></li>
                        <li><a className="px-3 py-2 rounded-full hover:bg-gray-100" href="/products">Productos</a></li>
                        <li><a className="px-3 py-2 rounded-full hover:bg-gray-100" href="/blog">Blog Educativo</a></li>
                        <li><a className="px-3 py-2 rounded-full hover:bg-gray-100" href="/formulario-contacto">Contacto</a></li>
                    </ul>
                    <div className="flex items-center gap-3">
                        <a href="/agendar" className="px-4 py-2 rounded-md bg-gradient-to-b from-[#6060F0FF] to-[#5A5AE0] text-white text-sm font-semibold shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]">Agendar Cita</a>
                    </div>
                </nav>
            </div>
            <style>{`/* Reserve space so content isn't hidden behind static noscript navbar */ body { padding-top: 72px; } @media (min-width: 1024px){ body { padding-top: 88px; } }`}</style>
        </noscript>
    )
}