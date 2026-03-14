import "reflect-metadata";
import { DataSource } from "typeorm";
import { Playlist } from "../models/Playlist";
import { User } from "../models/User";
import { CreateUsers1626457698359 } from "./migrations/1626457698359-CreateUsers";
import { CreatePlaylist1629244485409 } from "./migrations/1629244485409-CreatePlaylist";

import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "downfast",
  synchronize: false,
  entities: [User, Playlist],
  migrations: [CreateUsers1626457698359, CreatePlaylist1629244485409],
  migrationsRun: true,
  migrationsTableName: "custom_migration_table",
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
  })
  .catch((error) => console.log("Database connection error:", error));
