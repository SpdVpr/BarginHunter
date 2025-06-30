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
            height: 100%;
            overflow: hidden;
          }
          #__next {
            width: 100%;
            height: 100%;
          }
        `}</style>
      </Head>
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        padding: '0',
        margin: '0',
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
