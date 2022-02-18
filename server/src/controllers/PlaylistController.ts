import {Request, Response} from 'express';
import { getCustomRepository } from 'typeorm';
import { PlaylistRepository } from '../repositories/PlaylistRepository';

import Functions from '../functions/Functions';
const functions = new Functions();

class PlaylistController {
    //Criar e Inserir playlist no Banco
    async createPlaylist(request: Request, response: Response) {
        const {
            title,
            genre,
            security,
            likes,
            videos,
            keywords,
            user_id
        } = request.body;

        const playlistRepository = getCustomRepository(PlaylistRepository);

        const playlist = playlistRepository.create({
            title,
            genre,
            security,
            likes,
            videos,
            keywords,
            user_id
        });

        await playlistRepository.save(playlist);

        return response.status(201).json(playlist);
    }

    //Buscar todas playlists do usuário
    async showUserPlaylists(request: Request, response: Response) {
        const {
            user_id
        } = request.params;

        if(!(functions.verifyUUID(user_id))) {
            return response.status(400).json({
                error: "Invalid UUID",
            });
        }

        const playlistRepository = getCustomRepository(PlaylistRepository);

        const playlist = await playlistRepository.find({where: {user_id}});

        //Verifica se existe a playlist no Banco de Dados
        if(!playlist) {
            return response.status(400).json({
                error: "User does not have playlists",
            });
        }

        return response.status(201).json(playlist);

    }

    //Mostra todas as Playlists
    async showAllPlaylist(request: Request, response: Response) {
        const {
            onlyPublic //true or false
        } = request.body;

        const playlistRepository = getCustomRepository(PlaylistRepository);

        let playlists;

        if(onlyPublic === true) {
            playlists = await playlistRepository
                .find({select: ["id", "title", "genre", "security", "likes", "videos", "keywords"], relations: ["user_id"], where: {security: "public"}});
        }
        else {
            playlists = await playlistRepository
                .find({select: ["id", "title", "genre", "security", "likes", "videos", "keywords"], relations: ["user_id"]});
        }
    
        playlists.forEach(playlist => {
            delete playlist.user_id.email,
            delete playlist.user_id.password,
            delete playlist.user_id.name
            delete playlist.user_id.createdAt,
            delete playlist.user_id.playlist
        })
        
        return response.status(201).json(playlists);
    }

    //Atualiza Playlist
    async updatePlaylist(request: Request, response: Response) {
        const {
            updatedPlaylist
        } = request.body;

        const playlist_id = updatedPlaylist.id;

        const playlistRepository = getCustomRepository(PlaylistRepository);

        await playlistRepository
            .createQueryBuilder()
            .update({
                title: updatedPlaylist.title,
                genre: updatedPlaylist.genre,
                security: updatedPlaylist.security,
                videos: updatedPlaylist.videos,
                keywords: updatedPlaylist.keywords,
                likes: updatedPlaylist.likes
            })
            .where({id: playlist_id})
            .execute();

        return response.status(201).json({"message": "update succeeded"});
    }

    //Buscar playlist pelo ID e TITLE
    async showOne(request: Request, response: Response) {
        const {
            user_id,
            title
        } = request.params;

        //Verifica se é um UUID
        if(!(functions.verifyUUID(user_id))) {
            return response.status(400).json({
                error: "Invalid UUID",
            });
        }

        const playlistRepository = getCustomRepository(PlaylistRepository);

        const playlist = await playlistRepository.findOne({where: {title, user_id}});

        //Verifica se existe a playlist no Banco de Dados
        if(!playlist) {
            return response.status(400).json({
                error: "Playlist does not exist",
            });
        }

        return response.status(201).json(playlist);
    }

    async addVideos(request: Request, response: Response) {
        const {
            updatedVideos
        } = request.body;

        const {
            user_id,
            playlist_id
        } = request.params;
        
        //Verifica se é um UUID
        if(!(functions.verifyUUID(user_id)) || !(functions.verifyUUID(playlist_id))) {
            return response.status(400).json({
                error: "Invalid UUID",
            });
        }

        const playlistRepository = getCustomRepository(PlaylistRepository);

        const playlist = await playlistRepository.findOne({where: {id: playlist_id, user_id}});

        //Verifica se existe a playlist no Banco de Dados
        if(!playlist) {
            return response.status(400).json({
                error: "Playlist does not exist",
            });
        }

        const videos = playlist.videos;

        //Verifica se video já existe na Playlist
        videos.forEach(video => {
            updatedVideos.forEach(updatedVideo => {
                if(video.url === updatedVideo.url) {
                    const index = updatedVideos.indexOf(updatedVideo);
                    if (index > -1) {
                        updatedVideos.splice(index, 1);
                    }
                }
            });
        });

        //Atualiza os videos no Banco de Dados
        updatedVideos.forEach(video => {
            videos.push(video);
        });

        playlist.videos = videos;

        await playlistRepository.save(playlist);

        return response.status(201).json({"message": 'Succesfully Updated'});
    }

    async removeVideos(request: Request, response: Response) {
        const {
            deletedVideos
        } = request.body;

        const {
            user_id,
            title
        } = request.params;

        //Verifica se é um UUID
        if(!(functions.verifyUUID(user_id))) {
            return response.status(400).json({
                error: "Invalid UUID",
            });
        }

        const playlistRepository = getCustomRepository(PlaylistRepository);

        const playlist = await playlistRepository.findOne({where: {title, user_id}});

        //Verifica se existe a playlist no Banco de Dados
        if(!playlist) {
            return response.status(400).json({
                error: "Playlist does not exist",
            });
        }

        const videos = playlist.videos;

        //Verifica se video já existe na Playlist
        deletedVideos.forEach(deletedVideo => {
            videos.forEach(video => {
                if(deletedVideo.url === video.url) {
                    const index = videos.indexOf(video);
                    if (index > -1) {
                        videos.splice(index, 1);
                    }
                }
            });
        });

        playlist.videos = videos;

        await playlistRepository.save(playlist);

        return response.status(201).json({"message": 'Succesfully Removed'});
    }

    async removePlaylist(request: Request, response: Response) {
        const {
            playlist_id
        } = request.params;

        //Verifica se é um UUID
        if(!(functions.verifyUUID(playlist_id))) {
            return response.status(400).json({
                error: "Invalid UUID",
            });
        }

        const playlistRepository = getCustomRepository(PlaylistRepository);

        await playlistRepository
        .createQueryBuilder()
        .delete()
        .where({id: playlist_id})
        .execute();

        return response.status(201).json({"message": "exclusion succeeded"});
    }

}

export { PlaylistController };