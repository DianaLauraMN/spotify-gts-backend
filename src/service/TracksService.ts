import PlaylistManager from "../controller/levelsLogic/PlaylistManager";
import Artist from "../entities/artist/Artist";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import GenreManager from "../manager/genreManager/GenreManager";
import typeManager from "../manager/typeManager/instanceTM";

class TracksService {
    getTrackById(response: any): Track {
        if (response) {
            const track: Track = TrackAdapter.adaptTrack(response);
            return track;
        }
    }

    getUserTopTracks(response: any): Track[] {
        if (response && response.data.items) {
            const userTopTracks = response.data.items;
            const userTopTracksTyped = typeManager.typeTrackList(userTopTracks);
            return userTopTracksTyped;
        }
    }

    getUserSavedTracks(response: any): Track[] {
        if (response) {
            const userSavedTracks = response.data.items.map((item: { track: any; }) => item.track);
            const userSavedTracksTyped = typeManager.typeTrackList(userSavedTracks);
            return userSavedTracksTyped;
        }
    }

    getUserPlaylistsTracks() { }

    getArtistTopTracks(response: any): Track[] {
        if (response) {
            const artistTopTracksTyped = typeManager.typeTrackList(response.data.tracks);
            return artistTopTracksTyped;
        }
    }

    getArtistAllTracks(response: any): Track[] {
        if (response) {
            const artistTracksTyped = typeManager.typeTrackList(response.data.tracks.items);
            return artistTracksTyped;
        }
    }

    getPlaylistAllTracks(playlistsResponse: any): Track[] {
        let allPlaylistTracks: Track[];

        if (playlistsResponse && playlistsResponse.data.tracks && playlistsResponse.data.tracks.items) {
            const arr: any[] = playlistsResponse.data.tracks.items;
            arr.forEach(item => {
                const { track } = item;
                console.log(track);
                allPlaylistTracks.push(TrackAdapter.adaptTrack(track));
            });
        }

        if (allPlaylistTracks.length > 0)
            return allPlaylistTracks;
    }

    getGenresByName(genre: string): string[] {
        const genreManager = new GenreManager();
        const searchTerm = genre.toLowerCase();
        const genres = genreManager.getSpotifyGenresSeedsCopy();
        const suggestions = genres.filter(genre => genre.toLowerCase().includes(searchTerm));
        return suggestions.sort((a, b) => genreManager.similarityScore(searchTerm, b) - genreManager.similarityScore(searchTerm, a));
    }

    getUserTopGenres(topArtistsList: any[]): string[] {
        const genreManager = new GenreManager();

        const topArtists = typeManager.getArtistsListTyped(topArtistsList);
        const sortedTopUserGenres = genreManager.getUserTopGenresSeeds(topArtists);

        return sortedTopUserGenres;
    }

    getAllRecommendatiosTyped(artistRecommendations: any, genresRecommendations: any, tracksRecommendationS: any) {
        const artistRecommendationsTyped = typeManager.typeTrackList(artistRecommendations.tracks);
        const genresRecommendationsTyped = typeManager.typeTrackList(genresRecommendations.tracks);
        const tracksRecommendationsTyped = typeManager.typeTrackList(tracksRecommendationS.tracks);

        const allRecommendationsTyped = [...artistRecommendationsTyped, ...tracksRecommendationsTyped, ...genresRecommendationsTyped];

        return allRecommendationsTyped;
    }

    getCommaSeparatedTracksIds(topArtists: Artist[], topTracks: Track[]) {
        const genreManager = new GenreManager();
        const topGenres = genreManager.getUserTopGenresSeeds(topArtists);

        const topFiveArtist = typeManager.getSubsetArray(topArtists, 5);
        const topFiveTracks = typeManager.getSubsetArray(topTracks, 5);
        const topFiveGenres = typeManager.getSubsetArray(topGenres, 5);

        const topFiveArtistsId = topFiveArtist.map(item => item.id);
        const topFiveTracksId = topFiveTracks.map(item => item.id);

        const commaSeparatedArtistsIds = topFiveArtistsId.join(',');
        const commaSeparatedTracksIds = topFiveTracksId.join(',');
        const commaSeparatedGenresIds = topFiveGenres.join(',');

        return {
            commaSeparatedArtistsIds,
            commaSeparatedTracksIds,
            commaSeparatedGenresIds,
        }
    }
    

}
export default TracksService;