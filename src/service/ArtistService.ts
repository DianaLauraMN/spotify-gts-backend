
import { Request, Response } from "express";
import Artist from "../entities/artist/Artist";
import typeManager from "../manager/typeManager/instanceTM";
import ArtistRepository from "../repositories/ArtistRepository";
import { ErrorArtistMessages } from "../utilities/ErrorArtistMessages";
import ErrorStatusCode from "../utilities/ErrorStatusCode";

class ArtistService {
    private artistRepository: ArtistRepository = ArtistRepository.getInstance();

    async getArtistById(req: Request, res: Response): Promise<Artist> {
        try {
            const access_token = req.headers.authorization;
            const artistId = req.params.artistId;

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorArtistMessages.TOKEN_EXPECTED });
            return await this.artistRepository.getArtistById(access_token, artistId);

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorArtistMessages.GETTING_ARTIST_BY_NAME });
        }
    }

    async getArtistsByName(req: Request, res: Response): Promise<Artist[]> {
        try {
            const access_token = req.headers.authorization;
            const itemName = req.params.itemName;

            let offsetTyped = parseInt(req.query.offset.toString());
            let limitTyped = parseInt(req.query.limit.toString());

            if (offsetTyped < 0 || limitTyped < 1) {
                offsetTyped = 0;
                limitTyped = 10;
            }

            if (itemName.trim().length === 0) res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorArtistMessages.ARTIST_NAME });
            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorArtistMessages.TOKEN_EXPECTED });
            return await this.artistRepository.getArtistsByName(access_token, itemName, offsetTyped, limitTyped);

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorArtistMessages.GETTING_ARTIST_BY_NAME });
        }
    }

    async getUserTopArtists(req: Request, res: Response): Promise<Artist[]> {
        try {
            const access_token = req.headers.authorization;
            let offsetTyped = parseInt(req.query.offset.toString());
            let limitTyped = parseInt(req.query.limit.toString());
            let timeRangeEnumValue = typeManager.getTimeRange(req.query.time_range.toString());

            if (offsetTyped < 0 || limitTyped < 1) {
                offsetTyped = 0;
                limitTyped = 10;
            }
            if (!timeRangeEnumValue) {
                timeRangeEnumValue = typeManager.getTimeRange('medium_term');
            }

            if (!access_token) res.status(ErrorStatusCode.TOKEN_EXPECTED_ERROR).json({ message: ErrorArtistMessages.TOKEN_EXPECTED });
            return await this.artistRepository.getUserTopArtists(access_token, offsetTyped, limitTyped, timeRangeEnumValue);

        } catch (error) {
            res.status(ErrorStatusCode.BAD_REQUEST_ERROR).json({ message: ErrorArtistMessages.GETTING_USER_TOP_ARTISTS });
        }
    }


}

export default ArtistService;