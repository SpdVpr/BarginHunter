import { useState } from 'react';
import Game from '../src/components/Game/Game';

interface GameResult {
  score: number;
  discountEarned: number;
  discountCode?: string;
  gameData: any;
}

export default function Demo() {
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showGame, setShowGame] = useState(false);

  const handleGameComplete = (result: GameResult) => {
    setGameResult(result);
    setShowGame(false);
  };

  const handleStartGame = () => {
    setGameResult(null);
    setShowGame(true);
  };

  const handleClose = () => {
    setShowGame(false);
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        🎮 Bargain Hunter Demo
      </h1>
      
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Experience the gamified discount system that will engage your customers and boost conversions.
      </p>

      {!showGame && !gameResult && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleStartGame}
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🚀 Start Demo Game
          </button>
          
          <div style={{ 
            marginTop: '40px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>How to Play:</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
              <li><strong>Desktop:</strong> Click mouse or press SPACE to jump</li>
              <li><strong>Mobile:</strong> Tap anywhere on the game to jump</li>
              <li><strong>Goal:</strong> Collect discount tags and avoid obstacles</li>
              <li><strong>Scoring:</strong> Higher scores earn bigger discounts!</li>
            </ul>
          </div>

          <div style={{ 
            marginTop: '20px',
            padding: '20px',
            background: '#e8f5e8',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Discount Tiers:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'white', borderRadius: '4px', textAlign: 'center' }}>
                <strong>150+ points</strong><br />5% OFF
              </div>
              <div style={{ padding: '8px', background: 'white', borderRadius: '4px', textAlign: 'center' }}>
                <strong>300+ points</strong><br />10% OFF
              </div>
              <div style={{ padding: '8px', background: 'white', borderRadius: '4px', textAlign: 'center' }}>
                <strong>500+ points</strong><br />15% OFF
              </div>
              <div style={{ padding: '8px', background: 'white', borderRadius: '4px', textAlign: 'center' }}>
                <strong>750+ points</strong><br />20% OFF
              </div>
              <div style={{ padding: '8px', background: 'white', borderRadius: '4px', textAlign: 'center' }}>
                <strong>1000+ points</strong><br />25% OFF
              </div>
            </div>
          </div>
        </div>
      )}

      {showGame && (
        <div style={{ marginTop: '20px' }}>
          <Game
            shopDomain="demo-shop.myshopify.com"
            onGameComplete={handleGameComplete}
            onClose={handleClose}
          />
        </div>
      )}

      {gameResult && (
        <div style={{ 
          textAlign: 'center',
          padding: '30px',
          background: '#f8f9fa',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>🎉 Game Complete!</h2>
          
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#feca57',
            marginBottom: '10px'
          }}>
            {gameResult.score}
          </div>
          
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
            Final Score
          </p>

          {gameResult.discountEarned > 0 ? (
            <div>
              <div style={{ 
                fontSize: '24px', 
                color: '#4ecdc4',
                marginBottom: '15px'
              }}>
                🎉 You earned {gameResult.discountEarned}% OFF!
              </div>
              
              {gameResult.discountCode && (
                <div style={{
                  background: 'white',
                  color: '#333',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  border: '2px dashed #4ecdc4',
                  display: 'inline-block'
                }}>
                  {gameResult.discountCode}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#666', marginBottom: '20px' }}>
              <p>No discount earned this time.</p>
              <p>Score 150+ points to earn your first discount!</p>
            </div>
          )}

          <button
            onClick={handleStartGame}
            style={{
              background: '#4ecdc4',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🎮 Play Again
          </button>

          <button
            onClick={() => setGameResult(null)}
            style={{
              background: 'transparent',
              color: '#666',
              border: '2px solid #ddd',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← Back to Start
          </button>
        </div>
      )}

      <div style={{ 
        marginTop: '40px',
        padding: '20px',
        background: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 For Merchants:</h3>
        <p style={{ margin: 0, color: '#856404' }}>
          This demo shows how Bargain Hunter can engage your customers with a fun mini-game 
          while driving sales through earned discounts. The game is fully customizable and 
          can be embedded on any page of your Shopify store.
        </p>
      </div>
    </div>
  );
}

// This page should not use the main app layout
Demo.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};
