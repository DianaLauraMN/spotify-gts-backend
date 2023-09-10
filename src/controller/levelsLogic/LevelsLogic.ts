import { Request, Response } from "express";
import EasyLevelLogic from "./EasyLevelLogic";

class LevelsLogic {
    // normalLevelLogic: EasyLevelLogic;
    // hardLevelLogic: EasyLevelLogic;
    constructor() {

    }
    async getTracksByLevel(req: Request, res: Response) {
        const { configurationGame } = req.body;
        console.log(configurationGame);
        
        const { level } = configurationGame;
        let tracks: any[] | undefined;
        if (level === "EASY") {
            const easyLevelLogic: EasyLevelLogic = new EasyLevelLogic();
            easyLevelLogic.setConfigurationGame(configurationGame);
            tracks = await easyLevelLogic.getPlayList(req, res);
        }
        // else if (level === "NORMAL") {

        // } else if (level === "HARD"){

        // }else{
        //     throw new Error('Configuration level must be EASY, NORMAL or HARD')
        // }

        res.json(tracks);
    }
}

export default LevelsLogic;