import { Router } from "express";
import ApiTracksController from "../controller/api/ApiSpotifyTracksController";
import { ApiTracksInterface } from "../interfaces/ApiTracks.interface";
import ApiArtistsController from "../controller/api/ApiSpotifyArtistsController";
import { ApiArtistsInterface } from "../interfaces/ApiArtists.interface";
import ApiUserController from "../controller/api/ApiSpotifyUserController";
import { ApiUserInterface } from "../interfaces/ApiUser.interface";
import LevelsLogic from "../controller/levelsLogic/LevelsLogic";

const appRouter = Router();
const apiUserController: ApiUserInterface = new ApiUserController();
const apiArtistsController: ApiArtistsInterface = new ApiArtistsController();
const apiTracksController: ApiTracksInterface = new ApiTracksController();

const levelsLogic = new LevelsLogic();

appRouter.get('/api/me', apiUserController.getUserData);
appRouter.get('/api/search/artists/:itemName', apiArtistsController.getArtistsByName);//buscador de artistas
appRouter.get('/api/search/tracks/:itemName', apiTracksController.getTracksByName);//buscador de tracks

appRouter.get('/api/artist/:artistId', apiArtistsController.getArtistById);
appRouter.get('/api/track/:trackId', apiTracksController.getTrackById);

appRouter.get('/api/me/favorite/tracks', apiTracksController.getUserSavedTracks);
appRouter.get('/api/me/top/tracks', apiTracksController.getUserTopTracks); //TODOS LOS NIVELES non custom
appRouter.get('/api/artist/top/tracks/:itemName', apiTracksController.getArtistTopTracks); //Nivel Facil

appRouter.get('/api/me/top/artists', apiArtistsController.getUserTopArtists); //TODOS NIVELES
appRouter.get('/api/artist/tracks/:artistName', apiTracksController.getArtistAllTracks); //Custom
appRouter.get('/api/me/top/genres/tracks', apiTracksController.getUserTopGenresTracks); //Nivel Dificil
appRouter.get('/api/me/top/genres', apiTracksController.getUserTopGenres); 
appRouter.get('/api/genres', apiTracksController.getSpotifyGenres); 
appRouter.get('/api/search/genres/:itemName', apiTracksController.getGenresByName); 

appRouter.get('/api/me/playlists', apiTracksController.getUserPlaylistsTracks); 
appRouter.get('/api/me/recommendations', apiTracksController.getUserRecommendations);

appRouter.post('/api/tracksByLevel', levelsLogic.getTracksByLevel);

export { appRouter };