import { ConfigurationGame } from "../../interfaces/ConfigurationGame.interface";
import { LevelLogicInterface } from "../../interfaces/LevelLogic.interface";
import { Request, Response } from "express";
import Track from "../../entities/track/Track";
import TracksRepository from "../../repositories/TracksRepository";
import Artist from "../../entities/artist/Artist";
import { getTypedItemTracksByType } from "../../repositories/TracksRepository";

class EasyLevelLogic implements LevelLogicInterface {
    configurationGame: ConfigurationGame;

    setConfigurationGame(configurationGame: ConfigurationGame) {
        this.configurationGame = configurationGame;
    }

    async getPlayList(req: Request, res: Response): Promise<Track[] | undefined> {
        let easyLevelPlaylist: Track[] = [];
        let easyLevelTracks: Track[];

        const tracksRepository = new TracksRepository();
        const superToken = req.headers.authorization;
        const { configurationGame } = req.body;
        const { artists, tracksQuantity, genres } = configurationGame;

        let userTopTracks = await tracksRepository.getUserTopTracks(superToken);
        let userSavedTracks = await tracksRepository.getUserSavedTracks(superToken);
        //let userTopGenresTracks = await tracksRepository.getUserTopGenresTracks(superToken);

        if (!userTopTracks) userTopTracks = [];
        if (!userSavedTracks) userSavedTracks = [];
        //if (!userTopGenresTracks) userTopGenresTracks = [];

        if ((!artists) && (!genres)) {
            easyLevelTracks = [...userTopTracks, ...userSavedTracks]; //...userTopGenresTracks - para un nivel medio
        } else {
            let artistsTopTracks: Track[] = [];
            let genresTracks: Track[] = [];
            let lastIndex: number;

            for (const artist of artists) {
                artists.length >= 5 ? lastIndex = 5 : lastIndex = -1;
                const artistTopTracks = await tracksRepository.getArtistTopTracks(superToken, artist.name);
                if (artistTopTracks) artistsTopTracks.push(...artistTopTracks.slice(0, lastIndex));
            }

            for (const genre of genres) {
                genres.length >= 5 ? lastIndex = 5 : lastIndex = -1;
                const genreTracks = await tracksRepository.getTracksByGenre(superToken, genre);
                if (genreTracks) genresTracks.push(...genreTracks.slice(0, lastIndex));
            }
            easyLevelTracks = [...artistsTopTracks, ...genresTracks];
        }
        const removeTracksDuplicated = this.removeTracksDuplicated(easyLevelTracks);
        easyLevelPlaylist = this.shuffleFisherYates(removeTracksDuplicated);

        if (superToken) {
            const playlistLengthAdjusted = await this.adjustPlaylistLength(superToken, easyLevelPlaylist, tracksQuantity, artists);
            return playlistLengthAdjusted;
        }
    }

    async adjustPlaylistLength(superToken: string, tracks: Track[], tracksQuantity: number, artists: Artist[]): Promise<Track[]> {

        let newPlaylist: Track[] = tracks;
        while (newPlaylist.length < tracksQuantity) {
            for (const artist of artists) {
                const artistTopTracks = await getTypedItemTracksByType('artist', artist.name, 5, superToken);
                const artistTopTracksFiltered = this.removeTracksWithoutPreview(artistTopTracks);
                if (artistTopTracksFiltered) {
                    newPlaylist.push(...artistTopTracksFiltered);
                }
                newPlaylist = this.removeTracksDuplicated(newPlaylist);
            }
        }

        if (tracks.length > tracksQuantity) {
            this.shuffleFisherYates(newPlaylist);
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

    removeTracksWithoutPreview(tracks: Track[]): Track[] {
        const tracksToPlayWith: Track[] = [];
        for (const track of tracks) {
            if (track.preview_url) {
                tracksToPlayWith.push(track);
            }
        }
        return tracksToPlayWith;
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