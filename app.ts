import dotenv from 'dotenv';
import createError from 'http-errors';
import express, { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import indexRouter from './routes/index';
import apiRouter from './routes/api';
import { cleanupRooms } from './lib/utils';

declare global {
	interface Error {
		status?: number;
	}
}

dotenv.config();
const app: Application = express();

const corsOptions = {
	origin: process.env.CLIENT_URI,
	methods: ['GET'],
	allowedHeaders: [
		'Access-Control-Allow-Origin',
		'Origin',
		'X-Requested-With',
		'Content-Type',
		'Accept',
		'Authorization',
	],
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

app.use('/', indexRouter);
app.use('/api', apiRouter);
cleanupRooms(15, 5);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	// res.render('error');
});

export default app;
