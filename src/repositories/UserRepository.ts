import axios from "axios";
import User from "../entities/user/User";

class UserRepository {
    private static instance: UserRepository;

    private constructor() { }

    public static getInstance() {
        if (!UserRepository.instance) {
            UserRepository.instance = new UserRepository();
        }
        return UserRepository.instance;
    }

    async getUser(access_token: string | undefined): Promise<User> {
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': access_token },
        });

        return userResponse.data;
    }
}

export default UserRepository;