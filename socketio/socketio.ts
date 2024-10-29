import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { namesGenCustom } from '../lib/utils';
import {
	MessageData,
	RoomData,
	RoomDataClient,
	SocketType,
	UserData,
	UserDataClient,
} from 'lib/types';
import { global } from '../lib/global';

export const io = new Server();
const rooms = io.of('/rooms');

rooms.on('connection', (socket: SocketType) => {
	if (!global.client_list.find((client) => client.id === socket.id)) {
		global.client_list.push({
			id: socket.id,
			ip: socket.handshake.address,
		});
	}
	const roomId = socket.handshake.query.roomId as string;
	if (!roomId) return;
	const roomExists = global.room_list.find((room) => room.id === roomId);
	if (!roomExists) {
		const newUser: UserData = {
			id: socket.id,
			ip: socket.handshake.address,
			name: namesGenCustom(),
		};
		const newRoom: RoomData = {
			ownerIP: socket.handshake.address,
			id: roomId as string,
			createdAt: Date.now(),
			userList: [newUser],
			messageList: [],
			videoList: [],
			videoProgress: 0,
		};
		global.room_list.push(newRoom);
		socket.join(newRoom.id);
		const roomData = global.room_list.find((room) => room.id === roomId);
		if (!roomData) return;
		const userWithoutIP: UserDataClient = {
			id: newUser.id,
			name: newUser.name,
		};
		rooms.to(newRoom.id).emit('all_room_data', {
			userData: userWithoutIP,
			roomData: {
				ownerId: userWithoutIP.id,
				id: newRoom.id,
				createdAt: newRoom.createdAt,
				userList: [userWithoutIP],
				messageList: newRoom.messageList,
				videoList: newRoom.videoList,
			},
		});
	} else {
		const userExists = roomExists.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		if (!userExists) {
			const newUser = {
				id: socket.id,
				ip: socket.handshake.address,
				name: namesGenCustom(),
			};
			roomExists.userList.push(newUser);
			global.room_list.map((room) =>
				room.id === roomExists.id ? roomExists : room
			);
			socket.join(roomExists.id);
			const userListWithoutIP: UserDataClient[] = roomExists.userList.length
				? roomExists.userList.map((user) => ({
						id: user.id,
						name: user.name,
				  }))
				: [];
			const updatedRoom: RoomDataClient = {
				ownerId:
					roomExists.ownerIP === socket.handshake.address
						? socket.id
						: roomExists.id,
				id: roomExists.id,
				createdAt: roomExists.createdAt,
				userList: userListWithoutIP,
				messageList: roomExists.messageList,
				videoList: roomExists.videoList,
			};
			const newUserWithoutIP: UserDataClient = {
				id: newUser.id,
				name: newUser.name,
			};
			rooms.to(roomExists.id).emit('all_room_data', {
				userData: newUserWithoutIP,
				roomData: updatedRoom,
			});
		} else {
			socket.join(roomExists.id);
			const userListWithoutIP = roomExists.userList.length
				? roomExists.userList.map((user) => ({
						id: user.id,
						name: user.name,
				  }))
				: [];
			const userExistsWithoutIP = {
				id: userExists.id,
				name: userExists.name,
			};
			const updatedRoom: RoomDataClient = {
				ownerId: userExistsWithoutIP.id,
				id: roomExists.id,
				createdAt: roomExists.createdAt,
				userList: userListWithoutIP,
				messageList: roomExists.messageList,
				videoList: roomExists.videoList,
			};
			rooms.to(roomExists.id).emit('all_room_data', {
				userData: userExistsWithoutIP,
				roomData: updatedRoom,
			});
		}
	}

	socket.on('new_chat_message', ({ roomId, message }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		const user = roomExists.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		if (!user) return;
		const newMessage: MessageData = {
			id: nanoid(),
			user: user,
			message: message,
			timestamp: Date.now(),
		};
		roomExists.messageList.push(newMessage);
		global.room_list.map((room) =>
			room.id === roomExists.id
				? { ...room, messageList: roomExists.messageList }
				: room
		);
		rooms.to(roomId).emit('new_chat_message', roomExists.messageList);
	});

	socket.on('new_video_added', ({ roomId, video }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		const videoExists = roomExists.videoList.find((vid) => vid.id === video.id);
		if (videoExists) {
			rooms.to(roomId).emit('error', 'Video already on the list');
			return;
		}
		roomExists.videoList.push(video);
		global.room_list.map((room) =>
			room.id === roomExists.id
				? { ...room, videoList: roomExists.videoList }
				: room
		);
		rooms.to(roomId).emit('new_video_added', roomExists.videoList);
	});

	socket.on('video_removed', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const newVideoList = global.room_list[roomIndex].videoList.filter((vid) =>
			vid.id === video.id ? (vid.host === video.host ? false : true) : true
		);
		const updatedRoom: RoomData = {
			...global.room_list[roomIndex],
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms.to(roomId).emit('video_removed', newVideoList);
	});

	socket.on('start_video', ({ roomId }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomId).emit('start_video', roomExists.videoProgress);
	});

	socket.on('stop_video', ({ roomId }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomId).emit('stop_video');
	});

	socket.on('video_progress', ({ roomId, videoProgress }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		if (global.room_list[roomIndex].ownerIP !== socket.handshake.address)
			return;
		global.room_list[roomIndex].videoProgress = videoProgress;
	});

	socket.on('playback_rate_change', ({ roomId, playbackRate }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomId).emit('playback_rate_change', playbackRate);
	});

	socket.on('change_video', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const videoIndex = global.room_list[roomIndex].videoList.findIndex(
			(vid) => vid.id === video.id && vid.host === video.host
		);
		const newVideoList =
			global.room_list[roomIndex].videoList.slice(videoIndex);
		const updatedRoom: RoomData = {
			...global.room_list[roomIndex],
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms.to(roomId).emit('change_video', newVideoList);
	});

	socket.on('video_ended', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const newVideoList = global.room_list[roomIndex].videoList.filter((vid) =>
			vid.id === video.id ? (vid.host === video.host ? false : true) : true
		);
		const updatedRoom: RoomData = {
			...global.room_list[roomIndex],
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms.to(roomId).emit('video_ended', newVideoList);
	});

	socket.on('disconnect', () => {
		const clientListUpdated = global.client_list.filter(
			(client) => client.id !== socket.id
		);
		const roomListUpdated = global.room_list.map((room) => ({
			...room,
			userList: room.userList.filter((user) => user.id !== socket.id),
		}));
		global.client_list = clientListUpdated;
		global.room_list = roomListUpdated;
		const emitRoomList = roomListUpdated
			.filter((room) => room.userList.find((user) => user.id === socket.id))
			.map((room) => room.id);
		rooms.to(emitRoomList).emit('user_leaving', socket.id);
	});
});
