import { Request, Response } from "express";
import User from "../entities/user/User";
import Artist from "../entities/artist/Artist";
import Track from "../entities/track/Track";

export interface ApiControllerInterface {
    getAuthentication(req: Request, res: Response): Promise<void>;
    getCallback(req: Request, res: Response): Promise<void>;
    getUserData(req: Request, res: Response): Promise<void>;
    getArtistById(req: Request, res: Response): Promise<void>;
    getTrackById(req: Request, res: Response): Promise<void>;
    getArtistsByName(req: Request, res: Response): Promise<void>;
    getTracksByName(req: Request, res: Response): Promise<void>;
    getUserTopTracks(req: Request, res: Response): Promise<void>;
    getArtistTopTracks(req: Request, res: Response): Promise<void>;
    getAllArtistTracks(req: Request, res: Response): Promise<void>;
    getUserTopArtists(req: Request, res: Response): Promise<void>;
    getUserPlaylistsTracks(req: Request, res: Response): Promise<void>;
    getUserSavedTracks(req: Request, res: Response): Promise<void>;
    getUserRecommendations(req:Request, res:Response): Promise<void>;
    getTracksByGenre(req:Request, res:Response): Promise<void>;
    getUserTopGenres(req:Request, res:Response): Promise<void>;
}