import User from "./User";

export default class UserAdapter {
    static adaptUser(user: any): User {
        const { id, display_name, email, href } = user;
        return new User(id, display_name, email, href);
    }
}