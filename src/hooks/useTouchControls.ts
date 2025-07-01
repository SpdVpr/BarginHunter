import { useCallback, useRef, useState } from 'react';
import { useMobileDetection, getTouchSensitivity } from './useMobileDetection';

export type TouchGesture = 'tap' | 'swipe-up' | 'swipe-down' | 'swipe-left' | 'swipe-right' | 'long-press';

interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface TouchControlsConfig {
  onTap?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onTouchMove?: (x: number, y: number) => void;
  enableSwipeGestures?: boolean;
  enableTapGestures?: boolean;
  enableLongPress?: boolean;
  enableTouchMove?: boolean;
}

export const useTouchControls = (config: TouchControlsConfig) => {
  const detection = useMobileDetection();
  const sensitivity = getTouchSensitivity(detection);
  
  const touchStartRef = useRef<TouchPosition | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    const touch = e.touches[0];
    const touchPos: TouchPosition = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    touchStartRef.current = touchPos;
    setIsLongPressing(false);

    // Start long press timer if enabled
    if (config.enableLongPress && config.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        config.onLongPress?.();
      }, sensitivity.longPressTimeout);
    }
  }, [config, sensitivity]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle touch move if enabled
    if (config.enableTouchMove && config.onTouchMove) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      config.onTouchMove(x, y);
    }
  }, [config]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!touchStartRef.current) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Don't process other gestures if long press was triggered
    if (isLongPressing) {
      touchStartRef.current = null;
      setIsLongPressing(false);
      return;
    }

    const touch = e.changedTouches[0];
    const endPos = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    const deltaX = endPos.x - touchStartRef.current.x;
    const deltaY = endPos.y - touchStartRef.current.y;
    const deltaTime = endPos.timestamp - touchStartRef.current.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (distance < sensitivity.minSwipeDistance && deltaTime < sensitivity.tapTimeout) {
      // Tap gesture
      if (config.enableTapGestures && config.onTap) {
        config.onTap();
      }
    } else if (config.enableSwipeGestures && distance >= sensitivity.minSwipeDistance) {
      // Swipe gesture - determine direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && config.onSwipeRight) {
          config.onSwipeRight();
        } else if (deltaX < 0 && config.onSwipeLeft) {
          config.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && config.onSwipeDown) {
          config.onSwipeDown();
        } else if (deltaY < 0 && config.onSwipeUp) {
          config.onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
    setIsLongPressing(false);
  }, [config, sensitivity, isLongPressing]);

  // Touch event handlers for canvas elements
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };

  // Utility function to add touch event listeners to DOM elements
  const addTouchListeners = useCallback((element: HTMLElement) => {
    const handleTouchStartDOM = (e: TouchEvent) => {
      const syntheticEvent = {
        preventDefault: () => e.preventDefault(),
        touches: e.touches,
        target: e.target
      } as React.TouchEvent;
      handleTouchStart(syntheticEvent);
    };

    const handleTouchMoveDOM = (e: TouchEvent) => {
      const syntheticEvent = {
        preventDefault: () => e.preventDefault(),
        touches: e.touches,
        target: e.target
      } as React.TouchEvent;
      handleTouchMove(syntheticEvent);
    };

    const handleTouchEndDOM = (e: TouchEvent) => {
      const syntheticEvent = {
        preventDefault: () => e.preventDefault(),
        changedTouches: e.changedTouches,
        target: e.target
      } as React.TouchEvent;
      handleTouchEnd(syntheticEvent);
    };

    element.addEventListener('touchstart', handleTouchStartDOM, { passive: false });
    element.addEventListener('touchmove', handleTouchMoveDOM, { passive: false });
    element.addEventListener('touchend', handleTouchEndDOM, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStartDOM);
      element.removeEventListener('touchmove', handleTouchMoveDOM);
      element.removeEventListener('touchend', handleTouchEndDOM);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    touchHandlers,
    addTouchListeners,
    isMobile: detection.isMobile,
    isTouchDevice: detection.isTouchDevice,
    isLongPressing
  };
};
