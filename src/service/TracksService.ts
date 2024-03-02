import { Request, Response } from "express";
import PlaylistManager from "../controller/levelsLogic/PlaylistManager";
import Artist from "../entities/artist/Artist";
import Track from "../entities/track/Track";
import { TimeRange } from "../enums/TimeRange";
import GenreManager from "../manager/genreManager/GenreManager";
import typeManager from "../manager/typeManager/instanceTM";
import TrackRepository from "../repositories/TrackRepository";
import ErrorStatusCode from "../utilities/ErrorStatusCode";
import { ErrorTrackMessages } from "../utilities/ErrorTrackMessages";
import ArtistRepository from "../repositories/ArtistRepository";

class TracksService {
    private trackRepository: TrackRepository = TrackRepository.getInstance();

    async getTrackById(req: Request, res: Response): Promise<Track | undefined> {
        try {
            const trackId = req.params.trackId;
            const access_token = req.headers.authorization;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            return await this.trackRepository.getTrackById(access_token, trackId);
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_TRACK_BY_ID });
        }
    }

    async getTracksByName(req: Request, res: Response): Promise<Track[] | undefined> {
        try {
            const access_token = req.headers.authorization;
            const itemName = req.params.itemName;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            return await this.trackRepository.getTracksByName(access_token, itemName);
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_TRACKS_BY_NAME });
        }
    }

    async getUserTopTracks(req: Request, res: Response): Promise<Track[] | undefined> {
        try {
            const access_token = req.headers.authorization;
            let timeRangeEnumValue = typeManager.getTimeRange(req.query.time_range.toString());
            let offsetTyped = parseInt(req.query.offset.toString());
            let limitTyped = parseInt(req.query.limit.toString());

            if (offsetTyped < 0 || limitTyped < 1) {
                offsetTyped = 0;
                limitTyped = 10;
            }

            if (!timeRangeEnumValue) {
                timeRangeEnumValue = typeManager.getTimeRange('medium_term');
            }

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const response = await this.trackRepository.getUserTopTracks(access_token, offsetTyped, limitTyped, timeRangeEnumValue);
            const userTopTracksTyped = typeManager.typeTrackList(response);
            return userTopTracksTyped;

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTINGS_USER_TOP_TRACKS });
        }
    }

    async getUserPlaylistsTracks(req: Request, res: Response): Promise<Track[] | undefined> {
        let itemsMapped: Track[];
        try {
            const access_token = req.headers.authorization;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const response = await this.trackRepository.getUserPlaylistsTracks(access_token);
            const playlistsId = response.items.map((playlist: { id: any }) => playlist.id);
            const allTracks = await this.trackRepository.getPlaylistsTracks(playlistsId, access_token);

            if (allTracks.length > 0) {
                itemsMapped = typeManager.getValidTracks(allTracks);
            }

            return itemsMapped;
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTINGS_USER_PLAYLISTS_TRACKS });
        }
    }

    async getUserSavedTracks(req: Request, res: Response): Promise<Track[] | undefined> {
        try {
            const access_token = req.headers.authorization;
            let offsetTyped = parseInt(req.query.offset.toString());
            let limitTyped = parseInt(req.query.limit.toString());

            if (offsetTyped < 0 || limitTyped < 1) {
                offsetTyped = 0;
                limitTyped = 10;
            }

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const response = await this.trackRepository.getUserSavedTracks(access_token, offsetTyped, limitTyped);

            if (response) {
                const userSavedTracks = response.map((item: { track: any; }) => item.track);
                const userSavedTracksTyped = typeManager.typeTrackList(userSavedTracks);
                return userSavedTracksTyped;
            }
            return [];
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_USER_SAVED_TRACKS });
        }
    }

    async getArtistTopTracks(req: Request, res: Response): Promise<Track[] | undefined> {
        try {
            const access_token = req.headers.authorization;
            const itemName = req.params.itemName;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const artistRepository = ArtistRepository.getInstance();
            const artists: Artist[] = await artistRepository.getArtistsByName(access_token, itemName, 0, 50);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());

            const response = await this.trackRepository.getArtistTopTracks(access_token, artistRequired);

            if (response) {
                const artistTopTracksTyped = typeManager.typeTrackList(response);
                return artistTopTracksTyped;
            }

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_ARTIST_TOP_TRACKS });
        }
    }

    async getArtistAllTracks(req: Request, res: Response): Promise<Track[] | undefined> {
        try {
            const access_token = req.headers.authorization;
            const artistName = req.params.artistName;
            let offsetTyped = parseInt(req.query.offset.toString());
            let limitTyped = parseInt(req.query.limit.toString());

            if (offsetTyped < 0 || limitTyped < 1) {
                offsetTyped = 0;
                limitTyped = 10;
            }

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const response = await this.trackRepository.getArtistAllTracks(access_token, artistName, offsetTyped, limitTyped);

            if (response) {
                return typeManager.typeTrackList(response);
            }

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_ARTIST_ALL_TRACKS });
        }
    }

    async getUserRecommendations(req: Request, res: Response): Promise<Track[]> {
        try {
            const access_token = req.headers.authorization;
            let offsetTyped = parseInt(req.query.offset.toString());
            let limitTyped = parseInt(req.query.limit.toString());
            let timeRangeEnumValue = typeManager.getTimeRange(req.query.time_range.toString());

            if (offsetTyped < 0 || limitTyped < 1) {
                offsetTyped = 0;
                limitTyped = 10;
            }
            if (!timeRangeEnumValue) {
                timeRangeEnumValue = typeManager.getTimeRange('medium_term');
            }

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const artistRepository = ArtistRepository.getInstance();
            const topArtists: Artist[] = await artistRepository.getUserTopArtists(access_token, 0, 10, timeRangeEnumValue);
            const topTracks = await this.trackRepository.getUserTopTracks(access_token, offsetTyped, limitTyped, timeRangeEnumValue);
            const topTracksTyped = typeManager.getValidTracks(topTracks);

            const { commaSeparatedArtistsIds, commaSeparatedGenresIds, commaSeparatedTracksIds } = this.getCommaSeparatedTracksIds(topArtists, topTracksTyped);
            const response = await this.trackRepository.getUserRecommendations(access_token, offsetTyped, limitTyped, timeRangeEnumValue, commaSeparatedArtistsIds, commaSeparatedGenresIds, commaSeparatedTracksIds);

            const { artistRecommendations, genresRecommendations, tracksRecommendations } = response;
            const tracksRecommended = this.getAllRecommendatiosTyped(artistRecommendations, genresRecommendations, tracksRecommendations);

            return tracksRecommended;
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_USER_RECOMMENDATIONS });
        }
    }

    getSpotifyGenres(req: Request, res: Response): string[] {
        try {
            const access_token = req.headers.authorization;
            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });

            const genreManager = new GenreManager();
            return genreManager.getSpotifyGenresSeedsCopy();
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_SPOTIFY_GENRES });
        }
    }

    getGenresByName(req: Request, res: Response): string[] {
        try {
            const access_token = req.headers.authorization;
            const itemName = req.params.itemName;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const genreManager = new GenreManager();
            const searchTerm = itemName.toLowerCase();
            const genres = genreManager.getSpotifyGenresSeedsCopy();

            const suggestions = genres.filter(genre => genre.toLowerCase().includes(searchTerm));
            return suggestions.sort((a, b) => genreManager.similarityScore(searchTerm, b) - genreManager.similarityScore(searchTerm, a));
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_GENRES_BY_NAME });
        }
    }

    async getUserTopGenres(req: Request, res: Response): Promise<string[]> {
        try {
            const access_token = req.headers.authorization;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const genreManager = new GenreManager();
            const artistRepository = ArtistRepository.getInstance();
            const topArtistsList: Artist[] = await artistRepository.getUserTopArtists(access_token, 0, 10, TimeRange.medium_term);
            return genreManager.getUserTopGenresSeeds(topArtistsList);

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_USER_TOP_GENRES });
        }
    }

    async getUserTopGenresTracksV2(req: Request, res: Response): Promise<Track[]> {
        let userTopGenresTracks: Track[] = [];

        try {
            const access_token = req.headers.authorization;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorTrackMessages.TOKEN_EXPECTED });
            const genreManager = new GenreManager();
            const artistRepository = ArtistRepository.getInstance();
            const userTopArtists = await artistRepository.getUserTopArtists(access_token, 0, 3, TimeRange.medium_term);
            const userTopGenres = genreManager.getUserTopGenresSeeds(userTopArtists);

            for (const genre of userTopGenres) {
                const genreTracksTyped = await this.getTracksByGenre(access_token, genre);
                userTopGenresTracks.push(...genreTracksTyped);
            }

            return userTopGenresTracks;
        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorTrackMessages.GETTING_USER_TOP_GENRES_TRACKS });
        }
    }

    async searchTrackItemTyped(type: string, itemName: string, limit: number, access_token: string): Promise<Track[] | undefined> {
        let itemsMapped: Track[];
        
        const response = await this.trackRepository.searchTrackItem(type, itemName, limit, access_token);

        if (response) {
            if (type === 'track' && response.tracks.items) {
                itemsMapped = typeManager.typeTrackList(response.tracks.items);

            } else if (type === 'playlist' && response.playlists.items) {
                const playlistsId = response.playlists.items.map((playlist: { id: string }) => playlist.id);
                const allTracks = await this.trackRepository.getPlaylistsTracks(playlistsId, access_token);

                if (allTracks.length > 0) {
                    itemsMapped = typeManager.getValidTracks(allTracks);
                }
            }

            if (itemsMapped.length > 0) return itemsMapped;
        }

    }

    getCommaSeparatedTracksIds(topArtists: Artist[], topTracks: Track[]) {
        const genreManager = new GenreManager();
        const topGenres = genreManager.getUserTopGenresSeeds(topArtists);

        const topFiveArtist = typeManager.getSubsetArray(topArtists, 5);
        const topFiveTracks = typeManager.getSubsetArray(topTracks, 5);
        const topFiveGenres = typeManager.getSubsetArray(topGenres, 5);

        const topFiveArtistsId = topFiveArtist.map(item => item.id);
        const topFiveTracksId = topFiveTracks.map(item => item.id);

        const commaSeparatedArtistsIds = topFiveArtistsId.join(',');
        const commaSeparatedTracksIds = topFiveTracksId.join(',');
        const commaSeparatedGenresIds = topFiveGenres.join(',');

        return {
            commaSeparatedArtistsIds,
            commaSeparatedTracksIds,
            commaSeparatedGenresIds,
        }
    }

    getAllRecommendatiosTyped(artistRecommendations: any, genresRecommendations: any, tracksRecommendationS: any): Track[] {
        const artistRecommendationsTyped = typeManager.typeTrackList(artistRecommendations.tracks);
        const genresRecommendationsTyped = typeManager.typeTrackList(genresRecommendations.tracks);
        const tracksRecommendationsTyped = typeManager.typeTrackList(tracksRecommendationS.tracks);

        const allRecommendationsTyped = [...artistRecommendationsTyped, ...tracksRecommendationsTyped, ...genresRecommendationsTyped];
        return allRecommendationsTyped;
    }

    async getTracksByGenre(access_token: string, genreName: string): Promise<Track[]> {
        let genreTracks = await this.searchTrackItemTyped('playlist', genreName, 3, access_token);

        if (genreTracks !== undefined) {
            const genreManager = new GenreManager();
            const playlistManager = new PlaylistManager();
            genreTracks = playlistManager.shuffleTracksByFisherYates(genreTracks);

            const genreTracksLimited = genreTracks.slice(0, 50);
            const tracksByGenre = genreManager.filterTracksBySpotifyGenre(access_token, genreTracksLimited);
            return tracksByGenre;
        }

        return [];
    }
}

export default TracksService;