import { ConfigurationGame } from "../../interfaces/ConfigurationGame.interface";
import { LevelLogicInterface } from "../../interfaces/LevelLogic.interface";
import { Request, Response } from "express";
import Track from "../../entities/track/Track";
import TracksRepository from "../../repositories/TracksRepository";
import Artist from "../../entities/artist/Artist";
import { getTypedItemByType } from "../api/ApiSpotifyTracksController";

class EasyLevelLogic implements LevelLogicInterface {
    configurationGame: ConfigurationGame;

    setConfigurationGame(configurationGame: ConfigurationGame) {
        this.configurationGame = configurationGame;
    }

    async getPlayList(req: Request, res: Response): Promise<Track[] | undefined> {
        let easyLevelPlaylist: Track[] = [];
        const tracksRepository = new TracksRepository();
        const superToken = req.headers.authorization;
        const { configurationGame } = req.body;
        const { artists, tracksQuantity } = configurationGame;

        let artistsTopTracks: Track[] = [];
        let userTopTracks = await tracksRepository.getUserTopTracks(superToken);
        let userSavedTracks = await tracksRepository.getUserSavedTracks(superToken);
        //let userTopGenresTracks = await tracksRepository.getUserTopGenresTracks(superToken);

        for (const artist of artists) {
            const artistName = artist.name;
            const artistTopTracks = await tracksRepository.getArtistTopTracks(superToken, artistName);
            if (artistTopTracks) artistsTopTracks.push(...artistTopTracks);
        }

        if (!userTopTracks) userTopTracks = [];
        if (!userSavedTracks) userSavedTracks = [];


        const easyLevelTracks = [...userTopTracks, ...userSavedTracks, ...artistsTopTracks];
        const removeTracksDuplicated = this.removeTracksDuplicated(easyLevelTracks);
        easyLevelPlaylist = this.shuffleFisherYates(removeTracksDuplicated);

        if (superToken) {
            const adjustPlaylistLength = await this.adjustPlaylistLength(superToken, easyLevelPlaylist, tracksQuantity, artists);
            console.log(adjustPlaylistLength.length);
            return adjustPlaylistLength;
        }
    }

    async adjustPlaylistLength(superToken: string, tracks: Track[], tracksQuantity: number, artists: Artist[]): Promise<Track[]> {

        let newPlaylist: Track[] = tracks;
        while (newPlaylist.length < tracksQuantity) {
            for (const artist of artists) {
                const artistTopTracks = await getTypedItemByType('artist', artist.name, 5, superToken);
                if (artistTopTracks) newPlaylist.push(...artistTopTracks);
                newPlaylist = this.removeTracksDuplicated(newPlaylist);
            }
        }

        if (tracks.length > tracksQuantity) {
            console.log('entro al tracks length mayor que tracks quantity');
            newPlaylist = newPlaylist.slice(0, tracksQuantity);
        }
        return newPlaylist;
    }

    removeTracksDuplicated(tracks: Track[]): Track[] {

        const uniqueTracks: Track[] = [];
        tracks.forEach((track) => {
            // Verifica si el track no está en uniqueTracks antes de agregarlo
            if (!uniqueTracks.some((uniqueTrack) => uniqueTrack.id === track.id)) {
                uniqueTracks.push(track);
            }
        });

        return uniqueTracks;
    }

    shuffleFisherYates(array: Track[]): Track[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
}

export default EasyLevelLogic;