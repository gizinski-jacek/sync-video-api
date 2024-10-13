import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { namesGenCustom } from '../lib/utils';
import { MessageData, SocketType, UserData, UserDataClient } from 'lib/types';
import { global } from '../lib/global';

export const io = new Server();
const rooms = io.of('/rooms');

rooms.on('connection', (socket: SocketType) => {
	if (!global.client_list.find((client) => client.id === socket.id)) {
		global.client_list.push({
			id: socket.id,
			ip: socket.handshake.address,
			name: namesGenCustom(),
		});
	}
	const roomId = socket.handshake.query.roomId;
	if (!roomId) return;
	const roomExists = global.room_list.find((room) => room.id === roomId);
	if (!roomExists) {
		const newUser: UserData = {
			id: socket.id,
			ip: socket.handshake.address,
			name: namesGenCustom(),
		};
		const newRoom = {
			id: roomId as string,
			createdAt: Date.now(),
			userList: [newUser],
			messageList: [],
			videoList: [],
		};
		global.room_list.push(newRoom);
		socket.join(newRoom.id);
		const roomData = global.room_list.find((room) => room.id === roomId);
		if (!roomData) return;
		const userListWithoutIP: UserDataClient[] = roomData.userList.length
			? roomData.userList.map((user) => ({
					id: user.id,
					name: user.name,
			  }))
			: [];
		socket.emit('all_room_data', {
			userData: { id: newUser.id, name: newUser.name },
			roomData: {
				id: roomId as string,
				createdAt: Date.now(),
				userList: userListWithoutIP,
				messageList: roomData.messageList,
				videoList: roomData.videoList,
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
			socket.join(roomId);
			const userListWithoutIP = roomExists.userList.length
				? roomExists.userList.map((user) => ({
						id: user.id,
						name: user.name,
				  }))
				: [];
			rooms.to(roomId).emit('new_user_joined', {
				userList: userListWithoutIP,
			});
			socket.emit('all_room_data', {
				userData: { id: newUser.id, name: newUser.name },
				roomData: {
					id: roomId as string,
					createdAt: Date.now(),
					userList: userListWithoutIP,
					messageList: roomExists.messageList,
					videoList: roomExists.videoList,
				},
			});
		} else {
			socket.join(roomId);
			const userListWithoutIP = roomExists.userList.length
				? roomExists.userList.map((user) => ({
						id: user.id,
						name: user.name,
				  }))
				: [];
			rooms.to(roomId).emit('new_user_joined', {
				userList: userListWithoutIP,
			});
			socket.emit('all_room_data', {
				userData: { id: userExists.id, name: userExists.name },
				roomData: {
					id: roomId as string,
					createdAt: Date.now(),
					userList: userListWithoutIP,
					messageList: roomExists.messageList,
					videoList: roomExists.videoList,
				},
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
		global.room_list[roomIndex].videoList = newVideoList;
		rooms.to(roomId).emit('video_removed', newVideoList);
	});

	socket.on('start_video', (roomId) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomId).emit('start_video', roomExists.videoList);
	});

	socket.on('stop_video', (roomId) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomId).emit('stop_video', roomExists.videoList);
	});

	socket.on('video_seek', ({ roomId, time }) => {
		const roomExists = global.room_list.find((room) => room.id === roomId);
		if (!roomExists) return;
		rooms.to(roomId).emit('video_seek', time);
	});

	socket.on('change_video', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const videoIndex = global.room_list[roomIndex].videoList.findIndex(
			(vid) => vid.id === video.id && vid.host === video.host
		);
		const newVideoList =
			global.room_list[roomIndex].videoList.slice(videoIndex);
		global.room_list[roomIndex].videoList = newVideoList;
		rooms.to(roomId).emit('change_video', newVideoList);
	});

	socket.on('video_ended', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const newVideoList = global.room_list[roomIndex].videoList.filter((vid) =>
			vid.id === video.id ? (vid.host === video.host ? false : true) : true
		);
		global.room_list[roomIndex].videoList = newVideoList;
		rooms.to(roomId).emit('video_ended', newVideoList);
	});

	socket.on('disconnect', () => {
		const clientListupdated = global.client_list.filter(
			(client) => client.id !== socket.id
		);
		const roomListupdated = global.room_list.map((room) => ({
			...room,
			userList: room.userList.filter((user) => user.id !== socket.id),
		}));
		global.client_list = clientListupdated;
		global.room_list = roomListupdated;
	});
});
