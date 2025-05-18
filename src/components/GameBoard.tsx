import React from 'react';

/**
 * GameBoard component for Kanadle5 game
 * Displays a 8x5 grid for the word guessing game
 */
const GameBoard: React.FC = () => {
  // 6行 x 5列のグリッド構造を作成
  const rows = 8;
  const cols = 5;

  // 空のグリッドを生成
  const grid = Array(rows).fill(null).map((_, rowIndex) => (
    <div key={`row-${rowIndex}`} className="flex mb-2">
      {Array(cols).fill(null).map((_, colIndex) => (
        <div
          key={`cell-${rowIndex}-${colIndex}`}
          className="w-12 h-12 border-2 border-gray-300 rounded mx-1 flex items-center justify-center text-xl font-bold"
        >
          {/* セルの内容はここに表示されます */}
        </div>
      ))}
    </div>
  ));

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">Kanadle5</h2>
      <div className="game-board">
        {grid}
      </div>
    </div>
  );
};

export default GameBoard;
