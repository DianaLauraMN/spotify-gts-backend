import { Router } from "express";
import ApiAuthController from "../controller/api/ApiSpotifyAuthController";
import { ApiAuthInterface } from "../interfaces/ApiAuth.interface";
import ApiTracksController from "../controller/api/ApiSpotifyTracksController";
import { ApiTracksInterface } from "../interfaces/ApiTracks.interface";
import ApiArtistsController from "../controller/api/ApiSpotifyArtistsController";
import { ApiArtistsInterface } from "../interfaces/ApiArtists.interface";
import ApiUserController from "../controller/api/ApiSpotifyUserController";
import { ApiUserInterface } from "../interfaces/ApiUser.interface";
import LevelsLogic from "../controller/levelsLogic/LevelsLogic";

const appRouter = Router();
const apiAuthController: ApiAuthInterface = new ApiAuthController();
const apiUserController: ApiUserInterface = new ApiUserController();
const apiArtistsController: ApiArtistsInterface = new ApiArtistsController();
const apiTracksController: ApiTracksInterface = new ApiTracksController();
const levelsLogic = new LevelsLogic();

appRouter.get('/callback', apiAuthController.getCallback);
appRouter.get('/api/login', apiAuthController.getAuthentication);
appRouter.get('/api/me', apiUserController.getUserData);
appRouter.get('/api/search/artists/:itemName', apiArtistsController.getArtistsByName);//buscador de artistas
appRouter.get('/api/search/tracks/:itemName', apiTracksController.getTracksByName);//buscador de tracks

appRouter.get('/api/artist/:artistId', apiArtistsController.getArtistById);
appRouter.get('/api/track/:trackId', apiTracksController.getTrackById);

appRouter.get('/api/me/favorite/tracks', apiTracksController.getUserSavedTracks); //TODOS LOS NIVELES

appRouter.get('/api/me/top/tracks', apiTracksController.getUserTopTracks); //Nivel Facil
appRouter.get('/api/artist/top/tracks/:itemName', apiTracksController.getArtistTopTracks); //Nivel Facil

appRouter.get('/api/me/top/artists', apiArtistsController.getUserTopArtists); //Nivel Medio 
appRouter.get('/api/artist/tracks/:artistName', apiTracksController.getArtistAllTracks); //Nivel Medio
appRouter.get('/api/me/top/genres/tracks', apiTracksController.getUserTopGenresTracks); //Nivel Medio
appRouter.get('/api/me/top/genres', apiTracksController.getUserTopGenres); //Nivel Medio

appRouter.get('/api/me/playlists', apiTracksController.getUserPlaylistsTracks); //Normal-Dificil
appRouter.get('/api/me/recommendations', apiTracksController.getUserRecommendations);//Nivel Dificil

appRouter.post('/api/tracksByLevel', levelsLogic.getTracksByLevel);

export { appRouter };