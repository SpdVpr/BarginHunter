import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenWidth: 1920,
        screenHeight: 1080,
        orientation: 'landscape'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const orientation = width > height ? 'landscape' : 'portrait';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenWidth: width,
      screenHeight: height,
      orientation
    };
  });

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const orientation = width > height ? 'landscape' : 'portrait';

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation
      });
    };

    // Update on resize and orientation change
    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);

    // Initial update
    updateDetection();

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return detection;
};

// Utility functions for mobile optimization
export const getMobileOptimizedCanvasSize = (detection: MobileDetectionResult) => {
  if (detection.isMobile) {
    return {
      width: Math.min(detection.screenWidth, 500),
      height: Math.min(detection.screenHeight, 600)
    };
  }
  
  if (detection.isTablet) {
    return {
      width: Math.min(detection.screenWidth * 0.8, 600),
      height: Math.min(detection.screenHeight * 0.8, 700)
    };
  }

  return {
    width: 600,
    height: 600
  };
};

export const getTouchSensitivity = (detection: MobileDetectionResult) => {
  if (detection.isMobile) {
    return {
      minSwipeDistance: 20,
      tapTimeout: 200,
      longPressTimeout: 500
    };
  }

  return {
    minSwipeDistance: 30,
    tapTimeout: 150,
    longPressTimeout: 400
  };
};
