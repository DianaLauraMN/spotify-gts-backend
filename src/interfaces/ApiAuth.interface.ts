import { Request, Response } from "express";

export interface ApiAuthInterface {
    login(req: Request, res: Response): Promise<void>;
    callback(req: Request, res: Response): Promise<void>;
    initiateAuthentication(req: Request, res: Response): Promise<void>;
    handleAuthorizationCode(req: Request, res: Response): Promise<void>;
    refreshToken(req: Request, res: Response): Promise<void>;
}