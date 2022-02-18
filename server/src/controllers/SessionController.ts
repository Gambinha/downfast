import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { UserRepository } from '../repositories/UserRepository';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const SECRET = 'dadwdawdw';

class SessionController {
    async create (request: Request, response: Response) {
            const {
                email, 
                password
            } = request.body;
    
            const userRepository = getCustomRepository(UserRepository);
    
            const user = await userRepository.findOne({email});

            if(!user) {
                return response.status(400).json({error: "User not found!"});
            }
    
            const matchPassword = await compare(password, user.password);
    
            if(!matchPassword) {
                return response.status(400).json({error: "Incorrect User or Password!"});
            }
    
            const token = sign({}, process.env.SECRET, {
                subject: user.id,
                expiresIn: '1d'
            }); 
    
            delete user.password;
            delete user.createdAt;
    
            return response.status(201).json({
                token,
                user
            });        
        
    }

    validToken(request: Request, response: Response) {
        return response.status(201).json({message: 'Token is Valid!'});   
    }
}

export {SessionController};