import React, { useState, useRef, useEffect, useCallback } from 'react';

type ButtonPosition = 'left' | 'right';

interface FloatingButtonProps {
    onClick?: () => void;
    url?: string;
    position?: ButtonPosition;
    longPressDuration?: number;
    initialAppearDelay?: number; // added
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
                                                           onClick,
                                                           url,
                                                           position = 'right',
                                                           longPressDuration = 500,
                                                           initialAppearDelay = 200, // added
                                                       }) => {
    // Initialize dismissal state synchronously to avoid flash on first paint
    const [isDismissed, setIsDismissed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('floatingButtonDismissed') === 'true';
        }
        return false;
    });
    const [showDismissButton, setShowDismissButton] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // controls fade-in after delay

    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // adjusted type
    // Track whether the current interaction was a long press so we can suppress the automatic click.
    const longPressActivatedRef = useRef(false);

    // Default click handler - opens URL in new tab
    const handleDefaultClick = useCallback(() => {
        // If the long press was activated, suppress this click (triggered by pointer release)
        if (longPressActivatedRef.current) {
            longPressActivatedRef.current = false; // reset for future normal clicks
            return; // Do not navigate or invoke onClick when dismiss overlay just appeared
        }
        if (onClick) {
            onClick();
        } else if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }, [onClick, url]);

    // Handle long press start
    const handlePressStart = useCallback(() => {
        longPressTimerRef.current = setTimeout(() => {
            setShowDismissButton(true);
            longPressActivatedRef.current = true; // mark that long press was triggered
        }, longPressDuration);
    }, [longPressDuration]);

    // Handle press end
    const handlePressEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    // Handle dismiss click
    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDismissed(true);
        sessionStorage.setItem('floatingButtonDismissed', 'true');
    }, []);

    // Mouse events for main button
    const handleMouseDown = () => {
        handlePressStart();
    };

    const handleMouseUp = () => {
        handlePressEnd();
    };

    const handleMouseLeave = () => {
        handlePressEnd();
    };

    // Touch events for main button
    const handleTouchStart = () => {
        handlePressStart();
    };

    const handleTouchEnd = () => {
        handlePressEnd();
    };

    // Remove separate mount effect for dismissal (handled in initializer). Add visibility effect.
    useEffect(() => {
        if (isDismissed) return; // do not show if dismissed
        const t = setTimeout(() => setIsVisible(true), initialAppearDelay);
        return () => clearTimeout(t);
    }, [isDismissed, initialAppearDelay]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    if (isDismissed) {
        return null;
    }

    const positionClasses = position === 'left' ? 'bottom-5 left-5' : 'bottom-5 right-5';

    return (
        <div className={`fixed ${positionClasses} z-[1000] ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}> {/* added fade-in */}
            <div className="relative">
                {/* Main Button */}
                <button
                    className="
            w-14 h-14 rounded-full border-none text-white text-2xl
            cursor-pointer flex items-center justify-center
            select-none
            transition-all duration-200
            shadow-lg hover:shadow-xl
            bg-gradient-to-br from-green-500 to-emerald-700
            hover:scale-105 active:scale-95
          "
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onClick={handleDefaultClick}
                    type="button"
                    aria-label="Open WhatsApp chat"
                >
                    <span className="flex items-center justify-center">
                        <img
                            src="/WhatsApp.svg"
                            alt="WhatsApp icon"
                            className="w-7 h-7"
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    </span>
                </button>

                {/* Dismiss Button Overlay */}
                {showDismissButton && (
                    <button
                        className="
              absolute -top-2 -right-2
              w-7 h-7 rounded-full
              bg-red-500 hover:bg-red-600
              text-white font-bold text-sm
              cursor-pointer flex items-center justify-center
              shadow-lg hover:shadow-xl
              transition-all duration-200
              hover:scale-110 active:scale-95
              z-10
              animate-in fade-in zoom-in duration-200
            "
                        onClick={handleDismiss}
                        type="button"
                        aria-label="Dismiss floating button"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default FloatingButton;

