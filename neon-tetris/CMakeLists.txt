cmake_minimum_required(VERSION 3.12)
project(neon-tetris LANGUAGES CXX)

# Force standard C++17 compilation
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Modern C++ warning flags as errors (helps capture bugs early)
if(MSVC)
    add_compile_options(/W4 /WX)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Werror)
endif()

# CRITICAL: Automatically generate compile_commands.json inside the build directory.
# This serves as the source of truth for the IDE's Language Server.
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Declare target executable and list all implementation sources
add_executable(neon-tetris
    src/Main.cpp
    src/Board.cpp
    src/Game.cpp
    src/Input.cpp
    src/Timer.cpp
    src/Renderer.cpp
    src/Tetromino.cpp
)

# Tell the target where to find compiler headers.
# This abstracts the include search path dynamically.
target_include_directories(neon-tetris PRIVATE include)
