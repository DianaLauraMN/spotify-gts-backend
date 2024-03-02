import { Request, Response } from "express";
import EasyLevelLogic from "./easyLevelLogic/EasyLevelLogic";
import NormalLevelLogic from "./normalLevelLogic/NormalLevelLogic";
import { Levels } from "../../enums/Levels";
import HardLevelLogic from "./hardLevelLogic/HardLevelLogic";
import Track from "../../entities/track/Track";
import { LevelLogicInterface } from "../../interfaces/LevelLogic.interface";
class LevelsLogic {
    constructor() {
        this.getTracksByLevel = this.getTracksByLevel.bind(this);
        this.initializeLevelLogic = this.initializeLevelLogic.bind(this);
    }
    async getTracksByLevel(req: Request, res: Response) {
        const { configurationGame } = req.body;
        const { level } = configurationGame;
        
        let tracks: Track[] | undefined;
        let levelLogic: LevelLogicInterface = this.initializeLevelLogic(level);
        levelLogic.setConfigurationGame(configurationGame);

        tracks = await levelLogic.getPlayList(req, res);
        res.json(tracks);

        tracks.forEach(track => {
           console.log(track.name);
            
        });
    }

    initializeLevelLogic(level: Levels): LevelLogicInterface {
        switch (level) {
            case Levels.EASY:
                return new EasyLevelLogic();
            case Levels.NORMAL:
                return new NormalLevelLogic();
            case Levels.HARD:
                return new HardLevelLogic();
            default:
                return new EasyLevelLogic();
        }
    }

}

export default LevelsLogic;