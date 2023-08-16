import { Request, Response } from "express";

export interface ApiControllerInterface {
    getAuthentication(req: Request, res: Response): Promise<void>;
    getCallback(req: Request, res: Response): Promise<void>;
    getUserData(req: Request, res: Response): Promise<void>;
    getArtistById(req: Request, res: Response): Promise<void>;
    getTrackById(req: Request, res: Response): Promise<void>;
    getItemArtists(req: Request, res: Response): Promise<void>;
    getItemTracks(req: Request, res: Response): Promise<void>;
    getUserTopTracks(req: Request, res: Response): Promise<void>;
    getArtistTopTracks(req: Request, res: Response): Promise<void>;
    getUserTopArtists(req: Request, res: Response): Promise<void>;
    getUserPlaylists(req: Request, res: Response): Promise<void>;
}