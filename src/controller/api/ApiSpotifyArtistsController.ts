import { Request, Response } from "express";
import { ApiArtistsInterface } from "../../interfaces/ApiArtists.interface";
import ArtistService from "../../service/ArtistService";

class ApiArtistsController implements ApiArtistsInterface {

    async getArtistById(req: Request, res: Response) {
        const artistService = new ArtistService();
        const artist = await artistService.getArtistById(req, res);
        res.json(artist);
    }

    async getArtistsByName(req: Request, res: Response) {
        const artistService = new ArtistService();
        const artists = await artistService.getArtistsByName(req, res);
        res.json(artists);
    }

    async getUserTopArtists(req: Request, res: Response) {
        const artistService = new ArtistService();
        const artists = await artistService.getUserTopArtists(req, res);
        res.json(artists);
    }

}


export default ApiArtistsController;