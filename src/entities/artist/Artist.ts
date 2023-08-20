export default class Artist {
    id: string;
    name: string;
    images: any[];
    external_urls: string;
    popularity: number;
    type: string;
    genres: string[];
    constructor(id: string, name: string, images: any[], external_urls: string, popularity: number, type: string, genres: string[]) {
        this.id = id;
        this.name = name;
        this.images = images;
        this.external_urls = external_urls;
        this.popularity = popularity;
        this.type = type;
        this.genres = genres;
    }
}