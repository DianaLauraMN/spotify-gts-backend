import Artist from "../../entities/artist/Artist";
import Track from "../../entities/track/Track";
import { Levels } from "../../enums/Levels";
import { TimeRange } from "../../enums/TimeRange";
import GenreManager from "../../manager/genreManager/GenreManager";
import typeManager from "../../manager/typeManager/instanceTM";
import ArtistRepository from "../../repositories/ArtistRepository";
import TrackRepository from "../../repositories/TrackRepository";
import TracksService from "../../service/TracksService";

class PlaylistManager {

    async getNonCustomPlaylist(access_token: string, level: Levels, offset: number, limit: number) {
        const trackRepository = TrackRepository.getInstance();
        const artistRepository = ArtistRepository.getInstance();
        const genreManager = new GenreManager();
        const time_range = this.getTimeRangeByLevel(level);

        let topTracksByTopArtists: Track[] = [];
        let userTopArtist: Artist[] = [];

        let userTopTracks = await trackRepository.getUserTopTracks(access_token, offset, limit, time_range);
        if (userTopTracks) userTopTracks = typeManager.typeTrackList(userTopTracks)
        else userTopTracks = [];

        userTopArtist = await artistRepository.getUserTopArtists(access_token, 0, 3, time_range);

        if (userTopArtist) {
            let artistsTopTracksPromises = userTopArtist.map(artist => trackRepository.getArtistTopTracks(access_token, artist));
            let artiststopTracks: Track[] = await Promise.all(artistsTopTracksPromises);
            topTracksByTopArtists = artiststopTracks.flat();
        }

        switch (level) {
            case Levels.EASY:
                let userSavedTracks = await trackRepository.getUserSavedTracks(access_token, offset, limit);
                if (userSavedTracks) userSavedTracks = typeManager.typeTrackList(userSavedTracks);
                else userSavedTracks = [];
                return this.removeDuplicateTracks([...userTopTracks, ...userSavedTracks, ...topTracksByTopArtists]);
            case Levels.NORMAL:
                return this.removeDuplicateTracks([...userTopTracks, ...topTracksByTopArtists]);
            case Levels.HARD:
                let userTopGenresTracks = await genreManager.getUserTopGenresTracks(access_token);
                if (!userTopGenresTracks) userTopGenresTracks = [];
                return this.removeDuplicateTracks([...userTopTracks, ...userTopGenresTracks, ...topTracksByTopArtists]);
            default:
                return [];
        }
    }

    async adjustPlaylistLength(superToken: string, tracks: Track[], tracksQuantity: number, artists: Artist[], genres: String[]): Promise<Track[]> {
        let playlist: Track[] = tracks;
        const tracksService = new TracksService();
        const genreManager = new GenreManager();
        const trackRepository = TrackRepository.getInstance();

        while (playlist.length < tracksQuantity) {

            if (artists.length > 0) {
                for (const artist of artists) {

                    let artistTopTracks = await trackRepository.getArtistTopTracks(superToken, artist);
                    if (artistTopTracks) artistTopTracks = typeManager.typeTrackList(artistTopTracks);

                    if (artistTopTracks.length < tracksQuantity) {
                        let itemsToAdd;
                        switch (artists.length) {
                            case 1:
                                itemsToAdd = await trackRepository.getItemRecommendations('artist', artist.id, tracksQuantity - artistTopTracks.length, superToken);
                                itemsToAdd = typeManager.typeTrackList(itemsToAdd.tracks);
                                break;
                            default:
                                itemsToAdd = await tracksService.searchTrackItemTyped('track', artist.name, 5, superToken);
                                break;
                        }

                        itemsToAdd = this.filterTracksWithPreview(itemsToAdd);
                        playlist.push(...itemsToAdd, ...artistTopTracks);


                    } else {
                        if (artistTopTracks)
                            artistTopTracks = this.filterTracksWithPreview(artistTopTracks);

                        if (artistTopTracks)
                            playlist.push(...artistTopTracks);
                    }

                    playlist = this.removeDuplicateTracks(playlist);
                }

            } else if (genres.length > 0) {
                let userTopGenresTracks = await genreManager.getUserTopGenresTracks(superToken);

                if (userTopGenresTracks)
                    userTopGenresTracks = this.filterTracksWithPreview(userTopGenresTracks);


                if (userTopGenresTracks)
                    playlist.push(...userTopGenresTracks);

                playlist = this.removeDuplicateTracks(playlist);
            }
        }

        if (tracks.length > tracksQuantity) {
            this.shuffleTracksByFisherYates(playlist);
            playlist = playlist.slice(0, tracksQuantity);
        }

        return playlist;
    }

    async getRandomTopTracksByArtists(access_token: string, artists: Artist[], level: Levels): Promise<Track[]> {
        let randomTracks: Track[] = [];
        let randomTracksShuffled: Track[] = [];
        let maximumIndex: number;
        let artistsTracks: Track[];
        let artistName: string;

        for (const artist of artists) {
            artists.length >= 5 ? maximumIndex = 5 : maximumIndex = -1;
            artistName = artist.name;
            const trackRepository = TrackRepository.getInstance();

            switch (level) {
                case Levels.EASY:
                    let artistTopTracks = await trackRepository.getArtistTopTracks(access_token, artist);
                    if (artistTopTracks) artistTopTracks = typeManager.typeTrackList(artistTopTracks);

                    const savedTracks = await trackRepository.getUserSavedTracks(access_token, 0, 50);
                    let userSavedTracks = savedTracks.map((item: { track: any; }) => item.track);
                    if (userSavedTracks) userSavedTracks = typeManager.typeTrackList(userSavedTracks);
                    else userSavedTracks = [];

                    let savedArtistTracks = userSavedTracks?.filter((track: { artists: any[]; }) => {
                        return track.artists.some((artist: { name: string; }) => artist.name === artistName);
                    });

                    const userTopTracks = await trackRepository.getUserTopTracks(access_token, 0, 50, TimeRange.short_term);

                    let userTopArtistTracks = userTopTracks?.filter((track: { artists: any[]; }) => {
                        return track.artists.some((artist: { name: string; }) => artist.name === artistName);
                    });

                    if (!userTopArtistTracks) userTopArtistTracks = [];
                    if (!savedArtistTracks) savedArtistTracks = [];
                    if (!artistTopTracks) artistTopTracks = [];

                    artistsTracks = [...artistTopTracks, ...savedArtistTracks, ...userTopArtistTracks];
                    break;
                case Levels.NORMAL:
                    const allTracks = await trackRepository.getArtistAllTracks(access_token, artist.name, 10, 50);
                    artistsTracks = typeManager.typeTrackList(allTracks);
                    break;
                case Levels.HARD:
                    artistsTracks = await trackRepository.getArtistAllTracks(access_token, artist.name, 20, 50);
                    break;
            }
            if (artistsTracks) artistsTracks = this.removeDuplicateTracks(artistsTracks);
            if (artistsTracks) randomTracksShuffled = this.shuffleTracksByFisherYates(artistsTracks);

            if (artists.length > 1) {
                if (randomTracksShuffled) randomTracks.push(...randomTracksShuffled.slice(0, maximumIndex));
            } else if (artists.length === 1) {
                return randomTracksShuffled;
            }
        }
        return randomTracks;
    }

    async getRandomTopTracksByGenre(superToken: string, genres: string[]): Promise<Track[]> {
        const tracksService = new TracksService();
        let genresTracks: Track[] = [];
        let tracksShuffled: Track[] = [];
        let maximumIndex: number;
        genres.length >= 5 ? maximumIndex = 5 : maximumIndex = undefined;

        let tracksPromises;
        let tracksByGenres: Track[][];

        for (const genre of genres) {
            const genreTracks = await tracksService.getTracksByGenre(superToken, genre);
            if (genreTracks) tracksShuffled = this.shuffleTracksByFisherYates(genreTracks);
            if (tracksShuffled) tracksShuffled = this.removeDuplicateTracks(tracksShuffled);
            if (tracksShuffled) genresTracks.push(...tracksShuffled.slice(0, maximumIndex));
        }

        tracksPromises = genres.map(genre => tracksService.getTracksByGenre(superToken, genre));
        tracksByGenres = await Promise.all(tracksPromises);
        const flattenedGenresTracks = tracksByGenres.flat();

        if (flattenedGenresTracks) tracksShuffled = this.shuffleTracksByFisherYates(flattenedGenresTracks);
        if (tracksShuffled) tracksShuffled = this.removeDuplicateTracks(tracksShuffled);
        if (tracksShuffled) genresTracks.push(...tracksShuffled.slice(0, maximumIndex));

        return genresTracks;
    }

    removeDuplicateTracks(tracks: Track[]): Track[] {
        const uniqueTracks: Track[] = [];

        // Verifica si el track no está en uniqueTracks antes de agregarlo
        tracks.forEach((track) => {
            if (!uniqueTracks.some((uniqueTrack) => uniqueTrack.id === track.id || (uniqueTrack.name === track.name && uniqueTrack.artists[0].name === track.artists[0].name))) {
                uniqueTracks.push(track);
            }
        });

        const uniqueValidTracks = this.filterTracksWithPreview(uniqueTracks);
        return uniqueValidTracks;
    }

    filterTracksWithPreview(tracks: Track[]): Track[] {
        return tracks.filter((track) => track.preview_url);
    }

    shuffleTracksByFisherYates(tracks: Track[]): Track[] {
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }

        return tracks;
    };

    getTimeRangeByLevel(level: Levels): TimeRange {
        switch (level) {
            case Levels.EASY:
                return TimeRange.short_term;
            case Levels.NORMAL:
                return TimeRange.medium_term;
            case Levels.HARD:
                return TimeRange.long_term;
            default:
                break;
        }
    }
}

export default PlaylistManager;