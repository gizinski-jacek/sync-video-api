import express, { Request, Response } from 'express';
import { nanoidCustom } from '../lib/utils';
import { global } from '../lib/global';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
	res.send(
		`<main>
				<h2>Sync Video API.</h2>
				<p><a href=https://github.com/gizinski-jacek/sync-video-api>Express API Github Repository</a></p>
				<p><a href=https://github.com/gizinski-jacek/sync-video>NextJS Client Github Repository</a></p>
			</main>`
	);
});

router.get('/create-room', (req: Request, res: Response) => {
	const { room_list } = global;
	let newRoomId = nanoidCustom();
	if (!room_list.length) {
		res.status(200).json({ roomId: newRoomId });
	} else {
		while (room_list.find((room) => room.id === newRoomId)) {
			newRoomId = nanoidCustom();
		}
		res.status(200).json({ roomId: newRoomId });
	}
});

export default router;
