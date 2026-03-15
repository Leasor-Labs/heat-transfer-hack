declare module "express" {
  interface Request {
    method: string;
    query: Record<string, string | undefined>;
    body?: unknown;
  }
  interface Response {
    setHeader(name: string, value: string): void;
    sendStatus(code: number): void;
    status(code: number): Response;
    json(body: unknown): void;
  }
  type NextFunction = () => void;
  type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;
  interface Express {
    (): ExpressApp;
    json(): RequestHandler;
    static(root: string): RequestHandler;
  }
  interface ExpressApp {
    use(handler: RequestHandler | ReturnType<Express["static"]>): void;
    get(path: string, handler: RequestHandler): void;
    post(path: string, handler: RequestHandler): void;
    listen(port: number, callback?: () => void): void;
  }
  const express: Express;
  export default express;
}
