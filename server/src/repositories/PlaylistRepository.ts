import {EntityRepository, Repository } from "typeorm";
import { Playlist } from "../models/Playlist";

@EntityRepository(Playlist)
class PlaylistRepository extends Repository<Playlist>{

}

export {PlaylistRepository};