import {Router} from 'express';
import { UserController } from './controllers/UserController';
import { SessionController } from './controllers/SessionController';
import { PlaylistController } from './controllers/PlaylistController';
import { DownloadsController } from './controllers/DownloadsController';
import { SendMailController } from './controllers/SendMailController';

import { is } from './middlewares/permissions';

import multerConfig from './config/multer';

import multer from 'multer';

const router = Router();

const userController = new UserController();
const sessionController = new SessionController();
const playlistController = new PlaylistController();
const downloadController = new DownloadsController();
const sendMailController = new SendMailController();

router.post("/users", userController.create);
router.get("/users/:id", userController.show);
router.get("/users", is(['ROLE_ADMIN']), userController.showAll);
router.put("/users", is(['ROLE_USER', 'ROLE_ADMIN']), userController.updateUser);
router.put("/users/password/:id", is(['ROLE_USER', 'ROLE_ADMIN']), userController.updatePassword);
router.put("/users/playlists", is(['ROLE_USER', 'ROLE_ADMIN']), userController.updateUserLikesPlaylists);
router.put("/users/role", is(['ROLE_ADMIN']), userController.updateUserRole);
router.delete("/users/:id", is(['ROLE_USER', 'ROLE_ADMIN']), userController.deleteUser);

router.post("/session", sessionController.create);

router.post("/playlist", is(['ROLE_USER', 'ROLE_ADMIN']), playlistController.createPlaylist);
router.put("/playlist", is(['ROLE_USER', 'ROLE_ADMIN']), playlistController.updatePlaylist);8
router.post("/playlist/getAll", is(['ROLE_USER', 'ROLE_ADMIN']), playlistController.showAllPlaylist);

router.delete("/playlist/:playlist_id", is(['ROLE_USER', 'ROLE_ADMIN']), playlistController.removePlaylist);

router.get("/playlist/:user_id", is(['ROLE_USER', 'ROLE_ADMIN']), playlistController.showUserPlaylists);
router.put("/playlist/:user_id/:playlist_id", is(['ROLE_USER', 'ROLE_ADMIN']), playlistController.addVideos);

router.post("/downloads", is(['ROLE_USER', 'ROLE_ADMIN']), downloadController.getLinks);
router.get("/download", downloadController.getLink);
router.post("/downloads/getInfos", is(['ROLE_USER', 'ROLE_ADMIN']), downloadController.getInformations);
router.post("/downloads/getInfosByPlaylist", is(['ROLE_USER', 'ROLE_ADMIN']), downloadController.getUrlsByPlaylistId);

router.post("/upload", is(['ROLE_USER', 'ROLE_ADMIN']), multer(multerConfig).single('file'), downloadController.upload);

router.post("/sendMail", sendMailController.execute);

router.get("/verify", is(['ROLE_USER', 'ROLE_ADMIN']), sessionController.validToken);

export {router};