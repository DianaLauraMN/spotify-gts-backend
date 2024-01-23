import axios from "axios";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import { TimeRange } from "../enums/TimeRange";
import TypeManager from "../manager/typeManager/typeManager";
import PlaylistManager from "../controller/levelsLogic/PlaylistManager";
import ArtistsRepository from "./ArtistsRepository";
import GenreManager from "../manager/genreManager/GenreManager";
import TracksService from "../service/TracksService";

class TracksRepository {

    private typeManager: TypeManager;

    constructor(typeManager: TypeManager) {
        this.typeManager = typeManager;
    }

    async getTrackById(access_token: string | undefined, trackId: string): Promise<Track | undefined> {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': access_token }
            });

            const trackData = response.data;
            const tracksService = new TracksService();
            return tracksService.getTrackById(trackData);

        } catch (error) {
            console.log("Error while getting Track by Id");
            console.log(error);
        }
    }

    async getTracksByName(access_token: string | undefined, itemName: string): Promise<Track[] | undefined> {
        try {

            if (!access_token) throw console.error('Error, token expected');
            const tracksByName = await this.getTracksTyped('track', itemName, 50, access_token);
            return tracksByName;

        } catch (error) {
            console.log("Error while getting Tracks by its name");
            console.log(error);
        }
    }

    async getUserTopTracks(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}&offset=${offset}`, {
                headers: { 'Authorization': access_token }
            });

            const tracksService = new TracksService();
            return tracksService.getUserTopTracks(topTracksResponse);

        } catch (error) {
            console.log("Error while getting user Top Tracks");
            console.log(error);
        }
    }

    async getUserSavedTracks(access_token: string | undefined, offset: number, limit: number): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: { 'Authorization': access_token },
                params: {
                    market: 'ES',
                    limit,
                    offset,
                }
            });

            const tracksService = new TracksService();
            return tracksService.getUserSavedTracks(savedTracksResponse);

        } catch (error) {
            console.log('Error while getting user Saved Tracks');
            console.log(error);
        }
    }

    async getUserPlaylistsTracks(access_token: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: { 'Authorization': access_token },
                params: {
                    limit: 50,
                    offset: 0,
                }
            });

            //REFACTOR
            const playlistsId = playlistsResponse.data.items.map((playlist: { id: any }) => playlist.id);
            const allTracksTyped = await this.getPlaylistsTracksTyped(playlistsId, access_token);

            return allTracksTyped;
        } catch (error) {
            console.log('Error while getting current user Playlists (owned and followed)');
            console.log(error);
        }
    }

    async getArtistTopTracks(access_token: string | undefined, itemName: string): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const artistsRepository = new ArtistsRepository();
            const artists = await artistsRepository.getArtistsByName(access_token, itemName, 0, 50);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());

            const artistTopTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: { 'Authorization': access_token },
                params: {
                    market: 'ES',
                }
            });

            const tracksService = new TracksService();
            return tracksService.getArtistTopTracks(artistTopTracksResponse);

        } catch (error) {
            console.log('Error while getting Top Tracks by the Artists: ' + itemName);
            console.log(error);
        }
    }

    async getArtistAllTracks(access_token: string | undefined, artistName: string, offset: number, limit: number): Promise<Track[] | undefined> {
        try {
            const allArtistTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': access_token },
                params: {
                    q: `artist:${artistName}`,
                    type: 'track',
                    limit,
                    offset,
                }
            });

            const tracksService = new TracksService();
            return tracksService.getArtistAllTracks(allArtistTracksResponse);

        } catch (error) {
            console.log('Error while getting Tracks by the Artists: ' + artistName);
            console.log(error);
        }
    }

    async getUserRecommendations(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<Track[]> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const artistsRepository = new ArtistsRepository();
            const tracksService = new TracksService();

            const topArtists = await artistsRepository.getUserTopArtists(access_token, 0, 10, time_range);
            const topTracks = await this.getUserTopTracks(access_token, offset, limit, time_range);

            const { commaSeparatedArtistsIds, commaSeparatedGenresIds, commaSeparatedTracksIds } = tracksService.getCommaSeparatedTracksIds(topArtists, topTracks);

            const [artistRecommendations, genresRecommendations, tracksRecommendations] = await Promise.all([
                this.getItemRecommendations('artist', commaSeparatedArtistsIds, 20, access_token),
                this.getItemRecommendations('genres', commaSeparatedGenresIds, 20, access_token),
                this.getItemRecommendations('tracks', commaSeparatedTracksIds, 20, access_token),
            ])

            return tracksService.getAllRecommendatiosTyped(artistRecommendations, genresRecommendations, tracksRecommendations);

        } catch (error) {
            console.log('Error while getting Spotify Recommendations for the current user');
            console.log(error);
        }
    }


    //REFACTOR
    async getUserTopGenresTracks(access_token: string | undefined): Promise<Track[] | undefined> {
        let userTopGenresTracks: Track[] = [];

        try {
            if (!access_token) throw console.error('Error, token expected');
            const artistsRepository = new ArtistsRepository();
            const genreManager = new GenreManager();

            const userTopArtists = await artistsRepository.getUserTopArtists(access_token, 0, 3, TimeRange.medium_term);
            const userTopGenres = genreManager.getUserTopGenresSeeds(userTopArtists);

            for (const genre of userTopGenres) {
                const genreTracksTyped = await this.getTracksByGenre(access_token, genre);
                userTopGenresTracks.push(...genreTracksTyped);
            }

            return userTopGenresTracks;
        } catch (error) {
            console.log('Error while getting Tracks by user Top Genres');
            console.log(error);
        }
    }

    //REFACTOR
    async getTracksByGenre(access_token: string, genreName: string): Promise<Track[]> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            let genreTracks = await this.getTracksTyped('playlist', genreName, 3, access_token);

            if (genreTracks !== undefined) {
                const genreManager = new GenreManager();
                const playlistManager = new PlaylistManager();
                genreTracks = playlistManager.shuffleTracksByFisherYates(genreTracks);

                const genreTracksLimited = genreTracks.slice(0, 50);
                const tracksByGenre = genreManager.filterTracksBySpotifyGenre(access_token, genreTracksLimited);
                return tracksByGenre;
            }
        } catch (error) {
            console.log('Error while getting tracks by genre ' + genreName);
            console.log(error);
        }
    }

    //REFACTOR
    async getTracksTyped(type: string, itemName: string, limit: number, access_token: string): Promise<Track[] | undefined> {
        let itemsMapped: any[''];
        try {
            const itemResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': access_token },
                params: {
                    q: itemName,
                    type: type,
                    market: 'ES',
                    limit: limit,
                    offset: 0,
                }
            });
            if (itemResponse && itemResponse.data) {
                if (type === 'track' && itemResponse.data.tracks.items) {
                    itemsMapped = this.typeManager.typeTrackList(itemResponse.data.tracks.items);
                } else if (type === 'playlist' && itemResponse.data.playlists.items) {
                    const playlistsId = itemResponse.data.playlists.items.map((playlist: { id: string }) => playlist.id);
                    itemsMapped = await this.getPlaylistsTracksTyped(playlistsId, access_token);
                }

                return itemsMapped;
            }
        } catch (error) {
            console.log(`Error while getting ${type}:` + itemName);
            console.log(error);
        }
    }

    async getPlaylistAllTracks(access_token: string | undefined, playlistId: string): Promise<Track[]> {
        try {

            const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: { 'Authorization': access_token },
                params: { market: 'ES,US,MX' }
            });

            const tracksService = new TracksService();
            return tracksService.getPlaylistAllTracks(playlistsResponse);

        } catch (error) {
            console.log('Error while getting playlist ' + playlistId + ' all Tracks');
            console.log(error);
        }
    }

    //REFACTOR
    async getPlaylistsTracksTyped(playlistsId: string[], access_token: string): Promise<Track[]> {
        try {
            const allTracks: Track[] = [];

            for (const playlistId of playlistsId) {
                try {
                    const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                        headers: { 'Authorization': access_token },
                        params: { market: 'ES' }
                    });

                    if (playlistsResponse && playlistsResponse.data && playlistsResponse.data.tracks) {
                        const playlistTracks: Track[] = playlistsResponse.data.tracks.items.map((item: any) => item.track);
                        allTracks.push(...playlistTracks);
                    }
                } catch (error) {
                    console.error(`Error obteniendo tracks para la playlist ${playlistId}:`, error);
                }
            }

            if (allTracks.length > 0) {
                const allTracksTyped: Track[] = this.typeManager.getValidTracks(allTracks);
                if (allTracksTyped.length > 0)
                    return allTracksTyped;
            }

            return allTracks;
        } catch (error) {
            console.log(error);
        }
    }

    getGenresByName(genre: string) {
        const tracksService = new TracksService();
        return tracksService.getGenresByName(genre);
    }

    async getUserTopGenres(access_token: string | undefined): Promise<string[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const artistsRepository = new ArtistsRepository();
            const topArtistsList = await artistsRepository.getUserTopArtists(access_token, 0, 10, TimeRange.medium_term);

            const tracksService = new TracksService();
            return tracksService.getUserTopGenres(topArtistsList);

        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
    }

    async getItemRecommendations(type: string, itemList: string, limit: number, access_token: string) {
        let seedArtist = "";
        let seedGenres = "";
        let seedTracks = "";

        try {
            if (type === 'artist') {
                seedArtist = itemList;
            } else if (type === 'genres') {
                seedGenres = itemList;
            } else if (type === 'tracks') {
                seedTracks = itemList;
            }

            const recommendationsResponse = await axios.get('https://api.spotify.com/v1/recommendations', {
                headers: { 'Authorization': access_token },
                params: {
                    limit: limit,
                    market: 'ES',
                    seed_artists: seedArtist,
                    seed_genres: seedGenres,
                    seed_tracks: seedTracks,
                }
            });

            return recommendationsResponse.data;
        } catch (error) {
            console.log('Error while getting Spotify Recommendations for the current user');
            console.log(error);
        }
    }

}


export default TracksRepository;