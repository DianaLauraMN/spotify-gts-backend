import User from "./User";

export default class UserAdapter {
    static adaptUser(user: any): User {
        const { id, name, email, href } = user;
        return new User(id, name, email, href);
    }
}