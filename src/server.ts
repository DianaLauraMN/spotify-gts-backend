import express, { Request, Response, urlencoded, json } from 'express';
import cors from 'cors';
import { appRouter } from './routes/appRoutes';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';
//import session from 'express-session';

dotenv.config({ path: '../.env' }); // Ruta a tu archivo .env

const app = express();
const PORT = 3000;

app.use(cors({
    origin: ['http://localhost:5173', 'https://accounts.spotify.com']
}));

//app.use(cors()); // Habilita todas las solicitudes CORS

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(appRouter);

app.get('/', (req: Request, res: Response) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.json({ message: "Server Running" })
})

const startServer = async () => {
    try {
        const configPath = path.resolve(__dirname, '../config.json');
        const data = await fs.promises.readFile(configPath, 'utf8');
        const configData = JSON.parse(data);

        process.env.SPOTIFY_ACCESS_TOKEN = configData.SPOTIFY_ACCESS_TOKEN;
        process.env.SPOTIFY_REFRESH_TOKEN = configData.SPOTIFY_REFRESH_TOKEN;
        process.env.SPOTIFY_EXPIRES_IN = configData.SPOTIFY_EXPIRES_IN;

        app.listen(PORT, () => {
            console.log(`Server Running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
};

startServer();