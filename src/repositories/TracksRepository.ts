import axios from "axios";
import { getTracksListsTyped, getTypedItemByType, getUserTopGenresSeeds, loadTopTracks } from "../controller/api/ApiSpotifyTracksController";
import { loadTopArtists } from "../controller/api/ApiSpotifyArtistsController";
import Track from "../entities/track/Track";

class TracksRepository {

    async getUserTopTracks(superToken: string | undefined) {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topTracksList = await loadTopTracks(superToken);
            const topTracks = getTracksListsTyped(topTracksList);
            return topTracks;
        } catch (error) {
            console.log("Error while getting User Top Tracks");
            console.log(error);
        }
    }

    async getUserSavedTracks(superToken: string | undefined) {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: { 'Authorization': superToken },
                params: {
                    market: 'ES',
                    limit: 50,
                    offset: 0,
                }
            });
            const tracksList = savedTracksResponse.data.items.map((item: { track: any; }) => item.track);
            const savedTracks = getTracksListsTyped(tracksList);
            return savedTracks;
        } catch (error) {
            console.log('Error while getting user saved Tracks');
            console.log(error);
        }
    }

    async getArtistTopTracks(superToken: string | undefined, itemName: string) {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const artists = await getTypedItemByType('artist', itemName, 50, superToken);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());
            const artistTopTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: { 'Authorization': superToken },
                params: {
                    market: 'ES',
                }
            });
            const artistTopTracks = getTracksListsTyped(artistTopTracksResponse.data.tracks);
            return artistTopTracks;
        } catch (error) {
            console.log('Error while getting tracks by the Artists: ' + itemName);
            console.log(error);
        }
    }

    async getUserTopGenresTracks(superToken: string | undefined) {
        let userTopGenresTracks: Track[] = [];
        try {
            if (!superToken) throw console.error('Error, token expected');
            const userTopArtists = await loadTopArtists(10, superToken);
            console.log('USER TOP ARTIST ' + userTopArtists.length);

            const userTopGenres = await getUserTopGenresSeeds(userTopArtists, superToken);
            console.log('USER TOP GENRES SEEDS ' + userTopGenres.length);

            for (const genre of userTopGenres) {
                console.log(genre);
                const tracksByGenre = await this.getTracksByGenre(superToken, genre);
                console.log('TRACKS DEL GENERO ' + genre + ' ' + tracksByGenre.length);

                userTopGenresTracks.push(...tracksByGenre);
                console.log('union de todos los tracks de todos los generos ' + userTopGenresTracks.length);

            }

            return userTopGenresTracks;
        } catch (error) {

        }
    }

    async getTracksByGenre(superToken: string, genreName: string) {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const genreTracks = await getTypedItemByType('playlist', genreName, 2, superToken);
            return genreTracks;
        } catch (error) {
            console.log('Error while getting tracks by genre ' + genreName);
            console.log(error);
        }
    }
}

export default TracksRepository;