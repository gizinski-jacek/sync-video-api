import fs from 'fs';
import { customAlphabet } from 'nanoid';
import {
	uniqueNamesGenerator,
	adjectives,
	colors,
} from 'unique-names-generator';
import { global } from './global';

export const nanoidCustom = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	6
);

export const namesGenCustom = () =>
	uniqueNamesGenerator({
		dictionaries: [adjectives, colors],
		length: 2,
		separator: '-',
		style: 'capital',
	});

export const cleanupRooms = (
	checkIntervalSeconds = 15,
	roomLifespanMinutes = 5
) => {
	const interval = checkIntervalSeconds * 1000;
	const lifespan = roomLifespanMinutes * 60 * 1000;
	setInterval(() => {
		const { room_list } = global;
		if (!room_list.length) return;
		const roomIdToDelete = room_list
			.filter(
				(room) =>
					room.userList.length === 0 && room.createdAt + lifespan < Date.now()
			)
			.map((room) => room.id);
		if (roomIdToDelete.length <= 0) return;
		const roomListUpdated = room_list.filter(
			(room) =>
				!(room.userList.length === 0 && room.createdAt + lifespan < Date.now())
		);
		global.room_list = roomListUpdated;
		console.log(`Number of deleted rooms: ${roomIdToDelete.length}`);
	}, interval * 1000);
};
