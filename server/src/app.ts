import express from 'express';
import { router } from './routes';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(router);

export {app};