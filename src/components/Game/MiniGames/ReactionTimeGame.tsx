/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';

interface ReactionTimeGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

type GameState = 'waiting' | 'ready' | 'go' | 'clicked' | 'tooEarly';

export default function ReactionTimeGame({ onGameEnd, onScoreUpdate }: ReactionTimeGameProps) {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [round, setRound] = useState(1);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const MAX_ROUNDS = 5;

  // Start new round
  const startNewRound = useCallback(() => {
    setGameState('ready');
    setMessage('Get ready...');
    setCurrentReactionTime(null);
    
    // Random delay between 1-4 seconds
    const delay = 1000 + Math.random() * 3000;
    
    setTimeout(() => {
      setGameState('go');
      setMessage('CLICK NOW!');
      setStartTime(Date.now());
    }, delay);
  }, []);

  // Handle click
  const handleClick = useCallback(() => {
    if (gameState === 'ready') {
      // Clicked too early
      setGameState('tooEarly');
      setMessage('Too early! Wait for green.');
      setTimeout(() => {
        startNewRound();
      }, 2000);
      return;
    }

    if (gameState === 'go') {
      // Good click - measure reaction time
      const reactionTime = Date.now() - startTime;
      setCurrentReactionTime(reactionTime);
      setGameState('clicked');
      
      const newReactionTimes = [...reactionTimes, reactionTime];
      setReactionTimes(newReactionTimes);
      
      // Calculate score (lower reaction time = higher score)
      const roundScore = Math.max(0, 1000 - reactionTime);
      const newScore = score + roundScore;
      setScore(newScore);
      onScoreUpdate(newScore);
      
      setMessage(`${reactionTime}ms - Great!`);
      
      if (round >= MAX_ROUNDS) {
        // Game complete
        setTimeout(() => {
          onGameEnd(newScore);
        }, 2000);
      } else {
        // Next round
        setTimeout(() => {
          setRound(prev => prev + 1);
          startNewRound();
        }, 2000);
      }
    }
  }, [gameState, startTime, reactionTimes, score, round, onScoreUpdate, onGameEnd, startNewRound]);

  // Start first round
  useEffect(() => {
    if (round === 1 && gameState === 'waiting') {
      setTimeout(() => {
        startNewRound();
      }, 1000);
    }
  }, [round, gameState, startNewRound]);

  const averageReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const getBackgroundColor = () => {
    switch (gameState) {
      case 'ready': return '#ff6b6b'; // Red
      case 'go': return '#4ecdc4'; // Green
      case 'tooEarly': return '#fd79a8'; // Pink
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const getInstruction = () => {
    if (round > MAX_ROUNDS) return 'Game Complete!';
    if (gameState === 'waiting') return 'Get ready for reaction test...';
    if (gameState === 'ready') return 'Wait for GREEN...';
    if (gameState === 'go') return 'CLICK NOW!';
    if (gameState === 'tooEarly') return 'Too early! Wait for green.';
    if (gameState === 'clicked') return `Round ${round} complete!`;
    return '';
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        background: getBackgroundColor(),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        cursor: gameState === 'ready' || gameState === 'go' ? 'pointer' : 'default',
        transition: 'background 0.3s ease'
      }}
    >
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '40px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        <div>⚡ Reaction Time</div>
        <div>Score: {score}</div>
        <div>Round: {round}/{MAX_ROUNDS}</div>
        {averageReactionTime > 0 && (
          <div>Avg: {averageReactionTime}ms</div>
        )}
      </div>

      {/* Main Game Area */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '40px',
        borderRadius: '20px',
        textAlign: 'center',
        minWidth: '300px',
        marginBottom: '40px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '20px'
        }}>
          {getInstruction()}
        </div>
        
        {message && (
          <div style={{
            fontSize: '18px',
            color: gameState === 'tooEarly' ? '#ff6b6b' : '#4ecdc4',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}

        {currentReactionTime && (
          <div style={{
            fontSize: '32px',
            color: '#333',
            fontWeight: 'bold',
            marginTop: '15px'
          }}>
            {currentReactionTime}ms
          </div>
        )}
      </div>

      {/* Reaction Times History */}
      {reactionTimes.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '15px 25px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '10px'
          }}>
            Your Times:
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            fontSize: '14px',
            color: '#666'
          }}>
            {reactionTimes.map((time, index) => (
              <span key={index}>
                {time}ms
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 25px',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#333',
        fontSize: '14px',
        maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 How to Play
        </div>
        <div>
          Wait for the screen to turn GREEN, then click as fast as possible! 
          Don't click on red or you'll have to restart the round.
        </div>
      </div>
    </div>
  );
}
