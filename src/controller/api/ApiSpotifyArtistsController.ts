import { Request, Response } from "express";
import { ApiArtistsInterface } from "../../interfaces/ApiArtists.interface";
import ArtistsRepository from "../../repositories/ArtistsRepository";
import TypeManager from "../../manager/typeManager/typeManager";

class ApiArtistsController implements ApiArtistsInterface {

    async getArtistById(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const artistId = req.params.artistId;
        const artistsRepository = new ArtistsRepository();
        const artist = await artistsRepository.getArtistById(superToken, artistId);
        res.json(artist);
    }

    async getArtistsByName(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        const { offset, limit } = req.query;
        const artistsRepository = new ArtistsRepository();
        const artists = await artistsRepository.getArtistsByName(superToken, itemName, parseInt(offset.toString()), parseInt(limit.toString()));
        res.json(artists);
    }

    async getUserTopArtists(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const { offset, limit, time_range } = req.query;
        const typeManager = new TypeManager();
        const timeRangeEnumValue = typeManager.getTimeRange(time_range.toString());
        const artistsRepository = new ArtistsRepository();
        const artists = await artistsRepository.getUserTopArtists(superToken, parseInt(offset.toString()), parseInt(limit.toString()), timeRangeEnumValue);
        res.json(artists);
    }

}


export default ApiArtistsController;