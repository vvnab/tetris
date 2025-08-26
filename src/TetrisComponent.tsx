import React, { useCallback, useRef, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { createTetrisStore, defaultConfig } from './store';
import type { GameState } from './game';

const TetrisComponent: React.FC = () => {
  const storeRef = useRef(createTetrisStore(defaultConfig));
  
  const state = useSyncExternalStore<GameState>(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot
  );

  useEffect(() => {
    storeRef.current.startGameLoop();
    return () => storeRef.current.destroy();
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (state.gameOver) return;

      switch (event.code) {
        case 'ArrowLeft':
          event.preventDefault();
          storeRef.current.moveLeft();
          break;
        case 'ArrowRight':
          event.preventDefault();
          storeRef.current.moveRight();
          break;
        case 'ArrowDown':
          event.preventDefault();
          storeRef.current.moveDown();
          break;
        case 'ArrowUp':
          event.preventDefault();
          storeRef.current.rotate();
          break;
        case 'Space':
          event.preventDefault();
          storeRef.current.hardDrop();
          break;
        case 'KeyP':
          event.preventDefault();
          storeRef.current.togglePause();
          break;
        case 'KeyR':
          event.preventDefault();
          storeRef.current.restart();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.gameOver]);

  const handleRestart = useCallback(() => {
    storeRef.current.restart();
  }, []);

  const handlePause = useCallback(() => {
    storeRef.current.togglePause();
  }, []);

  const renderBoard = () => {
    const board = storeRef.current.getBoardWithPiece();
    return (
      <div className="grid grid-rows-20 grid-cols-10 border-2 border-gray-600">
        {board.flat().map((cell, index) => (
          <div
            key={index}
            className={`w-10 h-10 border border-gray-800 ${
              cell === 0 ? 'bg-black' : 
              cell === 1 ? 'bg-red-500' : 
              'bg-green-400'
            }`}
          />
        ))}
      </div>
    );
  };

  if (state.gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl">Score: {state.score}</p>
        <p className="text-xl">Level: {state.level}</p>
        <p className="text-xl mb-6">Lines: {state.linesCleared}</p>
        <button
          onClick={handleRestart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
        >
          Restart
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-bold">Tetris</div>
          <div className="flex gap-4">
            <button
              onClick={handlePause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            >
              {state.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleRestart}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Game Info</h3>
            <p>Score: {state.score}</p>
            <p>Level: {state.level}</p>
            <p>Lines: {state.linesCleared}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Controls</h3>
            <p>← → : Move</p>
            <p>↑ : Rotate</p>
            <p>↓ : Soft drop</p>
            <p>Space : Hard drop</p>
            <p>P : Pause</p>
            <p>R : Restart</p>
          </div>
        </div>

        <div className="flex justify-center">
          {renderBoard()}
        </div>
      </div>
    </div>
  );
};

export default TetrisComponent;