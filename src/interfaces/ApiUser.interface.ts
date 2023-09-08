import { Request, Response } from "express";

export interface ApiUserInterface {
    getUserData(req: Request, res: Response): Promise<void>;
}