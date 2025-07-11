import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Game from '../../src/components/Game/Game';

interface GameResult {
  score: number;
  discountEarned: number;
  discountCode?: string;
  gameData: any;
  isPlayLimitReached?: boolean;
  playLimitInfo?: {
    playsUsed: number;
    maxPlays: number;
    nextResetTime?: string;
    resetHours?: number;
  };
}

export default function WidgetGame() {
  const router = useRouter();
  const [shopDomain, setShopDomain] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get shop domain from URL parameters
    const shop = router.query.shop as string;
    if (shop) {
      setShopDomain(shop);
      // Check if app is properly installed before loading game
      checkInstallation(shop);
    }
  }, [router.query]);

  // Auto-resize iframe functionality with standardized game sizes
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const resizeIframe = () => {
      if (window.parent && window.parent !== window) {
        // Clear previous timeout to debounce
        clearTimeout(resizeTimeout);

        resizeTimeout = setTimeout(() => {
          // More reliable mobile detection for iframe context
          const isMobile = window.innerWidth <= 768 ||
                           window.screen?.width <= 768 ||
                           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          // Use standardized heights based on game canvas sizes + UI elements
          const standardHeight = isMobile ?
            480 : // Mobile: reduced by 20% for better usability (600 * 0.8)
            720;  // Desktop: fullscreen intro/game

          // Send resize message to parent with standardized height
          window.parent.postMessage({
            type: 'IFRAME_RESIZE',
            height: standardHeight,
            width: '100%'
          }, '*');
        }, 50); // 50ms debounce
      }
    };

    // Initial resize with delay to ensure DOM is ready
    setTimeout(resizeIframe, 100);

    // Resize on window resize
    window.addEventListener('resize', resizeIframe);

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', resizeIframe);
    };
  }, []);

  // Resize when loading state changes with standardized sizes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.parent && window.parent !== window) {
        // More reliable mobile detection for iframe context
        const isMobile = window.innerWidth <= 768 ||
                         window.screen?.width <= 768 ||
                         /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Use standardized heights based on game canvas sizes + UI elements
        const standardHeight = isMobile ?
          480 : // Mobile: reduced by 20% for better usability (600 * 0.8)
          720;  // Desktop: fullscreen intro/game

        window.parent.postMessage({
          type: 'IFRAME_RESIZE',
          height: standardHeight,
          width: '100%'
        }, '*');
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isLoading, shopDomain]);

  const checkInstallation = async (shop: string) => {
    try {
      // Check if app is properly installed with correct scopes
      const response = await fetch(`/api/check-installation?shop=${shop}`);
      const data = await response.json();

      console.log('🎮 Widget game installation check:', data);

      if (!data.success || !data.installed) {
        console.log('🚨 App not properly installed, redirecting to install...');
        console.log('🚨 Reason:', data.reason);
        // Redirect to proper installation
        window.top!.location.href = `/api/auth/install?shop=${shop}`;
        return;
      }

      console.log('✅ App is properly installed, loading game...');
      setIsLoading(false);
    } catch (error) {
      console.error('Installation check failed:', error);
      // If check fails, assume it's installed and continue
      console.log('⚠️ Installation check failed, continuing anyway...');
      setIsLoading(false);
    }
  };

  const handleGameComplete = (result: GameResult) => {
    // Send message to parent window
    if (window.parent) {
      window.parent.postMessage({
        type: 'BARGAIN_HUNTER_DISCOUNT_EARNED',
        discount: {
          code: result.discountCode,
          percentage: result.discountEarned,
          score: result.score
        }
      }, '*');
    }
  };

  const handleClose = () => {
    console.log('🎮 handleClose called in widget/game.tsx');
    console.log('🎮 window.parent:', window.parent);
    console.log('🎮 window.parent === window:', window.parent === window);

    // Send close message to parent window
    if (window.parent && window.parent !== window) {
      console.log('🎮 Sending BARGAIN_HUNTER_CLOSE message to parent');
      window.parent.postMessage({
        type: 'BARGAIN_HUNTER_CLOSE'
      }, '*');
      console.log('🎮 Message sent successfully');
    } else {
      console.log('🎮 No parent window found, trying to close current window');
      // Fallback: try to close current window or redirect
      try {
        window.close();
      } catch (e) {
        console.log('🎮 Cannot close window, trying history.back()');
        window.history.back();
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div>
          <div className="loading-spinner"></div>
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Loading Bargain Hunter...
          </p>
        </div>
      </div>
    );
  }

  if (!shopDomain) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center'
      }}>
        <div>
          <h3 style={{ color: '#ff6b6b' }}>Error</h3>
          <p>Shop domain is required to load the game.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: auto;
            min-height: auto;
            overflow-x: hidden;
            overflow-y: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
          }
          #__next {
            width: 100%;
            height: auto;
            min-height: auto;
            display: flex;
            flex-direction: column;
          }

          /* Ensure iframe content is always visible */
          @media (max-width: 768px) {
            html, body {
              font-size: 14px;
            }
          }

          @media (max-width: 480px) {
            html, body {
              font-size: 13px;
            }
          }
        `}</style>
      </Head>
      <div style={{
        width: '100%',
        height: 'auto',
        minHeight: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <Game
          shopDomain={shopDomain}
          onGameComplete={handleGameComplete}
          onClose={handleClose}
        />
      </div>
    </>
  );
}

// This page should not use the main app layout
WidgetGame.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};
