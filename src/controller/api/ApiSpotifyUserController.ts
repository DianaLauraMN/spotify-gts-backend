import { Request, Response } from "express";
import { ApiUserInterface } from "../../interfaces/ApiUser.interface";
import UserService from "../../service/UserService";

class ApiUserController implements ApiUserInterface {

    async getUserData(req: Request, res: Response) {
        const userService = new UserService();
        const user = await userService.getUser(req, res);
        res.json(user);
    }
}

export default ApiUserController;