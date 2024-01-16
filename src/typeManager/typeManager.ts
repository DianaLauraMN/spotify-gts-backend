import Artist from "../entities/artist/Artist";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";

class TypeManager {
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
    
}

export default TypeManager;