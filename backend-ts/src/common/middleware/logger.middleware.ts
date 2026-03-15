import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) : void => {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path}`
    );
    if (Object.keys(req.body).length > 0){
        console.log('Body', req.body);
    }
    next();
}