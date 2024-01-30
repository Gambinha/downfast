import { ConnectionOptions, createConnection } from "typeorm";
import { CreateUsers1626457698359 } from "./migrations/1626457698359-CreateUsers";
import { CreatePlaylist1629244485409 } from "./migrations/1629244485409-CreatePlaylist";

import dotenv from "dotenv";
dotenv.config();

const rootDir = process.env.NODE_ENV === "development" ? "src" : "build";

const extensionFile = process.env.NODE_ENV === "development" ? "ts" : "js";

const config: ConnectionOptions = {
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  synchronize: false,
  entities: [rootDir + `/models/*.${extensionFile}`],
  migrations: [CreateUsers1626457698359, CreatePlaylist1629244485409],
  migrationsRun: true,
  migrationsTransactionMode: "all",
  migrationsTableName: "custom_migration_table",
  cli: {
    migrationsDir: rootDir + `/database/migrations`,
  },
};

console.log(config);

createConnection(config)
  .then(async (response) => {
    console.log(response);
    console.log(response.migrations);
    const resp = await response.runMigrations();
    console.log(resp);
  })
  .catch((error) => console.log(error));
