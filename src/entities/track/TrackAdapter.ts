import Track from "./Track";

export default class TrackAdapter {
    static adaptTrack(track: any): Track {
        const { id, name, artists, album, duration_ms, external_urls, popularity, preview_url, type } = track;
        return new Track(id, name, artists, album, duration_ms, external_urls, popularity, preview_url, type);
    }
}