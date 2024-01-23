import { Request, Response } from "express";
import Track from "../../../entities/track/Track";
import { LevelLogicInterface } from "../../../interfaces/LevelLogic.interface";
import { ConfigurationGame } from "../../../interfaces/ConfigurationGame.interface";
import PlaylistManager from "../PlaylistManager";
import { Levels } from "../../../enums/Levels";

class HardLevelLogic implements LevelLogicInterface {
    configurationGame: ConfigurationGame;

    setConfigurationGame(configurationGame: ConfigurationGame) {
        this.configurationGame = configurationGame;
    }

    async getPlayList(req: Request, res: Response): Promise<Track[] | undefined> {
        let hardLevelPlaylist: Track[] = [];
        let hardLevelTracks: Track[];

        const playlistManager = new PlaylistManager();

        const superToken = req.headers.authorization;
        const { configurationGame } = req.body;
        const { artists, tracksQuantity, genres } = configurationGame;

        if (artists.length === 0 && genres.length === 0) {
            hardLevelTracks = await playlistManager.getNonCustomPlaylist(superToken, Levels.HARD, 45, 50);
        } else {
            let artistsRandomTopTracks: Track[] = await playlistManager.getArtistsRandomTopTracks(superToken, artists, Levels.HARD);
            let genresTracks: Track[] = await playlistManager.getGenresRandomTopTracks(superToken, genres);
            hardLevelTracks = [...artistsRandomTopTracks, ...genresTracks];
        }

        if (superToken) {
            hardLevelPlaylist = await playlistManager.adjustPlaylistLength(superToken, hardLevelTracks, tracksQuantity, artists, genres); //para evitar el error de retorno
            return hardLevelPlaylist;
        }
    }

}

export default HardLevelLogic;