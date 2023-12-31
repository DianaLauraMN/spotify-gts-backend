import axios from "axios";
import { Request, Response } from "express";
import Artist from "../../entities/artist/Artist";
import ArtistAdapter from "../../entities/artist/ArtistAdapter";
import { ApiArtistsInterface } from "../../interfaces/ApiArtists.interface";

class ApiArtistsController implements ApiArtistsInterface {

    async getArtistById(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const artistId = req.params.artistId;
        try {
            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: { 'Authorization': superToken }
            });
            const artist: Artist = ArtistAdapter.adaptArtist(artistResponse.data);
            res.json(artist);
        } catch (error) {
            console.log("Error while getting Artist by Id");
            console.log(error);
        }
    }

    async getArtistsByName(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const artists = await getTypedArtistsByName(itemName, 50, superToken);
            res.json(artists);
        } catch (error) {
            console.log("Error while getting Artists by its name");
            console.log(error);
        }
    }

    async getUserTopArtists(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtistsList = await loadTopArtists(50, superToken);
            const topArtists = getArtistsListTyped(topArtistsList);
            res.json(topArtists);
        } catch (error) {
            console.log('Error while getting User Top Playlists');
            console.log(error);
        }
    }

}

export function getArtistsListTyped(items: any[]): Artist[] {
    const typedArtists: Artist[] = items.map(item => ArtistAdapter.adaptArtist(item));
    return typedArtists;
}

export async function loadTopArtists(limit: number, superToken: string) {
    try {
        const topArtistsResponse = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=${limit}&offset=0`, {
            headers: { 'Authorization': superToken }
        });
        if (topArtistsResponse.data.items) {
            return topArtistsResponse.data.items;
        }
    } catch (error) {
        console.log('Error while loading Top Artist of current user');
        console.log(error);
    }
}

export async function getTypedArtistsByName(itemName: string, limit: number, superToken: string): Promise<Artist[] | undefined> {
    let itemsMapped: Artist[];
    try {
        const itemResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': superToken },
            params: {
                q: itemName,
                type: 'artist',
                market: 'ES',
                limit: limit,
                offset: 0,
            }
        });
        if (itemResponse && itemResponse.data) {
            itemsMapped = getArtistsListTyped(itemResponse.data.artists.items);
            return itemsMapped;
        }
    } catch (error) {
        console.log(`Error while getting artist: ` + itemName);
        console.log(error);
    }
}

export default ApiArtistsController;