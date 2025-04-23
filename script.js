/* script.js */

// --- DOM Element Selection ---
const holes = document.querySelectorAll('.hole');
const faces = document.querySelectorAll('.face'); // We might not need this directly if using delegation
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const startButton = document.getElementById('startButton');
const finalMessageContainer = document.getElementById('finalMessage');
const finalScoreSpan = document.getElementById('finalScore');
const wittyMessageParagraph = document.getElementById('wittyMessage'); // Get the dedicated paragraph
const gameBoard = document.getElementById('gameBoard'); // Get the game board for event delegation
const bompSound = new Audio('bomp.wav');
const gameEndSound = new Audio('game_end.wav');
const gameEndHighSound = new Audio('game_end_high.wav');

// --- Game Variables ---
let score = 0;
let timeLeft = 30; // Game duration
let gameActive = false;
let timerIntervalId = null;
let popTimeoutId = null; // Stores the ID for the *next scheduled* pop
let lastHoleIndex = -1;

// --- Core Game Functions ---

/**
 * Selects a random hole index, avoiding the last one used.
 * @returns {number} Index of a random hole.
 */
function getRandomHoleIndex() {
    let index;
    do {
        index = Math.floor(Math.random() * holes.length);
    } while (index === lastHoleIndex); // Keep trying if it's the same as the last one

    lastHoleIndex = index;
    return index;
}

/**
 * Makes a face appear in a random hole for a random duration.
 * Schedules the next pop.
 */
function popFace() {
    if (!gameActive) return; // Exit if game is not running

    // Random time for face to stay up (e.g., 600ms to 1100ms)
    const popDuration = Math.random() * (1100 - 600) + 600;
    // Random time until the next pop (e.g., 400ms to 1000ms)
    const nextPopDelay = Math.random() * (1000 - 400) + 400;

    const index = getRandomHoleIndex(); // Get index of the hole
    const hole = holes[index];          // Get the hole element

    // Check if the hole element exists before adding class
    if (!hole) {
        console.error("Error: Could not find hole element at index", index);
        // Schedule next pop anyway to keep game running
        popTimeoutId = setTimeout(popFace, nextPopDelay);
        return;
    }

    hole.classList.add('up'); // Add 'up' class to trigger CSS animation

    // Set a timeout to make the face disappear after popDuration
    setTimeout(() => {
        // Only remove 'up' if it's still there (might have been removed by a click)
        if (hole.classList.contains('up')) {
             hole.classList.remove('up');
        }

        // Schedule the next pop *after* this one has finished its duration
        // Store the ID so we can cancel it if the game ends early
        popTimeoutId = setTimeout(popFace, nextPopDelay);

    }, popDuration);
}

/**
 * Handles clicks within the game board (event delegation).
 * @param {Event} event - The click event object.
 */
function bonk(event) {
    // Check if the game is active, if a face was clicked, AND if that face's hole is 'up'
    if (gameActive && event.target.classList.contains('face') && event.target.parentElement.classList.contains('up')) {
        score++;
        scoreDisplay.textContent = score;

        const clickedHole = event.target.parentElement;
        const clickedFace = event.target;

        clickedHole.classList.remove('up');

        // --- Play Bomp Sound ---
        bompSound.currentTime = 0; // Rewind to start in case it's already playing
        bompSound.play();
        // --- End of Play Bomp Sound ---

        // --- Add red border effect ---
        clickedFace.classList.add('bonked');
        setTimeout(() => {
             if (clickedFace.classList.contains('bonked')) {
                 clickedFace.classList.remove('bonked');
             }
        }, 150);
        // --- End of red border effect code ---
    }
}

/**
 * Starts the game countdown timer.
 */
function startTimer() {
    clearInterval(timerIntervalId); // Clear any previous timer

    timerIntervalId = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame(); // End the game when time runs out
        }
    }, 1000); // Run every 1 second
}

/**
 * Generates a witty message based on the final score.
 * @param {number} finalScore - The player's score.
 * @returns {string} A message based on the score.
 */
function getWittyMessage(finalScore) {
    if (finalScore === 0) return "Were you napping? Try clicking next time!";
    if (finalScore <= 5) return "Good start! Those faces are quick!";
    if (finalScore <= 10) return "Nice! You're getting the hang of it.";
    if (finalScore <= 15) return "Great reflexes! FaceBomp Master in training.";
    if (finalScore <= 20) return "Excellent! You barely missed any!";
    return "Phenomenal! Are you a Bomp machine?!";
}

/**
 * Ends the current game session.
 */
function endGame() {
    if (!gameActive) return;

    gameActive = false;
    clearInterval(timerIntervalId);
    clearTimeout(popTimeoutId);

    holes.forEach(hole => hole.classList.remove('up'));

    // --- Play End Game Sound ---
    // Check the final score and play the appropriate sound
    if (score > 9) {
        gameEndHighSound.currentTime = 0; // Rewind
        gameEndHighSound.play();
    } else {
        gameEndSound.currentTime = 0; // Rewind
        gameEndSound.play();
    }
    // --- End of Play End Game Sound ---

    // Update and display the final message
    finalScoreSpan.textContent = score;
    wittyMessageParagraph.textContent = getWittyMessage(score);
    finalMessageContainer.classList.add('show');

    // Reset and enable the start button
    startButton.disabled = false;
    startButton.textContent = "Start Game";

    console.log("Game Over! Final Score:", score);
}

/**
 * Initializes and starts a new game.
 */
function startGame() {
    if (gameActive) return; // Don't start if already running

    console.log("Starting game..."); // For debugging

    // --- Reset Game State ---
    gameActive = true;
    score = 0;
    timeLeft = 30; // Reset timer
    lastHoleIndex = -1;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    finalMessageContainer.classList.remove('show'); // Hide final message
    startButton.disabled = true; // Disable button during play
    startButton.textContent = "Bomp!"; // <<< CHANGE: Update text when game starts

    // Clear any lingering 'up' classes from a previous game
    holes.forEach(hole => hole.classList.remove('up'));

    // --- Start Game Processes ---
    startTimer();
    // Start the first pop after a short delay to allow setup
    popTimeoutId = setTimeout(popFace, 500); // Start popping after 500ms
}

// --- Event Listeners ---
startButton.addEventListener('click', startGame);
// Use event delegation on the game board for clicks
gameBoard.addEventListener('click', bonk);

// --- Initial Setup ---
timerDisplay.textContent = timeLeft; // Show initial time
