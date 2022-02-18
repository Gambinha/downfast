import {Request, Response} from 'express';
import { getCustomRepository } from 'typeorm';
import { UserRepository } from '../repositories/UserRepository';

import { hash, compare } from 'bcryptjs';

import Functions from '../functions/Functions';
const functions = new Functions();

class UserController {
    //Criar usuário
    async create(request: Request, response: Response) {
        const {
            name,
            email,
            username,
            password,
            role
        } = request.body;

        const usersRepository = getCustomRepository(UserRepository);

        //Verificar se já existe usuário com este e-mail
        const userAlreadyExists = await usersRepository.findOne({email});
        if(userAlreadyExists) {
            return response.status(400).json({
                error: "User already exists",
            })
        }

        //Criptografar a Senha
        const hashedPassword = await hash(password, 8);

        const user = usersRepository.create({
            name,
            email,
            username,
            password: hashedPassword,
            likedsPlaylists: [],
            role
        });

        await usersRepository.save(user);

        delete user.password;

        return response.status(201).json(user);
    }

    //Buscar usuário por ID
    async show(request: Request, response: Response) {
        try {
            const {id} = request.params;

            //Verifica se é um UUID
            if(!(functions.verifyUUID(id))) {
                return response.status(400).json({
                    error: "Invalid UUID",
                });
            }

            const userRepository = getCustomRepository(UserRepository);
            console.log(userRepository);

            const user = await userRepository.findOne({id});

            if(!user) {
                return response.status(400).json({
                    error: "User not found",
                })
            }

            delete user.password;
            delete user.id;
            delete user.createdAt;

            return response.status(201).json(user);
        } catch (error) {
            return response.status(400).json({error});
        }
    }

    //Buscar usuário por ID
    async showAll(request: Request, response: Response) { 
        const userRepository = getCustomRepository(UserRepository);

        const users = await userRepository.find();

        if(!users) {
            return response.status(400).json({
                error: "Users not found",
            })
        }

        users.forEach(user => {
            delete user.createdAt;
            delete user.likedsPlaylists;
            delete user.password;
        })

        return response.status(201).json(users);
    }

    //Atualizar dados do Usuário
    async updateUser(request: Request, response: Response) {
        const {
            updatedUser
        } = request.body;
        
        const userRepository = getCustomRepository(UserRepository);

        //Verificar se já existe usuário com este id
        const userExists = await userRepository.findOne({id: updatedUser.id});

        if(!userExists) {
            return response.status(400).json({
                error: "User not found",
            })
        }

        await userRepository
            .createQueryBuilder()
            .update({
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email
            })
            .where({id: updatedUser.id})
            .execute()
     
        return response.status(201).json({"message": "update succeeded"});
    }

    async updateUserLikesPlaylists(request: Request, response: Response) {
        const {
            user_id,
            playlists_id
        } = request.body;
        
        const userRepository = getCustomRepository(UserRepository);

        const userExists = await userRepository.findOne({id: user_id});

        if(!userExists) {
            return response.status(400).json({
                error: "User not found",
            })
        }

        await userRepository
            .createQueryBuilder()
            .update({
                likedsPlaylists: playlists_id
            })
            .where({id: user_id})
            .execute()
     
        return response.status(201).json({"message": "update succeeded"});
    }

    async updateUserRole(request: Request, response: Response) {
        const {
            user_id,
            newRole
        } = request.body;
        
        const userRepository = getCustomRepository(UserRepository);

        const userExists = await userRepository.findOne({id: user_id});

        if(!userExists) {
            return response.status(400).json({
                error: "User not found",
            })
        }

        await userRepository
            .createQueryBuilder()
            .update({
                role: newRole
            })
            .where({id: user_id})
            .execute()
     
        return response.status(201).json({"message": "update succeeded"});
    }

    async deleteUser(request: Request, response: Response) {
        const {id} = request.params;

        //ver se o id existe
        const userRepository = getCustomRepository(UserRepository);

        const userExists = await userRepository.findOne({id});

        if(!userExists) {
            return response.status(400).json({
                error: "User not found",
            })
        }

        await userRepository
            .createQueryBuilder()
            .delete()
            .where({id})
            .execute()

        return response.status(201).json({"message": "user deleted"});
    }

    async updatePassword(request: Request, response: Response) {
        const {id} = request.params;
        const {
            actualPassword,
            newPassword
        } = request.body;

        const userRepository = getCustomRepository(UserRepository);

        const userExists = await userRepository.findOne({id});
        if(!userExists) {
            return response.status(400).json({
                error: "User not found",
            })
        }

        //Senhas batem
        const matchPassword = await compare(actualPassword, userExists.password);

        if(!matchPassword) {
            return response.status(400).json({
                error: "Incorrect User or Password!"
            });
        }

        //Criptografar a Senha
        const hashedPassword = await hash(newPassword, 8);

        //Atualizar senha
        await userRepository
            .createQueryBuilder()
            .update({
                password: hashedPassword
            })
            .where({id})
            .execute()
 
        return response.status(201).json({"message": "update succeeded"});
    }
}

export {UserController};