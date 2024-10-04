import express, { Response } from 'express';
const router = express.Router();
import { nanoidCustom } from '../lib/utils';
import { RoomData } from '../lib/types';
import { global } from '../lib/global';

// ! Find the reason for this error
// @ts-ignore
export default router.get('/create-room', (res: Response) => {
	const { room_list } = global;
	let newRoomId = nanoidCustom();
	if (!room_list.length) {
		const newRoom: RoomData = {
			id: newRoomId,
			createdAt: Date.now(),
			userList: [],
			messageList: [],
			videoList: [],
		};
		room_list.push(newRoom);
		return res.status(200).json({ roomId: newRoomId });
	} else {
		while (room_list.find((room) => room.id === newRoomId)) {
			newRoomId = nanoidCustom();
		}
		return res.status(200).json({ roomId: newRoomId });
	}
});
