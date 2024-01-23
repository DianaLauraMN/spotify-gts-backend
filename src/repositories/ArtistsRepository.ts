import axios from "axios";
import Artist from "../entities/artist/Artist";
import ArtistAdapter from "../entities/artist/ArtistAdapter";
import TypeManager from "../manager/typeManager/typeManager";
import { TimeRange } from "../enums/TimeRange";

class ArtistsRepository {

    async getArtistById(access_token: string | undefined, artistId: string): Promise<Artist> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: { 'Authorization': access_token }
            });

            const artistData = response.data;

            if (artistData) {
                const artist: Artist = ArtistAdapter.adaptArtist(artistData);
                return artist;
            }

        } catch (error) {
            console.error("Error while getting Artist by Id");
            console.error(error);
        }
    }


    async getArtistsByName(access_token: string | undefined, itemName: string, offset: number, limit: number): Promise<Artist[]> {
        let itemsMapped: Artist[];
        try {
            if (!access_token) throw console.error('Error, token expected');
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

            if (response && response.data) {
                const typeManager = new TypeManager();
                itemsMapped = typeManager.getArtistsListTyped(response.data.artists.items);
                return itemsMapped;
            }

        } catch (error) {
            console.log("Error while getting Artists by its name");
            console.log(error);
        }
    }

    async getUserTopArtists(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<Artist[]> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const response = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=${limit}&offset=${offset}`, {
                headers: { 'Authorization': access_token }
            });

            if (response.data.items) {
                const topArtistsData = response.data.items;
                const typeManager = new TypeManager();
                const userTopArtists = typeManager.getArtistsListTyped(topArtistsData);
                return userTopArtists;
            }

        } catch (error) {
            console.log('Error while getting User Top Artists');
            console.log(error);
        }
    }

}

export default ArtistsRepository;