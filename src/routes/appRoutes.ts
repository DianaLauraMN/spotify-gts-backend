import { Router, Request, Response } from "express";
import ApiSpotifyController from "./../controller/ApiSpotifyController";

const appRouter = Router();
const apiSpotifyController = new ApiSpotifyController();

appRouter.get('/callback', apiSpotifyController.getCallback);
appRouter.get('/api/login',apiSpotifyController.getAuthentication);
appRouter.get('/api/artist/:artistId',apiSpotifyController.getArtistTracksById)

export { appRouter };