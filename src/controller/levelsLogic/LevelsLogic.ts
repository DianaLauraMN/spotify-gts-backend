import { Request, Response } from "express";
import EasyLevelLogic from "./easyLevelLogic/EasyLevelLogic";
import NormalLevelLogic from "./normalLevelLogic/NormalLevelLogic";
import { Levels } from "../../enums/Levels";
import HardLevelLogic from "./hardLevelLogic/HardLevelLogic";
class LevelsLogic {
    constructor() {

    }
    async getTracksByLevel(req: Request, res: Response) {
        const { configurationGame } = req.body;
        const { level } = configurationGame;
        let tracks: any[] | undefined;

        if (level === Levels.EASY) {
            const easyLevelLogic: EasyLevelLogic = new EasyLevelLogic();
            easyLevelLogic.setConfigurationGame(configurationGame);
            tracks = await easyLevelLogic.getPlayList(req, res);

        } else if (level === Levels.NORMAL) {
            const normalLevelLogic: NormalLevelLogic = new NormalLevelLogic();
            normalLevelLogic.setConfigurationGame(configurationGame);
            tracks = await normalLevelLogic.getPlayList(req, res);

        } else if (level === Levels.HARD) {
            const hardLevelLogic: HardLevelLogic = new HardLevelLogic();
            hardLevelLogic.setConfigurationGame(configurationGame);
            tracks = await hardLevelLogic.getPlayList(req, res);
        }

        if (tracks) { res.json(tracks); }
    }
}

export default LevelsLogic;