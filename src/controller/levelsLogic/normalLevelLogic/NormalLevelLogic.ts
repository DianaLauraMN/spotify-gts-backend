import { Request, Response } from "express";
import Track from "../../../entities/track/Track";
import { LevelLogicInterface } from "../../../interfaces/LevelLogic.interface";
import { ConfigurationGame } from "../../../interfaces/ConfigurationGame.interface";
import PlaylistManager from "../PlaylistManager";
import { Levels } from "../../../enums/Levels";

class NormalLevelLogic implements LevelLogicInterface {
    configurationGame: ConfigurationGame;

    setConfigurationGame(configurationGame: ConfigurationGame) {
        this.configurationGame = configurationGame;
    }

    async getPlayList(req: Request, res: Response): Promise<Track[] | undefined> {
        let normalLevelPlaylist: Track[] = [];
        let normalLevelTracks: Track[];

        const playlistManager = new PlaylistManager();

        const superToken = req.headers.authorization;
        const { configurationGame } = req.body;
        const { artists, tracksQuantity, genres } = configurationGame;

        if (artists.length === 0 && genres.length === 0) {
            normalLevelTracks = await playlistManager.getNonCustomPlaylist(superToken, Levels.NORMAL, 5, 40);
        } else {
            let artistsRandomTopTracks: Track[] = await playlistManager.getArtistsRandomTopTracks(superToken, artists, Levels.NORMAL);
            let genresTracks: Track[] = await playlistManager.getGenresRandomTopTracks(superToken, genres);
            normalLevelTracks = [...artistsRandomTopTracks, ...genresTracks];
        }
        
        if (superToken) {
            normalLevelPlaylist = await playlistManager.adjustPlaylistLength(superToken, normalLevelTracks, tracksQuantity, artists, genres); //para evitar el error de retorno
            return normalLevelPlaylist;
        }
    }

}

export default NormalLevelLogic;