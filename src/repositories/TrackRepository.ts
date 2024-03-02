import axios from "axios";
import Track from "../entities/track/Track";
import { TimeRange } from "../enums/TimeRange";
import Artist from "../entities/artist/Artist";

class TrackRepository {
    private static instance: TrackRepository;

    private constructor() { }

    public static getInstance() {
        if (!TrackRepository.instance) {
            TrackRepository.instance = new TrackRepository();
        }
        return TrackRepository.instance;
    }

    async getTrackById(access_token: string | undefined, trackId: string): Promise<Track | undefined> {
        const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { 'Authorization': access_token }
        });

        return response?.data;
    }

    async getTracksByName(access_token: string | undefined, itemName: string): Promise<Track[] | undefined> {
        const tracksByName = await this.searchTrackItem('track', itemName, 50, access_token);
        return tracksByName;
    }

    async searchTrackItem(type: string, itemName: string, limit: number, access_token: string): Promise<any> {
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

        if (itemResponse?.data?.playlist) return itemResponse.data.playlists.items;
        else return itemResponse?.data;
    }

    async getUserTopTracks(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<any> {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': access_token }
        });

        return topTracksResponse?.data?.items;
    }

    async getUserPlaylistsTracks(access_token: string | undefined): Promise<any> {
        const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: { 'Authorization': access_token },
            params: {
                limit: 50,
                offset: 0,
            }
        });

        return playlistsResponse?.data;
    }

    async getUserSavedTracks(access_token: string | undefined, offset: number, limit: number): Promise<any> {
        const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
            headers: { 'Authorization': access_token },
            params: {
                market: 'ES',
                limit,
                offset,
            }
        });

        return savedTracksResponse?.data?.items;
    }

    async getArtistTopTracks(access_token: string | undefined, artistRequired: Artist): Promise<any> {
        const artistTopTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
            headers: { 'Authorization': access_token },
            params: {
                market: 'ES',
            }
        });

        return artistTopTracksResponse?.data?.tracks;
    }

    async getArtistAllTracks(access_token: string | undefined, artistName: string, offset: number, limit: number): Promise<any> {
        const allArtistTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': access_token },
            params: {
                q: `artist:${artistName}`,
                type: 'track',
                limit,
                offset,
            }
        });

        return allArtistTracksResponse?.data?.tracks?.items;
    }


    async getUserRecommendations(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange, commaSeparatedArtistsIds: string, commaSeparatedGenresIds: string, commaSeparatedTracksIds: string): Promise<any> {
        const [artistRecommendations, genresRecommendations, tracksRecommendations] = await Promise.all([
            this.getItemRecommendations('artist', commaSeparatedArtistsIds, 20, access_token),
            this.getItemRecommendations('genres', commaSeparatedGenresIds, 20, access_token),
            this.getItemRecommendations('tracks', commaSeparatedTracksIds, 20, access_token),
        ])

        return { artistRecommendations, genresRecommendations, tracksRecommendations };
    }

    async getItemRecommendations(type: string, itemList: string, limit: number, access_token: string) {
        let seedArtist = "";
        let seedGenres = "";
        let seedTracks = "";

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
    }

    async getPlaylistsTracks(playlistsId: string[], access_token: string): Promise<Track[]> {
        const playlistPromises = playlistsId.map(async (playlistId) => {
            const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: { 'Authorization': access_token },
                params: {
                    market: 'ES',
                    fields: 'items(track(id,name,artists,album,duration_ms,external_urls,popularity,preview_url,type))',
                },
            });

            return playlistsResponse.data?.items?.map((item: any) => item.track);
        });

        const playlistsTracks = await Promise.all(playlistPromises);
        return playlistsTracks.flatMap(track => track || []);
    }



}

export default TrackRepository;