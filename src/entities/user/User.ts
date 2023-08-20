export default class User {
    id: string;
    name: string;
    email: string;
    href: string;
    constructor(id: string, name: string, team: string, href: string) {
        this.id = id;
        this.name = name;
        this.email = team;
        this.href = href;
    }
}