import Track from "../entities/track/Track";
import { Request, Response } from "express";

export interface LevelLogicInterface {
    getPlayList(req: Request, res: Response): Promise<Track[]|undefined>;
}