"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TargetAndTransition, Transition } from "motion/react";
import { cn } from "@/lib/utils";

/** Descriptor for each image to be flipped */
export interface ImageDescriptor {
  src: string;
  alt?: string; // if omitted will be treated as decorative
  className?: string;
  /** Optional per-image scale multiplier (e.g., 1.1 to zoom in a bit) */
  scale?: number;
  /** Optional CSS object-position value (e.g., 'center right', '50% 40%') */
  objectPosition?: string;
}

/** Optional motion configuration allowing overrides */
export interface MotionConfig {
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  transition?: Transition;
}

interface FlipImagesProps {
  images: ImageDescriptor[];
  /** Duration in ms before flipping to next image */
  duration?: number;
  /** Additional class names for outer container */
  className?: string;
  /** Additional class names applied to the <img> */
  imgClassName?: string;
  /** Preload all images eagerly */
  preload?: boolean;
  /** Maintain a fixed aspect ratio (e.g. '16/9', '4/3', '1/1') */
  aspectRatio?: string;
  /** Pause automatic flipping while hovered / focused */
  pauseOnHover?: boolean;
  /** Override default motion variants */
  motionConfig?: MotionConfig;
  /** Global scale multiplier applied to all images (default 1) */
  baseScale?: number;
  /** Add a soft gradient fade on the left edge */
  edgeFadeLeft?: boolean;
  /** Add a soft gradient fade on the right edge */
  edgeFadeRight?: boolean;
  /** Width of the edge fade in pixels (default 64) */
  edgeFadeWidth?: number;
  /** CSS color for fade; can be rgba() or hex. Default 'rgba(0,0,0,0.6)' */
  edgeFadeColor?: string;
}

/**
 * FlipImages cycles through a list of images, animating their entrance / exit.
 * - Supports preload to reduce perceived flicker.
 * - Pauses on hover / focus (optional).
 * - Provides accessible labeling via alt text & aria-live.
 */
export const FlipImages: React.FC<FlipImagesProps> = ({
  images,
  duration = 3000,
  className,
  imgClassName,
  preload = true,
  aspectRatio,
  pauseOnHover = true,
  motionConfig,
  baseScale = 1,
  edgeFadeLeft = false,
  edgeFadeRight = false,
  edgeFadeWidth = 64,
  edgeFadeColor = "rgba(0,0,0,0.6)",
}) => {
  // Guards
  if (!images || images.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const timerRef = useRef<number | null>(null);

  const currentImage = images[currentIndex];

  const startAnimation = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setIsAnimating(true);
  }, [currentIndex, images.length]);

  // Rotation timer similar to FlipWords
  useEffect(() => {
    if (images.length <= 1) return; // no animation needed
    if (isPaused || isAnimating) return;
    timerRef.current = window.setTimeout(() => {
      startAnimation();
    }, duration) as unknown as number;
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, isAnimating, duration, startAnimation, images.length]);

  // Preload images
  useEffect(() => {
    if (!preload) return;
    images.forEach((img, idx) => {
      const pre = new Image();
      pre.src = img.src;
      pre.onerror = () => {
        setErrorIndices((prev) => new Set(prev).add(idx));
      };
    });
  }, [images, preload]);

  // Compute variants per-image to honor per-image scale
  const computedScale = (currentImage?.scale ?? 1) * baseScale;
  const initialVariant: TargetAndTransition = {
    opacity: 0,
    y: 10,
    scale: 0.95 * computedScale,
  };
  const animateVariant: TargetAndTransition = {
    opacity: 1,
    y: 0,
    scale: 1 * computedScale,
  };
  const exitVariant: TargetAndTransition = {
    opacity: 0,
    y: -40,
    x: 40,
    scale: 1.05 * computedScale,
    position: "absolute",
  };
  const transitionConfig: Transition = { type: "spring", stiffness: 100, damping: 12 };

  // Apply overrides if provided
  const finalInitial = { ...initialVariant, ...(motionConfig?.initial || {}) } as TargetAndTransition;
  const finalAnimate = { ...animateVariant, ...(motionConfig?.animate || {}) } as TargetAndTransition;
  const finalExit = { ...exitVariant, ...(motionConfig?.exit || {}) } as TargetAndTransition;
  const finalTransition = { ...transitionConfig, ...(motionConfig?.transition || {}) } as Transition;

  // Single static image case
  if (images.length === 1) {
    const only = images[0];
    return (
      <div
        className={cn(
          "relative overflow-hidden",
          aspectRatio && "[&>*]:absolute [&>*]:inset-0",
          className
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          src={only.src}
          alt={only.alt || ""}
          role={only.alt ? "img" : undefined}
          aria-label={only.alt || undefined}
          className={cn(
            "w-full h-full object-cover",
            only.className,
            imgClassName,
            aspectRatio && "absolute inset-0"
          )}
          style={only.objectPosition ? { objectPosition: only.objectPosition } : undefined}
          onError={() => setErrorIndices(new Set([0]))}
        />
        {errorIndices.has(0) && (
          <div
            className="flex items-center justify-center w-full h-full text-sm text-neutral-600"
            role="img"
            aria-label={only.alt || "Image unavailable"}
          >
            {only.alt || "Image unavailable"}
          </div>
        )}
        {edgeFadeLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-full"
            style={{
              width: edgeFadeWidth,
              background: `linear-gradient(to right, ${edgeFadeColor}, rgba(0,0,0,0))`,
            }}
          />
        )}
        {edgeFadeRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-full"
            style={{
              width: edgeFadeWidth,
              background: `linear-gradient(to left, ${edgeFadeColor}, rgba(0,0,0,0))`,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspectRatio && "[&>*]:absolute [&>*]:inset-0",
        className
      )}
      aria-live="polite"
      style={aspectRatio ? { aspectRatio } : undefined}
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
      onFocus={pauseOnHover ? () => setIsPaused(true) : undefined}
      onBlur={pauseOnHover ? () => setIsPaused(false) : undefined}
    >
      <AnimatePresence
        mode="popLayout"
        onExitComplete={() => {
          setIsAnimating(false);
        }}
      >
        {!errorIndices.has(currentIndex) ? (
          <motion.img
            key={currentImage.src + currentIndex}
            src={currentImage.src}
            alt={currentImage.alt || ""}
            role={currentImage.alt ? "img" : undefined}
            aria-label={currentImage.alt || undefined}
            className={cn(
              "w-full h-full object-cover",
              currentImage.className,
              imgClassName,
              aspectRatio && "absolute inset-0"
            )}
            style={currentImage.objectPosition ? { objectPosition: currentImage.objectPosition } : undefined}
            onError={() =>
              setErrorIndices((prev) => new Set(prev).add(currentIndex))
            }
            initial={finalInitial}
            animate={finalAnimate}
            exit={finalExit}
            transition={finalTransition}
            draggable={false}
          />
        ) : (
          <motion.div
            key={"error" + currentIndex}
            className={cn(
              "flex items-center justify-center w-full h-full text-sm text-neutral-600",
              aspectRatio && "absolute inset-0"
            )}
            initial={finalInitial}
            animate={finalAnimate}
            exit={finalExit}
            transition={finalTransition}
            role="img"
            aria-label={currentImage.alt || "Image unavailable"}
          >
            {currentImage.alt || "Image unavailable"}
          </motion.div>
        )}
      </AnimatePresence>
      {edgeFadeLeft && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-full"
          style={{
            width: edgeFadeWidth,
            background: ``,
          }}
        />
      )}
      {edgeFadeRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full"
          style={{
            width: edgeFadeWidth,
            background: `linear-gradient(to left, ${edgeFadeColor}, rgba(0,0,0,0))`,
          }}
        />
      )}
    </div>
  );
};
