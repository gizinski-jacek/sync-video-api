import fs from 'fs';
import { customAlphabet } from 'nanoid';
import {
	uniqueNamesGenerator,
	adjectives,
	colors,
} from 'unique-names-generator';
import { global } from './global';
import {
	MessageData,
	MessageDataClient,
	RoomData,
	RoomDataClient,
	UserData,
	UserDataClient,
} from './types';

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

export const stripUserIPData = (user: UserData): UserDataClient => {
	return { id: user.id, name: user.name };
};

export const stripMessageIPData = (message: MessageData): MessageDataClient => {
	return {
		id: message.id,
		user: stripUserIPData(message.user),
		message: message.message,
		timestamp: message.timestamp,
	};
};

export const stripRoomIPData = (room: RoomData): RoomDataClient => {
	return {
		ownerData: stripUserIPData(room.ownerData),
		id: room.id,
		createdAt: room.createdAt,
		userList: room.userList.map((user) => stripUserIPData(user)),
		messageList: room.messageList.map((msg) => stripMessageIPData(msg)),
		videoList: room.videoList,
	};
};
