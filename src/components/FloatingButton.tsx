import React, { useState, useRef, useEffect, useCallback } from 'react';

type ButtonPosition = 'left' | 'right';

interface FloatingButtonProps {
    onClick?: () => void;
    url?: string;
    position?: ButtonPosition;
    longPressDuration?: number;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
                                                           onClick,
                                                           url,
                                                           position = 'right',
                                                           longPressDuration = 500,
                                                       }) => {
    const [isDismissed, setIsDismissed] = useState(false);
    const [showDismissButton, setShowDismissButton] = useState(false);

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Default click handler - opens URL in new tab
    const handleDefaultClick = useCallback(() => {
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

    // Check session storage on mount
    useEffect(() => {
        const dismissed = sessionStorage.getItem('floatingButtonDismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, []);

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
        <div className={`fixed ${positionClasses} z-[1000]`}>
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
                >
                    <span className="flex items-center justify-center">
                        <img
                            src="/WhatsApp.svg"
                            alt="icon"
                            className="w-7 h-7"
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
                        aria-label="Dismiss button"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default FloatingButton;