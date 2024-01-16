import Track from "../entities/track/Track";
import { Request, Response } from "express";
import { ConfigurationGame } from "./ConfigurationGame.interface";

export interface LevelLogicInterface {
    setConfigurationGame(configurationGame: ConfigurationGame): void;
    getPlayList(req: Request, res: Response): Promise<Track[] | undefined>;
}