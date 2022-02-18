import {app} from './app';
import http from 'http';
import {Server} from "socket.io";

import dotenv from 'dotenv';
dotenv.config();

import { SocketInit } from "./serverSocket";

import './database';
import 'reflect-metadata';

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: "https://example.com",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

//Initilize socket
new SocketInit(io);

httpServer.listen(process.env.PORT || 3333, () => {
    console.log('listening on :3333');
});