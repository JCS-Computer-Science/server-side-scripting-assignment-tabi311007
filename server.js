const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())


// Active sessions storage
let activeSessions = {};

// Helper to generate a random word for the game
const getRandomWord = async () => {
  const res = await axios.get('https://random-word-api.herokuapp.com/word?number=1&length=5');
  return res.data[0];
};

// Helper to check if the word is valid
const isValidWord = async (word) => {
  const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  return res.status === 200;
};

// Helper to update the game state
const updateGameState = (sessionID, guess) => {
  const gameState = activeSessions[sessionID];
  const wordToGuess = gameState.wordToGuess;
  const result = [];

  let rightLetters = gameState.rightLetters.slice();
  let closeLetters = gameState.closeLetters.slice();
  let wrongLetters = gameState.wrongLetters.slice();

  guess.split('').forEach((char, index) => {
    if (char === wordToGuess[index]) {
      result.push({ value: char, result: 'RIGHT' });
      rightLetters.push(char);
    } else if (wordToGuess.includes(char)) {
      result.push({ value: char, result: 'CLOSE' });
      closeLetters.push(char);
    } else {
      result.push({ value: char, result: 'WRONG' });
      wrongLetters.push(char);
    }
  });

  gameState.guesses.push(result);
  gameState.rightLetters = rightLetters;
  gameState.closeLetters = closeLetters;
  gameState.wrongLetters = wrongLetters;
  gameState.remainingGuesses -= 1;

  if (rightLetters.length === 5 || gameState.remainingGuesses === 0) {
    gameState.gameOver = true;
  }

  return gameState;
};

// Route to start a new game
server.get('/newgame', async (req, res) => {
  const sessionID = uuidv4();
  const wordToGuess = await getRandomWord();
  
  activeSessions[sessionID] = {
    wordToGuess: wordToGuess,
    guesses: [],
    wrongLetters: [],
    closeLetters: [],
    rightLetters: [],
    remainingGuesses: 6,
    gameOver: false,
  };

  res.status(201).json({ sessionID });
});

// Route to get the current game state
server.get('/gamestate', (req, res) => {
  const { sessionID } = req.query;

  if (!sessionID) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const gameState = activeSessions[sessionID];

  if (!gameState) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const response = { ...gameState };
  if (!gameState.gameOver) {
    response.wordToGuess = undefined;
  }

  res.status(200).json({ gameState: response });
});

// Route to make a guess
server.post('/guess', async (req, res) => {
  const { sessionID, guess } = req.body;

  if (!sessionID || !guess) {
    return res.status(400).json({ error: 'Session ID and guess are required' });
  }

  const gameState = activeSessions[sessionID];

  if (!gameState) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (guess.length !== 5) {
    return res.status(400).json({ error: 'Guess must be 5 letters long' });
  }

  const valid = await isValidWord(guess);
  if (!valid) {
    return res.status(400).json({ error: 'Guess is not a valid English word' });
  }

  const updatedGameState = updateGameState(sessionID, guess);
  res.status(201).json({ gameState: updatedGameState });
});

// Route to reset the game
server.delete('/reset', (req, res) => {
  const { sessionID } = req.query;

  if (!sessionID) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const gameState = activeSessions[sessionID];

  if (!gameState) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const wordToGuess = getRandomWord();

  activeSessions[sessionID] = {
    wordToGuess,
    guesses: [],
    wrongLetters: [],
    closeLetters: [],
    rightLetters: [],
    remainingGuesses: 6,
    gameOver: false,
  };

  res.status(200).json({ gameState: activeSessions[sessionID] });
});

// Route to delete the session
server.delete('/delete', (req, res) => {
  const { sessionID } = req.query;

  if (!sessionID) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (!activeSessions[sessionID]) {
    return res.status(404).json({ error: 'Game not found' });
  }

  delete activeSessions[sessionID];
  res.status(204).end();
});

// Starting the server
// server.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

module.exports = server;
