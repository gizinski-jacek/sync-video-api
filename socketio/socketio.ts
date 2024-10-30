import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { namesGenCustom } from '../lib/utils';
import {
	ClientToServerEvents,
	MessageData,
	MessageDataClient,
	RoomData,
	RoomDataClient,
	ServerToClientEvents,
	SocketType,
	UserData,
	UserDataClient,
} from 'lib/types';
import { global } from '../lib/global';

export const io = new Server<ClientToServerEvents, ServerToClientEvents>();
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
	const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
	if (roomIndex < 0) {
		const newUser: UserData = {
			id: socket.id,
			ip: socket.handshake.address,
			name: namesGenCustom(),
		};
		const newRoom: RoomData = {
			ownerIP: socket.handshake.address,
			ownerId: newUser.id,
			id: roomId as string,
			createdAt: Date.now(),
			userList: [newUser],
			messageList: [],
			videoList: [],
			videoProgress: 0,
		};
		global.room_list.push(newRoom);
		socket.join(newRoom.id);
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
		const roomData = global.room_list[roomIndex];
		const userExists = roomData.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		if (!userExists) {
			const userHasExistingMessages = roomData.messageList.find(
				(message) => message.user.ip === socket.handshake.address
			);
			const newUser: UserData = userHasExistingMessages
				? { ...userHasExistingMessages.user }
				: {
						id: socket.id,
						ip: socket.handshake.address,
						name: namesGenCustom(),
				  };
			roomData.userList.push(newUser);
			const updatedRoom: RoomData = {
				...roomData,
				userList: [...roomData.userList, newUser],
			};
			global.room_list[roomIndex] = updatedRoom;
			socket.join(updatedRoom.id);
			const userListWithoutIP: UserDataClient[] = updatedRoom.userList.map(
				(user) => ({
					id: user.id,
					name: user.name,
				})
			);
			const updatedRoomWithoutIP: RoomDataClient = {
				ownerId:
					updatedRoom.ownerIP === newUser.ip ? newUser.id : updatedRoom.id,
				id: updatedRoom.id,
				createdAt: updatedRoom.createdAt,
				userList: userListWithoutIP,
				messageList: updatedRoom.messageList,
				videoList: updatedRoom.videoList,
			};
			const newUserWithoutIP: UserDataClient = {
				id: newUser.id,
				name: newUser.name,
			};
			rooms.to(roomData.id).emit('all_room_data', {
				userData: newUserWithoutIP,
				roomData: updatedRoomWithoutIP,
			});
		} else {
			socket.join(roomData.id);
			const userListWithoutIP: UserDataClient[] = roomData.userList.map(
				(user) => ({
					id: user.id,
					name: user.name,
				})
			);
			const userExistsWithoutIP: UserDataClient = {
				id: userExists.id,
				name: userExists.name,
			};
			const roomDataWithoutIP: RoomDataClient = {
				ownerId: roomData.ownerIP,
				id: roomData.id,
				createdAt: roomData.createdAt,
				userList: userListWithoutIP,
				messageList: roomData.messageList,
				videoList: roomData.videoList,
			};
			rooms.to(roomData.id).emit('all_room_data', {
				userData: userExistsWithoutIP,
				roomData: roomDataWithoutIP,
			});
		}
	}

	socket.on('new_chat_message', ({ roomId, message }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData = global.room_list[roomIndex];
		const user = roomData.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		if (!user) return;
		const newMessage: MessageData = {
			id: nanoid(),
			user: user,
			message: message,
			timestamp: Date.now(),
		};
		const updatedRoom: RoomData = {
			...roomData,
			messageList: [...roomData.messageList, newMessage],
		};
		global.room_list[roomIndex] = updatedRoom;
		const messageListWithoutIP: MessageDataClient[] =
			updatedRoom.messageList.map((message) => {
				return {
					id: message.id,
					user: message.user,
					message: message.message,
					timestamp: message.timestamp,
				};
			});
		rooms
			.to(roomData.id)
			.emit('new_chat_message', { messageList: messageListWithoutIP });
	});

	socket.on('new_video_added', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData = global.room_list[roomIndex];
		const videoExists = roomData.videoList.find(
			(vid) => vid.id === video.id && vid.host === video.host
		);
		if (videoExists) {
			rooms.to(roomData.id).emit('error', 'Video already on the list');
			return;
		}
		const newVideoList = [...roomData.videoList, video];
		const updatedRoom: RoomData = {
			...roomData,
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms
			.to(roomData.id)
			.emit('new_video_added', { videoList: updatedRoom.videoList });
	});

	socket.on('video_removed', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData = global.room_list[roomIndex];
		const newVideoList = roomData.videoList.filter((vid) =>
			vid.id === video.id ? (vid.host === video.host ? false : true) : true
		);
		const updatedRoom: RoomData = {
			...roomData,
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms
			.to(roomData.id)
			.emit('video_removed', { videoList: updatedRoom.videoList });
	});

	socket.on('start_video', ({ roomId }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms
			.to(roomExists.id)
			.emit('start_video', { videoProgress: roomExists.videoProgress });
	});

	socket.on('stop_video', ({ roomId }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomExists.id).emit('stop_video');
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
		rooms.to(roomExists.id).emit('playback_rate_change', { playbackRate });
	});

	socket.on('change_video', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData = global.room_list[roomIndex];
		const videoIndex = roomData.videoList.findIndex(
			(vid) => vid.id === video.id && vid.host === video.host
		);
		const newVideoList = roomData.videoList.slice(videoIndex);
		const updatedRoom: RoomData = {
			...roomData,
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms
			.to(roomData.id)
			.emit('change_video', { videoList: updatedRoom.videoList });
	});

	socket.on('video_ended', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData = global.room_list[roomIndex];
		const newVideoList = roomData.videoList.filter((vid) =>
			vid.id === video.id ? (vid.host === video.host ? false : true) : true
		);
		const updatedRoom: RoomData = {
			...roomData,
			videoList: newVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms
			.to(roomData.id)
			.emit('video_ended', { videoList: updatedRoom.videoList });
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
		rooms.to(emitRoomList).emit('user_leaving', { userId: socket.id });
	});
});
