// Do not modify this file
const uuid = require('uuid');
const request = require('supertest');
// const server = require('./server'); // Students' server implementation
const server = require('./solution'); // Students' server implementation

describe('Wordle Server', () => {


    describe('GET /newgame starts a new game and returns the session ID', () => {
        let res
        
        beforeAll(async () => {
            res = await request(server).get('/newgame');
            
        })
        test('returns a status code 201', () => expect(res.status).toBe(201));
        describe('returns a session ID', () => {
            test('body.sessionID should exist', () => (expect(res.body.sessionID).toBeDefined()))
            test('the session ID is a valid uuid', () => (expect(uuid.validate(res.body.sessionID)).toBe(true)))
        })
    });

    describe('GET /gamestate returns correct game state after a new game is made', () => {
        let gameStateRes
        let gameState
        beforeAll(async () => {
            let agent = request.agent(server)
            let res= await agent.get('/newgame');
            let sessionID = res.body.sessionID
            gameStateRes = await agent
                .get(`/gamestate?sessionID=${sessionID}`)
            gameState = gameStateRes.body.gameState;
        })

        test('returns a status code 200', () => expect(gameStateRes.status).toBe(200))
        describe('game state object is accurate', () => {
            test('guesses is an empty array', () => expect(gameState.guesses.length).toBe(0))
            test('remainingGuesses is 6', () => expect(gameState.remainingGuesses).toBe(6))
            test('wrongLetters is an empty array', () => expect(gameState.wrongLetters).toEqual([]))
            test('closeLetters is an empty array', () => expect(gameState.closeLetters).toEqual([]))
            test('rightLetters is an empty array', () => expect(gameState.rightLetters).toEqual([]))
        })

    });

    describe('GET /newgame with answer query sets the wordToGuess and returns the session ID', () => {
        let sessionID
        let res
        let res2
        beforeAll(async () => {
            let agent = request.agent(server)
            res = await agent.get('/newgame?answer=apple');
            sessionID = res.body.sessionID
            res2 = await agent.post('/guess').send({ guess: 'apple', sessionID })

        })
        test('returns a status code 201', () => expect(res.status).toBe(201))
        describe('returns a session ID', () => {
            test('body.sessionID should exist', () => (expect(res.body.sessionID).toBeDefined()))
            test('the session ID is a valid uuid', () => (expect(uuid.validate(res.body.sessionID)).toBe(true)))
        })
        test('guessing the specified answer should win', () => expect(res2.body.gameState.gameOver).toBe(true))
    });

    
    describe('POST /guess returns updated game state with correctness indicators', () => {
        let guessRes
        let gameState

        beforeAll(async () => {
            let agent = request.agent(server)
            let res = await agent.get('/newgame?answer=apple');
            let sessionID=res.body.sessionID
            // Make a guess
            guessRes = await agent
                .post('/guess')
                .send({ guess: 'phase' , sessionID});
            gameState = guessRes.body.gameState;
        })

        test('status code is 201', () => expect(guessRes.status).toBe(201));
        describe('the game state object is accurate', () => {

            test('there should be 1 guess in guesses', () => expect(gameState.guesses.length).toBe(1))
            test('the guess is an array with the correct values', () => expect(gameState.guesses[0]).toEqual([
                { value: 'p', result: 'CLOSE' },
                { value: 'h', result: 'WRONG' },
                { value: 'a', result: 'CLOSE' },
                { value: 's', result: 'WRONG' },
                { value: 'e', result: 'RIGHT' },
            ]))
            test('remaining guesses is 5', () => expect(gameState.remainingGuesses).toBe(5))
            test('wrongLetters contains only the wrong guessed letters', () => expect(gameState.wrongLetters.sort((a, b) => a > b ? 1 : -1)).toEqual(['h', 's']))
            test('closeLetters contains only the close guessed letters', () => expect(gameState.closeLetters.sort((a, b) => a > b ? 1 : -1)).toEqual(['a', 'p']))
            test('rightLetters contains only the correctly guessed letters', () => expect(gameState.rightLetters).toEqual(['e']))
        })

    });
//TODO got to here with removing cookies
    describe('POST /guess returns 400 if no session ID is provided', () => {
        let res
        beforeAll(async () => {
            res = await request(server)
                .post('/guess')
                .send({ guess: 'apple' })
        })

        test('status code should be 400', () => expect(res.status).toBe(400))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });

    describe('POST /guess returns 404 if session ID does not match any active session', () => {
        let res
        beforeAll(async()=>{
            const badID = uuid.v4() // Simulate non-existent session ID
            res = await request(server)
                .post('/guess')
                .send({ guess: 'apple' , sessionID:badID});

        })


        test('status code should be 404', () => expect(res.status).toBe(404))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });


    describe('GET /gamestate returns correct game state after two guesses', () => {
        let gameStateRes
        let gameState
        beforeAll(async () => {
            let agent = request.agent(server)
            let res=await agent.get('/newgame?answer=apple');
            // Make a guess
            let sessionID=res.body.sessionID
            await agent
                .post('/guess')
                .send({ guess: 'phase' , sessionID});
            await agent
                .post('/guess')
                .send({ guess: 'angle',sessionID })
            gameStateRes = await agent
                .get(`/gamestate?sessionID=${sessionID}`)
            gameState = gameStateRes.body.gameState;
        })

        test('returns a status code 200', () => expect(gameStateRes.status).toBe(200))
        describe('game state object is accurate', () => {

            test('guesses has 2 elements', () => expect(gameState.guesses.length).toBe(2))
            test('guesses[0] represents the first guess', () => expect(gameState.guesses[0]).toEqual([
                { value: 'p', result: 'CLOSE' },
                { value: 'h', result: 'WRONG' },
                { value: 'a', result: 'CLOSE' },
                { value: 's', result: 'WRONG' },
                { value: 'e', result: 'RIGHT' },
            ]))
            test('guesses[1] represents the 2nd guess', () => expect(gameState.guesses[1]).toEqual([
                { value: 'a', result: 'RIGHT' },
                { value: 'n', result: 'WRONG' },
                { value: 'g', result: 'WRONG' },
                { value: 'l', result: 'RIGHT' },
                { value: 'e', result: 'RIGHT' },
            ]))
            test('wrongLetters contains only the wrong guessed letters', () => expect(gameState.wrongLetters.sort((a, b) => a > b ? 1 : -1)).toEqual(['g', 'h', 'n', 's']))
            test('closeLetters contains only the close guessed letters', () => expect(gameState.closeLetters).toEqual(['p']))
            test('rightLetters contains only the right guessed letters', () => expect(gameState.rightLetters.sort((a, b) => a > b ? 1 : -1)).toEqual(['a', 'e', 'l']))
        })

    });

    describe('GET /gamestate returns 400 if no session ID is provided', () => {
        let res
        beforeAll(async () => {
            res = await request(server)
                .get('/gamestate')
        })

        test('status code should be 400', () => expect(res.status).toBe(400))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });

    describe('GET /gamestate returns 404 if session ID does not match any active session', () => {
        let res
        beforeAll(async()=>{
            const badID = uuid.v4(); // Simulate non-existent session ID
            res = await request(server)
                .get(`/gamestate?sessionID=${badID}`)
        })

        test('status code should be 404', () => expect(res.status).toBe(404))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });

    describe('POST /guess returns 400 for invalid guess (not 5 letters)', () => {
        let agent
        let sessionID
        beforeAll(async () => {
            agent = request.agent(server)
           let res= await agent.get('/newgame?answer=apple')
           sessionID=res.body.sessionID
        })
        describe("doesn't accept short guesses", () => {
            let res
            beforeAll(async () => {
                res = await agent
                    .post('/guess')
                    .send({ guess: 'app', sessionID }); // Invalid guess, less than 5 letters
            })
            test('status code should be 400',()=>expect(res.status).toBe(400))
            test('response should include an error message',()=> expect(res.body.error).toBeDefined())
        })
        describe("doesn't accept long guesses", () => {
            let res
            beforeAll(async () => {
                res = await agent
                    .post('/guess')
                    .send({ guess: 'orange', sessionID }); // Invalid guess, less than 5 letters
            })
            test('status code should be 400',()=>expect(res.status).toBe(400))
            test('response should include an error message',()=> expect(res.body.error).toBeDefined())
        })
    });
    describe('POST /guess returns 400 for invalid guess (non-letter characters)', () => {
        let agent
        let sessionID
        beforeAll(async () => {
            agent = request.agent(server)
            let res = await agent.get('/newgame?answer=appl')
            sessionID=res.body.sessionID
        })
        describe("doesn't accept numbers", () => {
            let res
            beforeAll(async () => {
                res = await agent
                    .post('/guess')
                    .send({ guess: 'app1e', sessionID }); // Invalid guess, less than 5 letters
            })
            test('status code should be 400',()=>expect(res.status).toBe(400))
            test('response should include an error message',()=> expect(res.body.error).toBeDefined())
        })
        describe("doesn't accept special characters", () => {
            let res
            beforeAll(async () => {
                res = await agent
                    .post('/guess')
                    .send({ guess: '@pple' , sessionID}); // Invalid guess, less than 5 letters
            })
            test('status code should be 400',()=>expect(res.status).toBe(400))
            test('response should include an error message',()=> expect(res.body.error).toBeDefined())
        })
    });


    describe('DELETE /reset starts a new game with the same ID', () => {
        let res;
        let gameState
        let checkRes
        beforeAll(async () => {
            let agent = request.agent(server)
            let res = await agent.get('/newgame?answer=apple');
            let sessionID=res.body.sessionID
            await agent.post('/guess').send({ guess: 'phase',sessionID })
            resetRes = await agent.delete(`/reset?sessionID=${sessionID}`)
            gameState = resetRes.body.gameState
            checkRes = await agent.get(`/gamestate?sessionID=${sessionID}`)
        })

        test('returns a status code 200', () => expect(resetRes.status).toBe(200));
        describe('responds with a new game state object', () => {
            test('wordToGuess is undefined', () => expect(gameState.wordToGuess).toBeUndefined());
            test('guesses is an empty array', () => expect(gameState.guesses).toEqual([]))
            test('remainingGuesses is 6', () => expect(gameState.remainingGuesses).toBe(6))
            test('gameOVer is false', () => expect(gameState.gameOver).toBe(false));
            test('wrongLetters is an empty array', () => expect(gameState.wrongLetters).toEqual([]))
            test('closeLetters is an empty array', () => expect(gameState.closeLetters).toEqual([]))
            test('rightLetters is an empty array', () => expect(gameState.rightLetters).toEqual([]))
        })
        test('the original ID still references the session',()=>expect(checkRes.body.gameState).toBeDefined())
    });

    describe('DELETE /reset returns 400 if no session ID is provided', () => {
        let res;
        beforeAll(async () => {
            let agent = request.agent(server)
            res = await agent.delete('/reset')
        })

        test('status code should be 400', () => expect(res.status).toBe(400))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });

    describe('DELETE /reset returns 404 if session ID does not match any active session', () => {
        let delRes
        beforeAll(async () => {
            const badID = uuid.v4();
            let agent = request.agent(server)
            let res = await agent.get('/newgame?answer=apple');
            await agent.post('/guess').send({ guess: 'phase', sessionID: res.body.sessionID })
            delRes=await agent.delete(`/reset?sessionID=${badID}`)
        })

        test('status code should be 404', () => expect(delRes.status).toBe(404))
        test('responds with an error message', () => expect(delRes.body.error).toBeDefined())
    });
    describe('DELETE /delete removes session from the active sessions', () => {

        let delRes;
        let sessionID
        let finalres
        beforeAll(async () => {
            let agent = request.agent(server)
            let ogRes = await agent.get('/newgame?answer=apple');
            sessionID=ogRes.body.sessionID
            await agent.post('/guess').send({ guess: 'phase' , sessionID})
            delRes = await agent.delete(`/delete?sessionID=${sessionID}`)
            finalres = await agent.get(`/gamestate?sessionID=${sessionID}`)
        })


        test('status code should be 204',()=>expect(delRes.status).toBe(204))
        test('the old ID should no longer reference an active session',()=>expect(finalres.status).toBe(404))
       
    });

    describe('DELETE /delete returns 400 if no session cookie is provided', () => {
        let res;
        beforeAll(async () => {
            let agent = request.agent(server)
            res = await agent.delete('/delete')
        })

        test('status code should be 400', () => expect(res.status).toBe(400))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });

    describe('DELETE /delete returns 404 if session cookie does not match any active session', () => {
        let res;
        
        beforeAll(async () => {
            const badID = uuid.v4();
            let agent = request.agent(server)
            let ogres = await agent.get('/newgame?answer=apple');
            let sessionID = ogres.body.sessionID
            await agent.post('/guess').send({ guess: 'phase', sessionID })
            res=await agent.delete(`/delete?sessionID=${badID}`)
        })

        test('status code should be 404', () => expect(res.status).toBe(404))
        test('responds with an error message', () => expect(res.body.error).toBeDefined())
    });
})