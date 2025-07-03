/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';

interface ColorMatchGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface ColorChallenge {
  targetColor: string;
  colorName: string;
  options: string[];
}

const COLORS = [
  { name: 'Red', value: '#ff6b6b' },
  { name: 'Blue', value: '#4ecdc4' },
  { name: 'Green', value: '#45b7d1' },
  { name: 'Yellow', value: '#f9ca24' },
  { name: 'Purple', value: '#6c5ce7' },
  { name: 'Orange', value: '#fd79a8' },
  { name: 'Pink', value: '#fdcb6e' },
  { name: 'Cyan', value: '#00b894' }
];

export default function ColorMatchGame({ onGameEnd, onScoreUpdate }: ColorMatchGameProps) {
  const [currentChallenge, setCurrentChallenge] = useState<ColorChallenge | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string>('');

  // Game timer
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onGameEnd(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, score, onGameEnd]);

  // Start game
  useEffect(() => {
    if (!gameStarted) {
      setGameStarted(true);
      generateNewChallenge();
    }
  }, [gameStarted]);

  const generateNewChallenge = useCallback(() => {
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const wrongColors = COLORS.filter(c => c.name !== targetColor.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const allOptions = [targetColor, ...wrongColors]
      .sort(() => Math.random() - 0.5);

    setCurrentChallenge({
      targetColor: targetColor.value,
      colorName: targetColor.name,
      options: allOptions.map(c => c.value)
    });
    setFeedback('');
  }, []);

  const handleColorClick = useCallback((selectedColor: string) => {
    if (!currentChallenge) return;

    const isCorrect = selectedColor === currentChallenge.targetColor;
    
    if (isCorrect) {
      const newStreak = streak + 1;
      const basePoints = 100;
      const streakBonus = newStreak * 10;
      const timeBonus = timeLeft * 2;
      const roundBonus = round * 5;
      
      const points = basePoints + streakBonus + timeBonus + roundBonus;
      const newScore = score + points;
      
      setScore(newScore);
      setStreak(newStreak);
      setRound(prev => prev + 1);
      setFeedback(`+${points} points! 🎉`);
      onScoreUpdate(newScore);
      
      // Generate new challenge after short delay
      setTimeout(() => {
        generateNewChallenge();
      }, 800);
    } else {
      setStreak(0);
      setFeedback('Wrong color! 😞');
      
      // Show feedback and continue
      setTimeout(() => {
        generateNewChallenge();
      }, 1000);
    }
  }, [currentChallenge, streak, score, timeLeft, round, onScoreUpdate, generateNewChallenge]);

  if (!currentChallenge) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '30px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        <div>🎨 Color Match</div>
        <div>Score: {score}</div>
        <div>Round: {round}</div>
        <div>Streak: {streak}</div>
        <div style={{ color: timeLeft <= 10 ? '#ff6b6b' : '#333' }}>
          Time: {timeLeft}s
        </div>
      </div>

      {/* Target Color Display */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '15px'
        }}>
          Click the color: <span style={{ color: currentChallenge.targetColor }}>
            {currentChallenge.colorName}
          </span>
        </div>
        <div style={{
          width: '80px',
          height: '80px',
          background: currentChallenge.targetColor,
          borderRadius: '50%',
          margin: '0 auto',
          border: '4px solid white',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }} />
      </div>

      {/* Color Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {currentChallenge.options.map((color, index) => (
          <div
            key={index}
            onClick={() => handleColorClick(color)}
            style={{
              width: '100px',
              height: '100px',
              background: color,
              borderRadius: '15px',
              cursor: 'pointer',
              border: '4px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          />
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '10px 20px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: feedback.includes('Wrong') ? '#ff6b6b' : '#4ecdc4',
          marginBottom: '20px'
        }}>
          {feedback}
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
          Click the color that matches the name shown above. 
          Build streaks for bonus points!
        </div>
      </div>
    </div>
  );
}
