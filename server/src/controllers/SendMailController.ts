import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import { UserRepository } from '../repositories/UserRepository';

import SendMailService from '../services/SendMailService';

import {resolve} from 'path';
import { hash } from 'bcryptjs';


class SendMailController {
    async execute(request: Request, response: Response) {
        const {email} = request.body;

        console.log(email);

        const usersRepository = getCustomRepository(UserRepository);

        const user = await usersRepository.findOne({email});
        

        if(!user) {
            return response.status(400).json({
                error: "User not found!",
            });
        }

        //atualizar senha
        const newPassword = Math.random().toString(36).substr(2, 8);

        //Criptografar a Senha
        const hashedPassword = await hash(newPassword, 8);

        try {
            //Atualizar senha
            await usersRepository
            .createQueryBuilder()
            .update({
                password: hashedPassword
            })
            .where({id: user.id})
            .execute()
        } catch (error) {
            return response.status(400).json({error: 'Email not sent!'});
        }

        //Enviar email para o usuário
        const npsPath = resolve(__dirname, "..", "..", "templates", "npsMail.hbs");

        const variables = {
            name: user.name,
            pass: newPassword,
            description: 'Essa é sua nova senha na plataforma Downfast: '
        }

        try {
            await SendMailService.execute(
                email,
                variables, 
                npsPath,
            );

            return response.status(200).json('Email sent successfully!');
        } catch (error) {
            console.log(error);
            return response.status(400).json({error: 'Email not sent!'});
        }

    }
}

export { SendMailController };