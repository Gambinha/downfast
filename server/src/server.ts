import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import http from 'http';
import { Server } from "socket.io";
import { SocketInit } from "./serverSocket";
import './database';

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

new SocketInit(io);

httpServer.listen(process.env.PORT || 3333, () => {
    console.log(`listening on :${process.env.PORT || 3333}`);
});
