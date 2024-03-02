import User from "../entities/user/User";
import UserRepository from "../repositories/UserRepository";
import { Request, Response } from "express";
import ErrorStatusCode from "../utilities/ErrorStatusCode";
import { ErrorUserMessages } from "../utilities/ErrorUserMessages";
import UserAdapter from "../entities/user/UserAdapter";

class UserService {
    private userRepository: UserRepository = UserRepository.getInstance();

    async getUser(req: Request, res: Response): Promise<User | undefined> {

        try {
            const access_token = req.headers.authorization;
            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorUserMessages.TOKEN_EXPECTED });
            const userData = await this.userRepository.getUser(access_token);
            const user: User = UserAdapter.adaptUser(userData);
            return user;
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorUserMessages.GETTING_USER });
        }
    }
}

export default UserService;