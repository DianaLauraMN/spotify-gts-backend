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

            let artistsRandomTopTracks: Track[] = [];
            let genresTracks: Track[] = [];

            if (artists.length > 0)
                artistsRandomTopTracks = await playlistManager.getRandomTopTracksByArtists(superToken, artists, Levels.NORMAL);
            if (genres.length > 0) genresTracks = await playlistManager.getRandomTopTracksByGenre(superToken, genres);
            normalLevelTracks = [...artistsRandomTopTracks, ...genresTracks];
        }

        if (superToken) {
            normalLevelPlaylist = await playlistManager.adjustPlaylistLength(superToken, normalLevelTracks, tracksQuantity, artists, genres);
            return normalLevelPlaylist;
        }
    }

}

export default NormalLevelLogic;