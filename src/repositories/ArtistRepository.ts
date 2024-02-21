import axios from "axios";
import Artist from "../entities/artist/Artist";
import { TimeRange } from "../enums/TimeRange";

class ArtistRepository {
    private static instance: ArtistRepository;

    private constructor() { }

    public static getInstance(): ArtistRepository {
        if (!ArtistRepository.instance) {
            ArtistRepository.instance = new ArtistRepository();
        }
        return ArtistRepository.instance;
    }

    async getArtistById(access_token: string | undefined, artistId: string): Promise<Artist> {
        if (!access_token) throw console.error('Error, token expected');
        const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { 'Authorization': access_token }
        });

        return response?.data
    }

    async getArtistsByName(access_token: string | undefined, itemName: string, offset: number, limit: number): Promise<Artist[]> {
        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': access_token },
            params: {
                q: itemName,
                type: 'artist',
                market: 'ES',
                limit: limit,
                offset: offset,
            }
        });

        return response?.data?.artists?.items;
    }

    async getUserTopArtists(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<Artist[]> {
        if (!access_token) throw console.error('Error, token expected');
        const response = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': access_token }
        });

        return response?.data?.items;
    }

    async getSeveralArtists(access_token: string, commaSeparatedIds: string): Promise<Artist[]> {
        const response = await axios.get(`https://api.spotify.com/v1/artists`, {
            headers: { 'Authorization': access_token },
            params: { ids: commaSeparatedIds }
        });

        return response?.data?.artists;
    }
}

export default ArtistRepository;