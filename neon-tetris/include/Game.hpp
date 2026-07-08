#pragma once

#include "Board.hpp"
#include "Common.hpp"
#include "Input.hpp"
#include "Renderer.hpp"
#include "Tetromino.hpp"
#include "Timer.hpp"
#include <vector>

class Game {
public:
  Game();

  // Runs the main game loop
  void run();

private:
  // Core game entities
  Board board;
  Tetromino activePiece;
  Tetromino nextPiece;

  // Peripherals
  Input input;
  Timer timer;
  Renderer renderer;

  // Game stats
  int score;
  int level;
  int linesCleared;
  bool isPaused;
  bool isGameOver;
  bool shouldQuit;

  // Timing and gravity parameters
  double gravityAccumulator;
  double getTickInterval() const; // Dynamic drop interval based on level

  // Standard 7-Bag Randomizer
  std::vector<TetrominoShape> pieceBag;
  void refillPieceBag();
  TetrominoShape getRandomShape();

  // Game flow operations
  void spawnNextPiece();
  void processInput();
  void updatePhysics(double deltaTime);
  void render();
  void addScore(int lines);
  void performHardDrop();
  void resetGame();
};
