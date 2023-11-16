import axios from "axios";
import { Request, Response, json } from "express";
import User from "../../entities/user/User";
import UserAdapter from "../../entities/user/UserAdapter";
import { ApiUserInterface } from "../../interfaces/ApiUser.interface";

class ApiUserController implements ApiUserInterface {

    async getUserData(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': superToken },
            });
            const user: User = UserAdapter.adaptUser(profileResponse.data);
            res.json(user);
        } catch (error) {
            console.error('Error while user authentication');
            console.error(error);
        }
    }
}

export default ApiUserController;