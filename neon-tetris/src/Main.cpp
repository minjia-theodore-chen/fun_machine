#include "Game.hpp"
#include <iostream>
#include <exception>

int main() {
    try {
        // Instantiate and run the Tetris game orchestrator.
        // Terminal setup and restoration are handled automatically via RAII inside the object scopes.
        Game game;
        game.run();
    } catch (const std::exception& e) {
        std::cerr << "\nSystem Critical Exception: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "\nSystem Critical: Unknown exception encountered." << std::endl;
        return 1;
    }
    
    std::cout << "\nMatrix connection terminated successfully. Goodbye.\n";
    return 0;
}
