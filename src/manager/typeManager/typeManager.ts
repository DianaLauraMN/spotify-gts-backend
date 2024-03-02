import Artist from "../../entities/artist/Artist";
import ArtistAdapter from "../../entities/artist/ArtistAdapter";
import Track from "../../entities/track/Track";
import TrackAdapter from "../../entities/track/TrackAdapter";
import { TimeRange } from "../../enums/TimeRange";
import typeManager from "./instanceTM";

class TypeManager {

    getSubsetArray(arr: any[], size: number): any[] {
        return arr.length >= size ? arr.slice(0, size) : arr;
    }

    getStringCapitalized(text: string): string {
        const lowercaseString = text.toLowerCase();
        const capitalizedString = lowercaseString.charAt(0).toUpperCase() + lowercaseString.slice(1);
        return capitalizedString;
    }

    validateItemsType(items: Track[] | Artist[] | undefined): boolean {
        if (!items) { return false; }
        let isValid = true;

        items.forEach(item => {
            if (item.type && (item.type.toLowerCase() !== 'track' && item.type.toLowerCase() !== 'artist')) {
                isValid = false;
            }
        });
        return isValid;
    }

    typeTrackList(items: any[]): Track[] {
        if (!items) { return []; }

        const typedTracks: Track[] = items.map(item => TrackAdapter.adaptTrack(item));
        return typedTracks;
    }

    getValidTracks(tracks: any[]): Track[] {
        const validTracks = tracks.filter((track: any) => this.areTrackAttributesValid(track));
        const allTracksTyped: Track[] = typeManager.typeTrackList(validTracks);

        return allTracksTyped.length > 0 ? allTracksTyped : [];
    }

    getArtistsListTyped(items: any[]): Artist[] {
        if (!items) { return []; }

        const typedArtists: Artist[] = items.map(item => ArtistAdapter.adaptArtist(item));
        return typedArtists;
    }

    getTimeRange(time_range: string): TimeRange | undefined {
        switch (time_range) {
            case 'long_term':
                return TimeRange.long_term;
            case 'medium_term':
                return TimeRange.medium_term;
            case 'short_term':
                return TimeRange.short_term;
            default:
                return undefined;
        }
    }

    areTrackAttributesValid(track: any): boolean {

        if (!track || !track.id) {
            return false;
        }

        if (!track.name || track.name.trim() === '') {
            return false;
        }

        if (!track.artists || track.artists.length === 0) {
            return false;
        }

        if (!track.album || !track.album.images || track.album.images.length === 0 || !track.album.images[0].url) {
            return false;
        }

        if (!track.preview_url || track.preview_url.trim() === '') {
            return false;
        }

        if (!track.type || track.type.trim() === '') {
            return false;
        }

        return true;

    }

}

export default TypeManager;