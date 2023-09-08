import { Request, Response } from "express";

export interface ApiArtistsInterface {
    getArtistById(req: Request, res: Response): Promise<void>;
    getArtistsByName(req: Request, res: Response): Promise<void>;
    getUserTopArtists(req: Request, res: Response): Promise<void>;
}