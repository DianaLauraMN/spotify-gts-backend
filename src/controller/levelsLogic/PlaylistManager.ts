import Artist from "../../entities/artist/Artist";
import Track from "../../entities/track/Track";
import TracksRepository from "../../repositories/TracksRepository";
import { Levels } from "../../enums/Levels";
import { TimeRange } from "../../enums/TimeRange";

class PlaylistManager {

    async getNonCustomPlaylist(superToken: string, level: Levels, offset: number, limit: number) {
        const tracksRepository = new TracksRepository();
        const time_range = this.getTimeRangeByLevel(level);

        let userTopTracks = await tracksRepository.getUserTopTracks(superToken, offset, limit, time_range);
        let userSavedTracks = await tracksRepository.getUserSavedTracks(superToken, offset, limit);
        let userTopGenresTracks = await tracksRepository.getUserTopGenresTracks(superToken);

        if (!userTopTracks) userTopTracks = [];
        if (!userSavedTracks) userSavedTracks = [];
        if (!userTopGenresTracks) userTopGenresTracks = [];


        switch (level) {
            case Levels.EASY:
                return this.removeDuplicateTracks([...userTopTracks, ...userSavedTracks]);
            case Levels.NORMAL:
                return this.removeDuplicateTracks([...userTopTracks, ...userTopGenresTracks]);
            case Levels.HARD:
                return this.removeDuplicateTracks([...userTopTracks, ...userTopGenresTracks]);
            default:
                return [];
        }
    }

    async adjustPlaylistLength(superToken: string, tracks: Track[], tracksQuantity: number, artists: Artist[], genres: String[]): Promise<Track[]> {
        let playlist: Track[] = tracks;

        while (playlist.length < tracksQuantity) {
            if (artists) {
                for (const artist of artists) {
                    const tracksRepository = new TracksRepository();
                    let artistTopTracks = await tracksRepository.getTracksTyped('track', artist.name, 5, superToken);

                    if (artistTopTracks)
                        artistTopTracks = this.filterTracksWithPreview(artistTopTracks);

                    if (artistTopTracks)
                        playlist.push(...artistTopTracks);

                    playlist = this.removeDuplicateTracks(playlist);
                }

            } else if (genres) {
                const tracksRepository = new TracksRepository();
                let userTopGenresTracks = await tracksRepository.getUserTopGenresTracks(superToken);

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

    async getArtistsRandomTopTracks(superToken: string, artists: Artist[], level: Levels): Promise<Track[]> {
        const tracksRepository = new TracksRepository();
        let randomTracks: Track[] = [];
        let randomTracksShuffled: Track[] = [];
        let maximumIndex: number;
        let artistsTracks: Track[];
        let artistName: string;

        for (const artist of artists) {
            artists.length >= 5 ? maximumIndex = 5 : maximumIndex = -1;
            artistName = artist.name;

            switch (level) {
                case Levels.EASY:
                    const artistTopTracks = await tracksRepository.getArtistTopTracks(superToken, artist.name);
                    const savedTracks = await tracksRepository.getUserSavedTracks(superToken, 0, 50);
                    const userTopTracks = await tracksRepository.getUserTopTracks(superToken, 0, 50, TimeRange.short_term);

                    const savedArtistTracks = savedTracks.filter(track => {
                        return track.artists.some(artist => artist.name === artistName);
                    });

                    const userTopArtistTracks = userTopTracks.filter(track => {
                        return track.artists.some(artist => artist.name === artistName);
                    });

                    artistsTracks = [...artistTopTracks, ...savedArtistTracks, ...userTopArtistTracks];
                    break;
                case Levels.NORMAL:
                    artistsTracks = await tracksRepository.getArtistAllTracks(superToken, artist.name, 10, 50);
                    break;
                case Levels.HARD:
                    artistsTracks = await tracksRepository.getArtistAllTracks(superToken, artist.name, 20, 50);
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

    async getGenresRandomTopTracks(superToken: string, genres: string[]): Promise<Track[]> {
        const tracksRepository = new TracksRepository();
        let genresTracks: Track[] = [];
        let tracksShuffled: Track[] = [];
        let maximumIndex: number;

        for (const genre of genres) {
            genres.length >= 5 ? maximumIndex = 5 : maximumIndex = undefined;
            const genreTracks = await tracksRepository.getTracksByGenre(superToken, genre);
            if (genreTracks) tracksShuffled = this.shuffleTracksByFisherYates(genreTracks);
            if (tracksShuffled) genresTracks.push(...tracksShuffled.slice(0, maximumIndex));
        }

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

        return uniqueTracks;
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