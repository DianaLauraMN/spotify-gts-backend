import Artist from "./Artist";

export default class ArtistAdapter {
    static adaptArtist(artist: any): Artist {
        const { id, name, images, external_urls, popularity, type, genres } = artist;
        return new Artist(id, name, images, external_urls, popularity, type, genres);
    }
}