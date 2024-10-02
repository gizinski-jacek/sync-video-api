const { Server } = require('socket.io');
const {
	uniqueNamesGenerator,
	adjectives,
	colors,
} = require('unique-names-generator');

const io = new Server();
const rooms = io.of('/rooms');
let client_list = [];
let room_list = [];

rooms.on('connection', (socket) => {
	if (!client_list.find((client) => client.id === socket.id)) {
		client_list.push(socket);
	}
	const roomId = socket.handshake.query.roomId;
	if (!roomId) return;
	const roomExists = room_list.find((room) => room.id === roomId);
	if (!roomExists) {
		const newUser = {
			id: socket.id,
			ip: socket.handshake.address,
			name: uniqueNamesGenerator({
				dictionaries: [adjectives, colors],
			}),
		};
		const newRoom = {
			id: roomId,
			userList: [newUser],
			messageList: [],
			videoList: [],
			createdAt: new Date(),
		};
		room_list.push(newRoom);
		socket.join(roomId);
		const roomData = room_list.find((room) => room.id === roomId);
		const userListWithoutIP = roomData.userList.length
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
				name: uniqueNamesGenerator({
					dictionaries: [adjectives, colors],
				}),
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
		const user = room.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		const newMessage = {
			user: user,
			message: message,
			timestamp: new Date(),
		};
		room.messageList.push(newMessage);
		rooms.to(roomId).emit('new_message_received', newMessage);
	});

	socket.on('add_video', (data) => {
		const { roomId, video } = data;
		const room = room_list.find((room) => room.id === roomId);
		const videoExists = room.videoList.find((video) => video.id === data.id);
		if (videoExists) return;
		room.videoList.push(video);
		rooms.to(roomId).emit('new_video_added', room.videoList);
	});

	socket.on('start_video_playback', (data) => {
		const { roomId, video } = data;
		const room = room_list.find((room) => room.id === roomId);
		room.videoList.push(video);
		rooms.to(roomId).emit('start_video_playback', room.videoList);
	});

	socket.on('stop_video_playback', (data) => {
		const { roomId, video } = data;
		const room = room_list.find((room) => room.id === roomId);
		room.videoList.push(video);
		rooms.to(roomId).emit('stop_video_playback', room.videoList);
	});

	socket.on('jump_to_video_time', (data) => {
		const { roomId, video } = data;
		const room = room_list.find((room) => room.id === roomId);
		room.videoList.push(video);
		rooms.to(roomId).emit('jump_to_video_time', room.videoList);
	});

	socket.on('disconnect', () => {
		client_list = client_list.filter((client) => client.id !== socket.id);
		room_list = room_list.map((room) => ({
			...room,
			userList: room.userList.filter((user) => user.id !== socket.id),
		}));
	});
});

exports.roomList = room_list;
exports.io = io;
