import { Request, Response } from "express";
import { ApiTracksInterface } from "../../interfaces/ApiTracks.interface";
import TracksRepository, { getTimeRange } from "../../repositories/TracksRepository";
import { TimeRange } from "../../enums/TimeRange";

class ApiTracksController implements ApiTracksInterface {

    async getTrackById(req: Request, res: Response) {
        const trackId = req.params.trackId;
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const track = await tracksRepository.getTrackById(superToken, trackId);
        res.json(track);
    }

    async getTracksByName(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getTracksByName(superToken, itemName);
        res.json(tracks);
    }

    async getUserTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const { offset, limit, time_range } = req.query;
        const timeRangeEnumValue = getTimeRange(time_range.toString());
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getUserTopTracks(superToken, parseInt(offset.toString()), parseInt(limit.toString()), timeRangeEnumValue);
        res.json(tracks);
    }

    async getUserPlaylistsTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getUserPlaylistsTracks(superToken);
        res.json(tracks);
    }

    async getUserSavedTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const { offset, limit } = req.query;
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getUserSavedTracks(superToken, parseInt(offset.toString()), parseInt(limit.toString()));
        res.json(tracks);
    }

    async getArtistTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getArtistTopTracks(superToken, itemName);
        res.json(tracks);
    }

    async getArtistAllTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const artistName = req.params.artistName;
        const { offset, limit } = req.query;
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getArtistAllTracks(superToken, artistName, parseInt(offset.toString()), parseInt(limit.toString()));
        res.json(tracks);
    }

    async getUserRecommendations(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const { offset, limit, time_range } = req.query;
        const timeRangeEnumValue = getTimeRange(time_range.toString());
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getUserRecommendations(superToken, parseInt(offset.toString()), parseInt(limit.toString()), timeRangeEnumValue);
        res.json(tracks);
    }

    async getUserTopGenresTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const tracks = await tracksRepository.getUserTopGenresTracks(superToken);
        res.json(tracks);
    }

    async getUserTopGenres(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const topGenres = await tracksRepository.getUserTopGenres(superToken);
        res.json(topGenres);
    }

    async getSpotifyGenres(req: Request, res: Response) {
        const tracksRepository = new TracksRepository();
        const genres = tracksRepository.getSpotifyGenresSeedsCopy();
        res.json(genres);
    }

    async getGenresByName(req: Request, res: Response) {
        const itemName = req.params.itemName;
        const tracksRepository = new TracksRepository();
        const genres = tracksRepository.getGenresByName(itemName);
        res.json(genres);
    }

}

export default ApiTracksController;