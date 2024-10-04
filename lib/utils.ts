import fs from 'fs';
import { customAlphabet } from 'nanoid';
import {
	uniqueNamesGenerator,
	adjectives,
	colors,
} from 'unique-names-generator';
import { global } from './global';

const roomLifespan = 5 * 60 * 1000;

export const nanoidCustom = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	6
);

export const namesGenCustom = () =>
	uniqueNamesGenerator({
		dictionaries: [adjectives, colors],
	});

export const cleanupRooms = (seconds = 15) => {
	const { room_list } = global;
	setInterval(() => {
		if (!room_list.length) return;
		const roomIdToDelete = room_list
			.filter(
				(room) =>
					room.userList.length === 0 &&
					room.createdAt + roomLifespan < Date.now()
			)
			.map((room) => room.id);
		if (roomIdToDelete.length <= 0) return;
		roomIdToDelete.forEach((dir) => {
			fs.rmSync(`public/uploads/${dir}`, { recursive: true, force: true });
		});
		const roomListUpdated = room_list.filter(
			(room) =>
				!(
					room.userList.length === 0 &&
					room.createdAt + roomLifespan < Date.now()
				)
		);
		global.room_list = roomListUpdated;
		console.log(`Number of deleted rooms: ${roomIdToDelete.length}`);
	}, seconds * 1000);
};
