import { NextFunction, Request, Response } from "express";

import jwt, {decode} from 'jsonwebtoken';

import { getCustomRepository } from 'typeorm';
import { UserRepository } from '../repositories/UserRepository';

async function decoder(request: Request, response: Response) {
    const token = <string>request.headers.authorization;
    let id: string;

    jwt.verify(token, process.env.SECRET, async function(err, decoded) {
        if (err) {
            return response.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
        }

        const payload = decode(token);
        const user_id = payload.sub;

        id = user_id.toString();
        return user_id;
    });

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findOne({id: id});

    return user;
}

function is(roles: String[]) {
    const roleAuthorized = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        const user = await decoder(request, response);

        if(user) {
            const user_role = user.role;

            const index = roles.indexOf(user_role);
    
            if(index !== -1) {
                next();
            }
            else {
                return response.status(401).json({ message: "Not authorized!" });
            }   
        }
    };
    
    return roleAuthorized;
    }

export {is};