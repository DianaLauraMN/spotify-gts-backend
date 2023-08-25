export default class User {
    id: string;
    name: string;
    email: string;
    href: string;
    constructor(id: string, display_name: string, team: string, href: string) {
        this.id = id;
        this.name = display_name;
        this.email = team;
        this.href = href;
    }
}