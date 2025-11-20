"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

import React, { useEffect, useRef, useState } from "react";


interface NavbarProps {
  children: React.ReactNode;
  className?: string;
  initialMaxWidth?: number;
  shrunkMaxWidth?: number;
  shrinkThreshold?: number;
  activeHref?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
  activeHref?: string;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className, initialMaxWidth = 1280, shrunkMaxWidth = 880, shrinkThreshold = 40, activeHref }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [shrunk, setShrunk] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.scrollY > shrinkThreshold : false,
  );
  const [initialized, setInitialized] = useState(false);
  const lastScrollRef = useRef<number>(typeof window !== "undefined" ? window.scrollY : 0);
  const stableReadsRef = useRef(0);

  const readScrollAndSet = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const current = window.scrollY;
    setShrunk(current > shrinkThreshold);
    if (current === lastScrollRef.current) {
      stableReadsRef.current += 1;
    } else {
      stableReadsRef.current = 0;
    }
    lastScrollRef.current = current;
  }, [shrinkThreshold]);

  // Pre-paint read to avoid transparent flash when already scrolled.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useLayoutEffect(() => {
    readScrollAndSet();
  }, [readScrollAndSet]);

  useEffect(() => {
    if (initialized) return;
    let attempts = 0;
    const maxAttempts = 14; // ~14 * 30ms ~= 420ms max wait
    const interval = setInterval(() => {
      attempts += 1;
      readScrollAndSet();
      const stable = stableReadsRef.current >= 2; // two consecutive identical scroll positions
      if (stable || attempts >= maxAttempts) {
        clearInterval(interval);
        setInitialized(true); // enable animations after scroll position stabilized or timeout
      }
    }, 30);

    const handleLoad = () => readScrollAndSet();
    const handlePageShow = () => readScrollAndSet();
    window.addEventListener("load", handleLoad);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      clearInterval(interval);
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [initialized, readScrollAndSet]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!initialized) return; // ignore scroll events until initialized
    setShrunk(latest > shrinkThreshold);
  });

  const targetStyles = {
    width: shrunk
      ? `min(100%, ${shrunkMaxWidth}px)`
      : `min(100%, ${initialMaxWidth}px)`,
    borderRadius: shrunk ? 999 : 12,
    paddingInline: shrunk ? 16 : 24,
    y: shrunk ? 8 : 0,
  };

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none px-2 md:px-4 transition-opacity duration-200", initialized ? "opacity-100" : "opacity-0", className)}
    >
      <motion.div
        style={{
          width: targetStyles.width,
          borderRadius: targetStyles.borderRadius,
          paddingInline: targetStyles.paddingInline,
          transform: `translateY(${targetStyles.y}px)`,
          willChange: "width, border-radius, transform, padding",
        }}
        animate={initialized ? targetStyles : undefined}
        transition={initialized ? { type: "spring", stiffness: 220, damping: 28 } : { duration: 0 }}
        className={cn(
          "pointer-events-auto flex items-center justify-between gap-4 transition-colors",
          shrunk
            ? "py-2 bg-white/80 backdrop-blur shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08)]"
            : "py-4 bg-transparent",
        )}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{ visible?: boolean; shrunk?: boolean; activeHref?: string }>,
                { visible: shrunk, shrunk, activeHref },
              )
            : child,
        )}
      </motion.div>
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible: _visible }: NavBodyProps) => {
  // This component now just acts as a passthrough container for desktop inside the animated shell
  return (
    <div
      className={cn(
        "hidden w-full flex-row items-center justify-between lg:flex",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const NavItems = ({ items, className, onItemClick, activeHref }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const isActive = (href: string) => {
    if (!activeHref) return false;
    if (activeHref === href) return true;
    return activeHref.startsWith(href + "/");
  };

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => {
        const active = isActive(item.link);
        return (
          <a
            onMouseEnter={() => setHovered(idx)}
            onClick={onItemClick}
            className={cn(
              "relative px-4 py-2 rounded-full text-neutral-600",
              active && "font-semibold",
            )}
            key={`link-${idx}`}
            href={item.link}
          >
            {hovered === idx && (
              <motion.div
                layoutId="hovered"
                className="absolute inset-0 h-full w-full rounded-full bg-gray-100"
              />
            )}
            <span className="relative z-20">{item.name}</span>
          </a>
        );
      })}
    </motion.div>
  );
};

export const MobileNav = ({ children, className }: MobileNavProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-between lg:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose: _onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white/95 px-4 py-6 shadow-lg backdrop-blur",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return isOpen ? (
    <IconX className="text-black" onClick={onClick} />
  ) : (
    <IconMenu2 className="text-black" onClick={onClick} />
  );
};

export const NavbarLogo = ({
  href = "/",
  src = "/favicon.svg",
  alt = "logo",
  label = "Startup",
  className,
  imgProps,
}: {
  href?: string;
  src?: string;
  alt?: string;
  label?: string;
  className?: string;
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}) => {
  return (
    <a
      href={href}
      className={cn(
        "relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-medium text-neutral-700",
        className,
      )}
    >
      <img src={src} alt={alt} width={30} height={30} {...imgProps} />
      <span className="font-medium">{label}</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md bg-white button bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-[#6060F0FF] to-[#5A5AE0] text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
