# Wordle Clone Server Assignment

## Objective: 
Build a server-side version of the popular Wordle game using Express.js, with game states tracked using cookies.

## Game State:
Each session should have an associated game state object with:
- guesses: An array of guesses, where each guess is an array of characters. Each character is represented as an object with:
    - value: The actual character guessed.
    - result: The correctness of the guess, which can be "WRONG", "CLOSE", or "RIGHT".
- wrongLetters: Letters that have been guessed but not in the word.
- closeLetters: Letters that have been guessed, are in the word, but not yet guessed in the correct position.
- rightLetters: Letters that have been correctly guessed and in the correct position.
- remainingGuesses: Number of remaining guesses (start with 6).
- gameOver: A boolean that becomes true when the game ends either by no guesses remaining or the word correctly guessed.
- wordToGuess: The word to guess, which should be hidden (undefined) unless the game is over when sent as a response.

For example, after two incorrect guesses, the game state for an individual session would look like this:
```js
{
    wordToGuess: "apple",
    guesses:[
        [
            {value:'p', result:'CLOSE'},
            {value:'h', result:'WRONG'},
            {value:'a', result:'CLOSE'},
            {value:'s', result:'WRONG'},
            {value:'e', result:'RIGHT'},
        ],
        [
            {value:'a', result:'RIGHT'},
            {value:'n', result:'WRONG'},
            {value:'g', result:'WRONG'},
            {value:'l', result:'RIGHT'},
            {value:'e', result:'RIGHT'},
        ]
    ],
    wrongLetters: ['h','s','n','g'],
    closeLetters: ['p'], //'a' is no longer close because it has been guessed in the correct spot
    rightLetters: ['e','a','e'],
    remainingGuesses: 4,
    gameOver: false
}
```
## Session Management:
- When a new game is created, the server generates a unique session ID using the `uuid` library
- The session ID is sent back to the client to include with future requests
- Game states will be stored per session in memory using the uuid as the key in an object. eg:
```js
activeSessions = {
    someUUID:{
        wordToGuess: 'apple',
        guesses: [...],
        ...
    },
    anotherUUID:{
        wordToGuess: 'phase',
        guesses: [...],
        ...
    }
}
```
- When a request is made to make a guess, to get the current game state, or to reset a game session, it must include a session ID so the server knows which session we are working with.
- If a request is made to make a guess, to get the current game state, or to reset a game session without a session ID, respond with a 400 Bad Request error.
- If a request is made to make a guess, to get the current game state, or to reset a game session with a session ID that has no matching game state, respond with a 404 Not Found error.
## Endpoints:
### Static Files
- **PR1**: The server should be configured to serve static files from the `/public` folder which includes the provided `index.html` file.
- `index.html` contains a basic client for your Wordle server. It assumes your server meets the requirements below, and may help you understand what your server is meant to do. If your server is working correctly, you should be able to play Wordle on this website.
- During development, you are probably better off using Thunder Client to manually test your endpoints, and the included Jest tests for automated tests. Using `index.html` is by no means a thorough or even efficient way to test your code as you go.
### GET /newgame:
- **PR1**: Generates a new unique ID using the UUID library
- **PR2**: Starts a new game by creating a new empty game state object and adding it to the active sessions object with the new ID as the key.
- **PR2**: Randomly choose a word for the game state's wordToGuess property
- **DV2**: Responds with status code 201 (Created) 
- **PR1**: Responds with the new session ID in the body of the response as `body.sessionID`
- **EX1**: Should optionally accept a query string parameter `?answer=apple` to manually set the word for the session, allowing easier testing.
- **EX2**: Use a free dictionary API to fetch a random word with exactly 5 letters and an option to specify the word's frequency (common or rare).
### GET /gamestate:
- **PR1**: Parse out the session ID from the request query params, eg. `?sessionID=1234`
- If the session ID is valid:
    - **PR2**: Responds with the current state of the game for the session as `body.gameState`
    - **DV2**: Responds with status code 200.
    - **PR2**: The `wordToGuess` should be `undefined` unless `gameOver` is `true`.
- **PR1**: If no session ID is attached to the request, respond with status code 400 (Bad Request) and an error message as `body.error`.
- **PR2**: If a session ID is attached but there is no matching game state for that session, respond with status code 404 (Not Found) and an error message as `body.error`.
### POST /guess:
- **PR1**: Parses out the session ID and guess from the request body.
    - The guess will be a string as `req.body.guess`
    - The session ID will be a string as `req.body.sessionID`
- **PR2**: If the session ID is valid, updates the game state accordingly.
    - **PR1**: Responds with the updated game state after the guess as `body.gameState`
    - **DV2**: Responds with status code 201 (Created)
- **PR2**: If the user wins or runs out of guesses, the response should include the answer in `wordToGuess`.
- **PR1**: If no session ID is attached to the request, respond with status code 400 (Bad Request) and an error message as `body.error`.
- **PR2**: If a session ID is attached but there is no matching game state for that session, respond with status code 404 (Not Found) and an error message as `body.error`.
- Respond with a 400 error if:
    - **PR2**: The guess is not exactly 5 characters long.
    - **EX1**: The guess contains non-letter characters.
    - **EX2**: The guess is not a real english word, verified using a free dictionary API.
### DELETE /reset:
- **PR1**: Parse out the session ID from the request query params, eg. `?sessionID=1234`
- If the session ID is valid:
    - **PR1**: Resets the current game state, starting a fresh game for the user without changing the session ID.
    - **PR1**: Responds with the new fresh game state as `body.gamestate`
    - **DV2**: Responds with status code 200
- **PR1**: If no session ID is attached to the request, respond with status code 400 (Bad Request) and an error message as `body.error`.
- **PR2**: If a session ID is attached but there is no matching game state for that session, respond with status code 404 (Not Found) and an error message as `body.error`.
### DELETE /delete:
- **PR1**: Parse out the session ID from the request query params, eg. `?sessionID=1234`
- If the session ID is valid:
    - **PR2**: Removes the session from the active sessions object.
    - **DV2**: Only responds with the status code 204
- **PR1**: If no session ID is attached to the request, respond with status code 400 (Bad Request) and an error message as `body.error`.
- **PR2**: If a session ID is attached but there is no matching game state for that session, respond with status code 404 (Not Found) and an error message as `body.error`.
### Optional (not covered in tests) GET /scoreboard:
- **EX1**: Returns the number of games won by each number of guesses taken (1 through 6) and the total number of games lost since the server started.
### Optional (not covered in tests) GET /hint:
- **PR1**: Parse out the session ID from the request query params, eg. `?sessionID=1234`
- **EX2**: If the session ID is valid, returns the definition of the current word, retrieved from a free dictionary API.
- **PR1**: If no session ID is attached to the request, respond with status code 400 (Bad Request) and an error message as `body.error`.
- **PR2**: If a session ID is attached but there is no matching game state for that session, respond with status code 404 (Not Found) and an error message as `body.error`.
- **EX2**: Additional requests to /hint provide extra information such as secondary definitions, synonyms, or example sentences where the word is replaced by asterisks (e.g., "The *** was very large").

## Additional Exemplary Level Extensions
- Learn how to implement a database so that game states and the scoreboard persists across server reboots. See **NEDB** for a fairly simple local database library.
- Modify `index.html` or make your own front-end site to use your server and implement the on-screen keyboard, styling, and animation of the original Wordle site.