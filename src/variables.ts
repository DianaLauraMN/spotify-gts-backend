import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export const ENV_VALUES = {
    PORT: process.env.PORT,
    SPOTIFY_ACCOUNTS_URL: process.env.SPOTIFY_ACCOUNTS_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    API_URL: process.env.API_URL
}