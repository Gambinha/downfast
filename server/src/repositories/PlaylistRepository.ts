import { AppDataSource } from "../database";
import { Playlist } from "../models/Playlist";

export const PlaylistRepository = () => AppDataSource.getRepository(Playlist);
