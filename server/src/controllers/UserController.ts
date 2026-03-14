import {Request, Response} from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { hash, compare } from 'bcryptjs';
import Functions from '../functions/Functions';

const functions = new Functions();

class UserController {
    async create(request: Request, response: Response) {
        const { name, email, username, password, role } = request.body;

        const usersRepository = UserRepository();

        const userAlreadyExists = await usersRepository.findOneBy({ email });
        if (userAlreadyExists) {
            return response.status(400).json({ error: "User already exists" });
        }

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

    async show(request: Request, response: Response) {
        try {
            const { id } = request.params;

            if (!functions.verifyUUID(id)) {
                return response.status(400).json({ error: "Invalid UUID" });
            }

            const userRepository = UserRepository();
            const user = await userRepository.findOneBy({ id });

            if (!user) {
                return response.status(400).json({ error: "User not found" });
            }

            delete user.password;
            delete user.id;
            delete user.createdAt;

            return response.status(201).json(user);
        } catch (error) {
            return response.status(400).json({ error });
        }
    }

    async showAll(request: Request, response: Response) {
        const userRepository = UserRepository();
        const users = await userRepository.find();

        if (!users) {
            return response.status(400).json({ error: "Users not found" });
        }

        users.forEach(user => {
            delete user.createdAt;
            delete user.likedsPlaylists;
            delete user.password;
        });

        return response.status(201).json(users);
    }

    async updateUser(request: Request, response: Response) {
        const { updatedUser } = request.body;

        const userRepository = UserRepository();
        const userExists = await userRepository.findOneBy({ id: updatedUser.id });

        if (!userExists) {
            return response.status(400).json({ error: "User not found" });
        }

        await userRepository
            .createQueryBuilder()
            .update()
            .set({ name: updatedUser.name, username: updatedUser.username, email: updatedUser.email })
            .where({ id: updatedUser.id })
            .execute();

        return response.status(201).json({ message: "update succeeded" });
    }

    async updateUserLikesPlaylists(request: Request, response: Response) {
        const { user_id, playlists_id } = request.body;

        const userRepository = UserRepository();
        const userExists = await userRepository.findOneBy({ id: user_id });

        if (!userExists) {
            return response.status(400).json({ error: "User not found" });
        }

        await userRepository
            .createQueryBuilder()
            .update()
            .set({ likedsPlaylists: playlists_id })
            .where({ id: user_id })
            .execute();

        return response.status(201).json({ message: "update succeeded" });
    }

    async updateUserRole(request: Request, response: Response) {
        const { user_id, newRole } = request.body;

        const userRepository = UserRepository();
        const userExists = await userRepository.findOneBy({ id: user_id });

        if (!userExists) {
            return response.status(400).json({ error: "User not found" });
        }

        await userRepository
            .createQueryBuilder()
            .update()
            .set({ role: newRole })
            .where({ id: user_id })
            .execute();

        return response.status(201).json({ message: "update succeeded" });
    }

    async deleteUser(request: Request, response: Response) {
        const { id } = request.params;

        const userRepository = UserRepository();
        const userExists = await userRepository.findOneBy({ id });

        if (!userExists) {
            return response.status(400).json({ error: "User not found" });
        }

        await userRepository
            .createQueryBuilder()
            .delete()
            .where({ id })
            .execute();

        return response.status(201).json({ message: "user deleted" });
    }

    async updatePassword(request: Request, response: Response) {
        const { id } = request.params;
        const { actualPassword, newPassword } = request.body;

        const userRepository = UserRepository();
        const userExists = await userRepository.findOneBy({ id });

        if (!userExists) {
            return response.status(400).json({ error: "User not found" });
        }

        const matchPassword = await compare(actualPassword, userExists.password);

        if (!matchPassword) {
            return response.status(400).json({ error: "Incorrect User or Password!" });
        }

        const hashedPassword = await hash(newPassword, 8);

        await userRepository
            .createQueryBuilder()
            .update()
            .set({ password: hashedPassword })
            .where({ id })
            .execute();

        return response.status(201).json({ message: "update succeeded" });
    }
}

export { UserController };
