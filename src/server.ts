import express, { Request, Response, urlencoded, json } from 'express';
import cors from 'cors';
import { appRouter } from './routes/appRoutes';
import { ENV_VALUES } from './variables';

const app = express();

// const corsOptions = {
//     origin: [ENV_VALUES.FRONTEND_URL, ENV_VALUES.SPOTIFY_ACCOUNTS_URL],
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
//     credentials: true,
//     optionsSuccessStatus: 200,
// };

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(appRouter);

const startServer = async () => {
    try {
        app.listen(ENV_VALUES.PORT, () => {
            console.log(`Server Running on ${ENV_VALUES.API_URL}${ENV_VALUES.PORT}`);
        });
    } catch (error) {
        console.error('Error while starting server:', error);
    }
};

startServer();