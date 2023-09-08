import Artist from "../entities/artist/Artist";

export interface ConfigurationGame {
    level: string;
    genres: string[];
    artists: Artist[];
    guessFromBeggining: boolean;
    durationMs: number;
    tracksQuantity: number;
}