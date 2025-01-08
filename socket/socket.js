const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()

const httpServer = http.createServer(app)

const IO = new Server(httpServer, { cors: { origin: "*" } })

module.exports = { IO, app, httpServer }