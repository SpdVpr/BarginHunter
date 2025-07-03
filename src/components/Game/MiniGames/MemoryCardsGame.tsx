/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';

interface MemoryCardsGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_VALUES = ['🎯', '🎮', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];

export default function MemoryCardsGame({ onGameEnd, onScoreUpdate }: MemoryCardsGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Timer
  useEffect(() => {
    if (!gameStarted) return;
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, startTime]);

  const initializeGame = () => {
    // Create pairs of cards
    const cardPairs = [...CARD_VALUES, ...CARD_VALUES];
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setScore(0);
    setGameStarted(true);
    setStartTime(Date.now());
    setTimeElapsed(0);
  };

  const handleCardClick = useCallback((cardId: number) => {
    if (flippedCards.length >= 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId]?.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Update cards to show flipped state
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      // Check for match after a short delay
      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards[firstId];
        const secondCard = cards[secondId];

        if (firstCard.value === secondCard.value) {
          // Match found
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true }
              : card
          ));
          
          const newMatchedPairs = matchedPairs + 1;
          setMatchedPairs(newMatchedPairs);
          
          // Calculate score (bonus for speed and fewer moves)
          const timeBonus = Math.max(0, 120 - timeElapsed) * 5;
          const moveBonus = Math.max(0, 20 - moves) * 10;
          const newScore = newMatchedPairs * 100 + timeBonus + moveBonus;
          setScore(newScore);
          onScoreUpdate(newScore);

          // Check if game is complete
          if (newMatchedPairs === CARD_VALUES.length) {
            setTimeout(() => {
              onGameEnd(newScore);
            }, 500);
          }
        } else {
          // No match - flip cards back
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isFlipped: false }
              : card
          ));
        }
        
        setFlippedCards([]);
      }, 1000);
    }
  }, [flippedCards, cards, matchedPairs, moves, timeElapsed, onScoreUpdate, onGameEnd]);

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
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        <div>🧠 Memory Cards</div>
        <div>Score: {score}</div>
        <div>Moves: {moves}</div>
        <div>Time: {timeElapsed}s</div>
        <div>Pairs: {matchedPairs}/{CARD_VALUES.length}</div>
      </div>

      {/* Game Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        maxWidth: '400px',
        width: '100%'
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            style={{
              width: '80px',
              height: '80px',
              background: card.isFlipped || card.isMatched 
                ? 'linear-gradient(45deg, #4ecdc4, #44b3a8)' 
                : 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: card.isMatched ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transform: card.isFlipped || card.isMatched ? 'scale(1.05)' : 'scale(1)',
              opacity: card.isMatched ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!card.isMatched) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!card.isMatched) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              }
            }}
          >
            {card.isFlipped || card.isMatched ? card.value : '❓'}
          </div>
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
        maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 How to Play
        </div>
        <div>
          Click cards to flip them and find matching pairs. 
          Complete faster with fewer moves for bonus points!
        </div>
      </div>
    </div>
  );
}
