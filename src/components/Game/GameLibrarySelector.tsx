/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { ExternalGame, gameLibrary } from '../../lib/gameLibrary';

interface GameLibrarySelectorProps {
  onGameSelect: (game: ExternalGame) => void;
  onClose: () => void;
  gameConfig: any;
}

export default function GameLibrarySelector({ 
  onGameSelect, 
  onClose, 
  gameConfig 
}: GameLibrarySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<ExternalGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<ExternalGame[]>([]);

  useEffect(() => {
    // Load available games
    const availableGames = gameLibrary.getAvailableGames();
    setGames(availableGames);
    setFilteredGames(availableGames);
  }, []);

  useEffect(() => {
    // Filter games based on category and search
    let filtered = games;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(game => game.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = gameLibrary.searchGames(searchQuery);
    }

    setFilteredGames(filtered);
  }, [selectedCategory, searchQuery, games]);

  const categories = [
    { id: 'all', name: 'All Games', icon: '🎮' },
    { id: 'arcade', name: 'Arcade', icon: '🕹️' },
    { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
    { id: 'action', name: 'Action', icon: '⚡' },
    { id: 'casual', name: 'Casual', icon: '🎯' },
    { id: 'retro', name: 'Retro', icon: '👾' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4ecdc4';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'arcade': return '🕹️';
      case 'puzzle': return '🧩';
      case 'action': return '⚡';
      case 'casual': return '🎯';
      case 'retro': return '👾';
      default: return '🎮';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '20px',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🎮 Game Library
            <span style={{
              fontSize: '14px',
              background: '#4ecdc4',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              {filteredGames.length} games
            </span>
          </h1>
          
          <button
            onClick={onClose}
            style={{
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 15px',
              border: '2px solid #ddd',
              borderRadius: '25px',
              fontSize: '16px',
              outline: 'none'
            }}
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Games Grid */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto'
      }}>
        {filteredGames.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'white',
            fontSize: '18px',
            marginTop: '50px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎮</div>
            <p>No games found matching your criteria</p>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => onGameSelect(game)}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = '#4ecdc4';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Game Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h3 style={{
                      margin: '0 0 5px 0',
                      fontSize: '18px',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {getCategoryIcon(game.category)} {game.name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        background: getDifficultyColor(game.difficulty),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {game.difficulty}
                      </span>
                      <span style={{
                        background: '#f8f9fa',
                        color: '#666',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        ~{game.estimatedPlayTime}min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game Description */}
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  marginBottom: '15px'
                }}>
                  {game.description}
                </p>

                {/* Controls */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    Controls:
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#333',
                    fontWeight: 'bold'
                  }}>
                    {game.controls}
                  </div>
                </div>

                {/* Compatibility Icons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {game.mobileCompatible && (
                      <span title="Mobile Compatible">📱</span>
                    )}
                    {game.touchControls && (
                      <span title="Touch Controls">👆</span>
                    )}
                    {game.keyboardControls && (
                      <span title="Keyboard Controls">⌨️</span>
                    )}
                    {game.mouseControls && (
                      <span title="Mouse Controls">🖱️</span>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGameSelect(game);
                    }}
                    style={{
                      background: '#4ecdc4',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Play Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
