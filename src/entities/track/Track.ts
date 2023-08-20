import Artist from "../artist/Artist";

export default class Track {
    id: string;
    name: string;
    artists: Artist[];
    album: any;
    duration_ms: number;
    external_urls: string;
    popularity: number;
    preview_url: string;
    type: string;
    constructor(id: string, name: string, artists: Artist[], album: any, duration_ms: number, external_urls: string, popularity: number, preview_url: string, type: string) {
        this.id = id;
        this.name = name;
        this.artists = artists;
        this.album = album;
        this.duration_ms = duration_ms;
        this.external_urls = external_urls;
        this.popularity = popularity;
        this.preview_url = preview_url;
        this.type = type;
    }
}