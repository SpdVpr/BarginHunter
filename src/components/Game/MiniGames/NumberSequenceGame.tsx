/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';

interface NumberSequenceGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface NumberButton {
  id: number;
  number: number;
  isClicked: boolean;
  position: { x: number; y: number };
}

export default function NumberSequenceGame({ onGameEnd, onScoreUpdate }: NumberSequenceGameProps) {
  const [numbers, setNumbers] = useState<NumberButton[]>([]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string>('');

  const NUMBERS_PER_LEVEL = 5;

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

  // Generate random positions for numbers
  const generateRandomPosition = useCallback((existingPositions: { x: number; y: number }[]) => {
    let position;
    let attempts = 0;
    
    do {
      position = {
        x: Math.random() * 70 + 10, // 10% to 80% of container width
        y: Math.random() * 60 + 15  // 15% to 75% of container height
      };
      attempts++;
    } while (
      attempts < 50 && 
      existingPositions.some(pos => 
        Math.abs(pos.x - position.x) < 15 || Math.abs(pos.y - position.y) < 15
      )
    );
    
    return position;
  }, []);

  // Generate new level
  const generateLevel = useCallback(() => {
    const newNumbers: NumberButton[] = [];
    const positions: { x: number; y: number }[] = [];
    
    const numbersCount = NUMBERS_PER_LEVEL + Math.floor(level / 3); // Increase difficulty
    
    for (let i = 1; i <= numbersCount; i++) {
      const position = generateRandomPosition(positions);
      positions.push(position);
      
      newNumbers.push({
        id: i,
        number: i,
        isClicked: false,
        position
      });
    }
    
    setNumbers(newNumbers);
    setCurrentNumber(1);
    setFeedback(`Level ${level} - Click numbers 1 to ${numbersCount} in order!`);
  }, [level, generateRandomPosition]);

  // Start game
  useEffect(() => {
    if (!gameStarted) {
      setGameStarted(true);
      generateLevel();
    }
  }, [gameStarted, generateLevel]);

  // Handle number click
  const handleNumberClick = useCallback((clickedNumber: NumberButton) => {
    if (clickedNumber.isClicked) return;
    
    if (clickedNumber.number === currentNumber) {
      // Correct number clicked
      setNumbers(prev => prev.map(num => 
        num.id === clickedNumber.id 
          ? { ...num, isClicked: true }
          : num
      ));
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Calculate points
      const basePoints = 50;
      const speedBonus = Math.max(0, timeLeft * 2);
      const streakBonus = newStreak * 10;
      const levelBonus = level * 20;
      
      const points = basePoints + speedBonus + streakBonus + levelBonus;
      const newScore = score + points;
      setScore(newScore);
      onScoreUpdate(newScore);
      
      setFeedback(`+${points} points! Next: ${currentNumber + 1}`);
      
      // Check if level complete
      if (currentNumber === numbers.length) {
        // Level complete
        setTimeout(() => {
          setLevel(prev => prev + 1);
          generateLevel();
        }, 1000);
      } else {
        setCurrentNumber(prev => prev + 1);
      }
    } else {
      // Wrong number clicked
      setStreak(0);
      setFeedback(`Wrong! Click ${currentNumber} next.`);
      
      // Small penalty
      const penalty = 25;
      setScore(prev => Math.max(0, prev - penalty));
    }
  }, [currentNumber, numbers.length, streak, score, timeLeft, level, onScoreUpdate, generateLevel]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '20px',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333',
        zIndex: 10
      }}>
        <div>🔢 Number Sequence</div>
        <div>Score: {score}</div>
        <div>Level: {level}</div>
        <div>Next: {currentNumber}</div>
        <div>Streak: {streak}</div>
        <div style={{ color: timeLeft <= 10 ? '#ff6b6b' : '#333' }}>
          Time: {timeLeft}s
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '10px 20px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: feedback.includes('Wrong') ? '#ff6b6b' : '#4ecdc4',
          marginBottom: '20px',
          textAlign: 'center',
          zIndex: 10
        }}>
          {feedback}
        </div>
      )}

      {/* Game Area */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '600px',
        position: 'relative',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '15px',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        {numbers.map((numberButton) => (
          <button
            key={numberButton.id}
            onClick={() => handleNumberClick(numberButton)}
            disabled={numberButton.isClicked}
            style={{
              position: 'absolute',
              left: `${numberButton.position.x}%`,
              top: `${numberButton.position.y}%`,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              background: numberButton.isClicked 
                ? 'linear-gradient(45deg, #4ecdc4, #44b3a8)'
                : numberButton.number === currentNumber
                  ? 'linear-gradient(45deg, #f39c12, #e67e22)'
                  : 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: numberButton.isClicked ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transform: numberButton.isClicked ? 'scale(0.8)' : 'scale(1)',
              opacity: numberButton.isClicked ? 0.6 : 1,
              zIndex: numberButton.number === currentNumber ? 5 : 1
            }}
            onMouseOver={(e) => {
              if (!numberButton.isClicked) {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!numberButton.isClicked) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              }
            }}
          >
            {numberButton.number}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#333',
        fontSize: '14px',
        maxWidth: '400px',
        zIndex: 10
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 How to Play
        </div>
        <div>
          Click the numbers in ascending order (1, 2, 3...). 
          The orange number is your next target. Build streaks for bonus points!
        </div>
      </div>
    </div>
  );
}
