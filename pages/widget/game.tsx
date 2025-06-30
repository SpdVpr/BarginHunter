import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Game from '../../src/components/Game/Game';

interface GameResult {
  score: number;
  discountEarned: number;
  discountCode?: string;
  gameData: any;
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

  // Auto-resize iframe functionality
  useEffect(() => {
    const resizeIframe = () => {
      if (window.parent && window.parent !== window) {
        const body = document.body;
        const html = document.documentElement;

        // Get the actual content height
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );

        // Send resize message to parent
        window.parent.postMessage({
          type: 'IFRAME_RESIZE',
          height: height + 20, // Add some padding
          width: '100%'
        }, '*');
      }
    };

    // Initial resize
    resizeIframe();

    // Resize on window resize
    window.addEventListener('resize', resizeIframe);

    // Resize when content changes (using MutationObserver)
    const observer = new MutationObserver(resizeIframe);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeIframe);
      observer.disconnect();
    };
  }, []);

  // Resize when loading state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.parent && window.parent !== window) {
        const body = document.body;
        const html = document.documentElement;
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );

        window.parent.postMessage({
          type: 'IFRAME_RESIZE',
          height: height + 20,
          width: '100%'
        }, '*');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoading, shopDomain]);

  const checkInstallation = async (shop: string) => {
    try {
      // Check if app is properly installed with correct scopes
      const response = await fetch(`/api/debug/installation-flow?shop=${shop}`);
      const data = await response.json();

      if (!data.success || !data.debug.installationComplete) {
        console.log('🚨 App not properly installed, redirecting to install...');
        // Redirect to proper installation
        window.top!.location.href = `/api/auth/install?shop=${shop}`;
        return;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Installation check failed:', error);
      // If check fails, try to install anyway
      window.top!.location.href = `/api/auth/install?shop=${shop}`;
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
    // Send close message to parent window
    if (window.parent) {
      window.parent.postMessage({
        type: 'BARGAIN_HUNTER_CLOSE'
      }, '*');
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
            min-height: 100vh;
            overflow-x: hidden;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          #__next {
            width: 100%;
            min-height: 100vh;
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        padding: '10px',
        margin: '0',
        boxSizing: 'border-box'
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
