import { ConfigurationGame } from "../../../interfaces/ConfigurationGame.interface";
import { LevelLogicInterface } from "../../../interfaces/LevelLogic.interface";
import { Request, Response } from "express";
import Track from "../../../entities/track/Track";
import PlaylistManager from "../PlaylistManager";
import { Levels } from "../../../enums/Levels";

class EasyLevelLogic implements LevelLogicInterface {
    configurationGame: ConfigurationGame;

    setConfigurationGame(configurationGame: ConfigurationGame) {
        this.configurationGame = configurationGame;
    }

    async getPlayList(req: Request, res: Response): Promise<Track[] | undefined> {
        let easyLevelPlaylist: Track[] = [];
        let easyLevelTracks: Track[];

        const playlistManager = new PlaylistManager();

        const superToken = req.headers.authorization;
        const { configurationGame } = req.body
        const { artists, tracksQuantity, genres } = configurationGame;

        if (artists.length === 0 && genres.length === 0) {
            easyLevelTracks = await playlistManager.getNonCustomPlaylist(superToken, Levels.EASY, 0, 35);
        } else {
            let artistsRandomTopTracks: Track[] = await playlistManager.getArtistsRandomTopTracks(superToken, artists, Levels.EASY);
            let genresTracks: Track[] = await playlistManager.getGenresRandomTopTracks(superToken, genres);            
            easyLevelTracks = [...artistsRandomTopTracks, ...genresTracks];
        }

        if (superToken) {
            easyLevelPlaylist = await playlistManager.adjustPlaylistLength(superToken, easyLevelTracks, tracksQuantity, artists, genres);
            return easyLevelPlaylist;
        }
    }
}

export default EasyLevelLogic;