export default class User {
    id: string;
    name: string;
    email: string;
    href: string;
    constructor(id: string, display_name: string, email: string, href: string) {
        this.id = id;
        this.name = display_name;
        this.email = email;
        this.href = href;
    }
}