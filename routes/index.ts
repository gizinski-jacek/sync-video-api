import express, { Request, Response } from 'express';
const router = express.Router();

/* GET home page. */
export default router.get('/', (req: Request, res: Response) => {
	res.redirect('/api');
});
