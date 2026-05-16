import { createApp } from "../server";

let app: any;

export default async (req: any, res: any) => {
  console.log(`Vercel Function Call: ${req.method} ${req.url}`);
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
};
