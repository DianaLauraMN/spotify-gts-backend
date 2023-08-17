import { Router, Request, Response } from "express";
import ApiSpotifyController from "./../controller/ApiSpotifyController";
import { ApiControllerInterface } from "../interfaces/ApiController.interface";
import ApiSpotifyControllerV2 from "../controller/ApiSpotifyControllerV2";

const appRouter = Router();
const apiSpotifyController: ApiControllerInterface = new ApiSpotifyControllerV2();

appRouter.get('/callback', apiSpotifyController.getCallback);
appRouter.get('/api/login', apiSpotifyController.getAuthentication);
appRouter.get('/api/me', apiSpotifyController.getUserData);
appRouter.get('/api/search/artists/:itemName', apiSpotifyController.getItemArtists);//buscador de artistas
appRouter.get('/api/search/tracks/:itemName', apiSpotifyController.getItemTracks);//buscador de tracks

appRouter.get('/api/artist/:artistId', apiSpotifyController.getArtistById);
appRouter.get('/api/track/:trackId', apiSpotifyController.getTrackById);

appRouter.get('/api/me/favorite/tracks', apiSpotifyController.getUserSavedTracks); //TODOS LOS NIVELES

appRouter.get('/api/me/top/tracks', apiSpotifyController.getUserTopTracks); //Nivel Facil
appRouter.get('/api/artist/top/tracks/:itemName', apiSpotifyController.getArtistTopTracks); //Nivel Facil

appRouter.get('/api/me/top/artists', apiSpotifyController.getUserTopArtists); //Nivel Medio 
appRouter.get('/api/artist/tracks/:artistName', apiSpotifyController.getArtistAllTracks); //Nivel Medio
appRouter.get('/api/genres/tracks/:genreName', apiSpotifyController.getUserTopGenres); //Nivel Medio

appRouter.get('/api/me/playlists', apiSpotifyController.getUserPlaylists); //Normal-Dificil
appRouter.get('/api/me/recommendations', apiSpotifyController.getUserRecommendations);//Nivel Dificil


export { appRouter };

/**
 * 
nivel dificil:  primeros 3 seg, la lista de canciones a adivinar se tomara de  las canciones que el usuario a agregado a su biblioteca, o esta dentro de una lista de reproduccion suya o que el siga y las canciones mas populares de los artistas que el sigue.
nivel medio: primeros 5 seg, la lista de canciones a adivinar se tomara de las canciones que el usuario tenga en su biblioteca, y de sus top mas escuchados.
nivel facil: prmeros 7 seg, la lista de canciones a adivinar se tomara de un artista (o mas) en especifico seleccionado antes de iniciar la partida. 
 */


/**
 * Artist ->getOne, getAll, getPaginate, searchBy
 * Track ->getOne, getAll, getPaginate, searchBy
 * PlayList ->getOne, getAll, getPaginate, searchBy
 * 
 */

/**
 * interface IQueryGlobalDataItems -> getOneById, getAll, searchByQuery
 * 
 * const {name, date, team, song} = req.query;//Ejemplo
 */