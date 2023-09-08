import { Request, Response } from "express";

export interface ApiTracksInterface {
    getTrackById(req: Request, res: Response): Promise<void>;
    getTracksByName(req: Request, res: Response): Promise<void>;
    getUserTopTracks(req: Request, res: Response): Promise<void>;
    getArtistTopTracks(req: Request, res: Response): Promise<void>;
    getArtistAllTracks(req: Request, res: Response): Promise<void>;
    getUserPlaylistsTracks(req: Request, res: Response): Promise<void>;
    getUserSavedTracks(req: Request, res: Response): Promise<void>;
    getUserRecommendations(req:Request, res:Response): Promise<void>;
    getUserTopGenresTracks(req:Request, res:Response): Promise<void>;
    getUserTopGenres(req:Request, res:Response): Promise<void>;
}