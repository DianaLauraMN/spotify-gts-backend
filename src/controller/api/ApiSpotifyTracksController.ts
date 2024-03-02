import { Request, Response } from "express";
import { ApiTracksInterface } from "../../interfaces/ApiTracks.interface";
import TracksService from "../../service/TracksService";

class ApiTracksController implements ApiTracksInterface {

    async getTrackById(req: Request, res: Response) {
        const trackService = new TracksService();
        const track = await trackService.getTrackById(req, res);
        res.json(track);
    }

    async getTracksByName(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getTracksByName(req, res);
        res.json(tracks);
    }

    async getUserTopTracks(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getUserTopTracks(req, res);
        res.json(tracks);
    }

    async getUserPlaylistsTracks(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getUserPlaylistsTracks(req, res);
        res.json(tracks);
    }

    async getUserSavedTracks(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getUserSavedTracks(req, res);
        res.json(tracks);
    }

    async getArtistTopTracks(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getArtistTopTracks(req, res);
        res.json(tracks);
    }

    async getArtistAllTracks(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getArtistAllTracks(req, res);
        res.json(tracks);
    }

    async getUserRecommendations(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getUserRecommendations(req, res);
        res.json(tracks);
    }

    async getSpotifyGenres(req: Request, res: Response) {
        const trackService = new TracksService();
        const genres = trackService.getSpotifyGenres(req, res);
        res.json(genres);
    }

    async getGenresByName(req: Request, res: Response) {
        const trackService = new TracksService();
        const genres = trackService.getGenresByName(req, res);
        res.json(genres);
    }

    async getUserTopGenres(req: Request, res: Response) {
        const trackService = new TracksService();
        const topGenres = await trackService.getUserTopGenres(req, res);
        res.json(topGenres);
    }

    async getUserTopGenresTracks(req: Request, res: Response) {
        const trackService = new TracksService();
        const tracks = await trackService.getUserTopGenresTracksV2(req, res);
        res.json(tracks);
    }

}

export default ApiTracksController;