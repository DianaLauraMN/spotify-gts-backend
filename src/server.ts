import express, { Request, Response } from 'express';
import cors from 'cors';
import { appRouter } from './routes/appRoutes';
//import session from 'express-session';

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
}));

app.use(appRouter);
// app.use(session({
//   secret: 'secreto-super-seguro',
//   resave: false,
//   saveUninitialized: true,
// }));

app.get('/', (req: Request, res: Response) => {
    res.json({ message: "Server Running" })
})

app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`);
});
