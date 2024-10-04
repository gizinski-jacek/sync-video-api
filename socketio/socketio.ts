import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { namesGenCustom } from '../lib/utils';
import { MessageData, SocketType, UserData, UserDataClient } from 'lib/types';
import { global } from '../lib/global';

export const io = new Server();
const rooms = io.of('/rooms');

rooms.on('connection', (socket: SocketType) => {
	const { client_list } = global;
	const { room_list } = global;
	if (!client_list.find((client) => client.id === socket.id)) {
		client_list.push({
			id: socket.id,
			ip: socket.handshake.address,
			name: namesGenCustom(),
		});
	}
	const roomId = socket.handshake.query.roomId;
	if (!roomId) return;
	const roomExists = room_list.find((room) => room.id === roomId);
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
		room_list.push(newRoom);
		socket.join(newRoom.id);
		const roomData = room_list.find((room) => room.id === roomId);
		if (!roomData) return;
		const userListWithoutIP: UserDataClient[] = roomData.userList.length
			? roomData.userList.map((user) => ({
					id: user.id,
					name: user.name,
			  }))
			: [];
		socket.emit('all_room_data', {
			userData: { id: newUser.id, name: newUser.name },
			userList: userListWithoutIP,
			messageList: roomData.messageList,
			videoList: roomData.videoList,
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
				userList: userListWithoutIP,
				messageList: roomExists.messageList,
				videoList: roomExists.videoList,
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
				userList: userListWithoutIP,
				messageList: roomExists.messageList,
				videoList: roomExists.videoList,
			});
		}
	}

	socket.on('send_message', (data) => {
		const { roomId, message } = data;
		const room = room_list.find((room) => room.id === roomId);
		if (!room) return;
		const user = room.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		if (!user) return;
		const newMessage: MessageData = {
			id: nanoid(),
			user: user,
			message: message,
			timestamp: Date.now(),
		};
		room.messageList.push(newMessage);
		rooms.to(roomId).emit('new_message_received', newMessage);
	});

	socket.on('add_video', ({ roomId, video }) => {
		const room = room_list.find((room) => room.id === roomId);
		if (!room) return;
		const videoExists = room.videoList.find((video) => video.id === video.id);
		if (videoExists) return;
		room.videoList.push(video);
		rooms.to(roomId).emit('new_video_added', room.videoList);
	});

	socket.on('start_video_playback', ({ roomId }) => {
		const room = room_list.find((room) => room.id === roomId);
		if (!room) return;
		rooms.to(roomId).emit('start_video_playback', room.videoList);
	});

	socket.on('stop_video_playback', ({ roomId }) => {
		const room = room_list.find((room) => room.id === roomId);
		if (!room) return;
		rooms.to(roomId).emit('stop_video_playback', room.videoList);
	});

	socket.on('jump_to_video_time', ({ roomId, time }) => {
		const room = room_list.find((room) => room.id === roomId);
		if (!room) return;
		rooms.to(roomId).emit('jump_to_video_time', time);
	});

	socket.on('disconnect', () => {
		const clientListupdated = client_list.filter(
			(client) => client.id !== socket.id
		);
		global.client_list = clientListupdated;
		const roomListupdated = room_list.map((room) => ({
			...room,
			userList: room.userList.filter((user) => user.id !== socket.id),
		}));
		global.room_list = roomListupdated;
	});
});
