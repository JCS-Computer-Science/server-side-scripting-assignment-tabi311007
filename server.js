const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())


//All your code goes here
let activeSessions={}

//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = server;