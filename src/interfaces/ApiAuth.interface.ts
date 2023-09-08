import { Request, Response } from "express";

export interface ApiAuthInterface {
    getAuthentication(req: Request, res: Response): Promise<void>;
    getCallback(req: Request, res: Response): Promise<void>;
}