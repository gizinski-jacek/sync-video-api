import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import {
	namesGenCustom,
	stripMessageIPData,
	stripRoomIPData,
	stripUserIPData,
} from '../lib/utils';
import {
	AllClientData,
	ClientToServerEvents,
	MessageData,
	MessageDataClient,
	RoomData,
	ServerToClientEvents,
	SocketType,
	UserData,
	UserDataClient,
	VideoData,
} from 'lib/types';
import { global } from '../lib/global';

export const io = new Server<ClientToServerEvents, ServerToClientEvents>();
const rooms = io.of('/rooms');

rooms.on('connection', (socket: SocketType) => {
	const queryRoomId = socket.handshake.query.roomId as string;
	if (!queryRoomId) return;
	const roomIndex = global.room_list.findIndex(
		(room) => room.id === queryRoomId
	);
	if (roomIndex < 0) {
		const newUser: UserData = {
			id: socket.id,
			ip: socket.handshake.address,
			name: namesGenCustom(),
		};
		const newRoom: RoomData = {
			ownerData: newUser,
			id: queryRoomId as string,
			createdAt: Date.now(),
			userList: [newUser],
			messageList: [],
			videoList: [],
			videoProgress: 0,
		};
		global.room_list.push(newRoom);
		socket.join(newRoom.id);
		const emitAllData: AllClientData = {
			userData: stripUserIPData(newUser),
			roomData: stripRoomIPData(newRoom),
		};
		rooms.to(newRoom.id).emit('all_room_data', emitAllData);
	} else {
		const roomData: RoomData = global.room_list[roomIndex];
		const userExists: UserData | undefined = roomData.userList.find(
			(user) => user.ip === socket.handshake.address
		);
		if (userExists) {
			socket.join(roomData.id);
			const emitAllData: AllClientData = {
				userData: stripUserIPData(userExists),
				roomData: stripRoomIPData(roomData),
			};
			rooms.to(roomData.id).emit('all_room_data', emitAllData);
		} else {
			const socketIPIsRoomOwner: boolean =
				roomData.ownerData.ip === socket.handshake.address;
			const socketIPHasExistingMessages: MessageData | undefined =
				roomData.messageList.find(
					(message) => message.user.ip === socket.handshake.address
				);
			const newUser: UserData = socketIPIsRoomOwner
				? {
						...roomData.ownerData,
						id: socket.id,
				  }
				: socketIPHasExistingMessages
				? {
						...socketIPHasExistingMessages.user,
						id: socket.id,
				  }
				: {
						id: socket.id,
						ip: socket.handshake.address,
						name: namesGenCustom(),
				  };
			const filteredUserList = roomData.userList.filter(
				(user) => user.ip !== newUser.ip
			);
			const updatedMessageList = roomData.messageList.map((msg) =>
				msg.user.ip === newUser.ip ? { ...msg, user: newUser } : msg
			);
			const updatedRoom: RoomData = {
				...roomData,
				ownerData: socketIPIsRoomOwner ? newUser : roomData.ownerData,
				userList: [...filteredUserList, newUser],
				messageList: updatedMessageList,
			};
			global.room_list[roomIndex] = updatedRoom;
			socket.join(updatedRoom.id);
			const emitAllData: AllClientData = {
				userData: stripUserIPData(newUser),
				roomData: stripRoomIPData(updatedRoom),
			};
			rooms.to(roomData.id).emit('all_room_data', emitAllData);
		}
	}

	socket.on('new_chat_message', ({ roomId, message }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData: RoomData = global.room_list[roomIndex];
		const user: UserData | undefined = roomData.userList.find(
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
			updatedRoom.messageList.map((message) => stripMessageIPData(message));
		rooms
			.to(roomData.id)
			.emit('new_chat_message', { messageList: messageListWithoutIP });
	});

	socket.on('new_video_added', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData: RoomData = global.room_list[roomIndex];
		const videoExists: VideoData | undefined = roomData.videoList.find(
			(vid) => vid.id === video.id && vid.host === video.host
		);
		if (videoExists) {
			rooms.to(roomData.id).emit('error', 'Video already on the list');
			return;
		}
		const newVideoList: VideoData[] = [...roomData.videoList, video];
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
		const roomData: RoomData = global.room_list[roomIndex];
		const newVideoList: VideoData[] = roomData.videoList.filter((vid) =>
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
		const roomExists: RoomData | undefined = global.room_list.find(
			(room) => room.id === roomId
		);
		if (!roomExists) return;
		rooms
			.to(roomExists.id)
			.emit('start_video', { videoProgress: roomExists.videoProgress });
	});

	socket.on('stop_video', ({ roomId }) => {
		const roomExists: RoomData | undefined = global.room_list.find(
			(room) => room.id === roomId
		);
		if (!roomExists) return;
		rooms.to(roomExists.id).emit('stop_video');
	});

	socket.on('video_progress', ({ roomId, videoProgress }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		if (global.room_list[roomIndex].ownerData.ip !== socket.handshake.address) {
			return;
		}
		global.room_list[roomIndex].videoProgress = videoProgress;
	});

	socket.on('playback_rate_change', ({ roomId, playbackRate }) => {
		const roomExists: RoomData | undefined = global.room_list.find(
			(room) => room.id === roomId
		);
		if (!roomExists) return;
		rooms.to(roomExists.id).emit('playback_rate_change', { playbackRate });
	});

	socket.on('change_video', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData: RoomData = global.room_list[roomIndex];
		const videoIndex = roomData.videoList.findIndex(
			(vid) => vid.id === video.id && vid.host === video.host
		);
		if (videoIndex < 0) return;
		const newVideoList: VideoData[] = roomData.videoList.slice(videoIndex);
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

	socket.on('reorder_video', ({ roomId, video, targetIndex }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData: RoomData = global.room_list[roomIndex];
		const filteredVideoList: VideoData[] = roomData.videoList.filter((vid) =>
			vid.id === video.id ? (vid.host === video.host ? false : true) : true
		);
		if (targetIndex < 0) {
			filteredVideoList.splice(filteredVideoList.length - 1, 0, video);
		} else if (targetIndex >= filteredVideoList.length) {
			filteredVideoList.splice(0, 0, video);
		} else {
			filteredVideoList.splice(targetIndex, 0, video);
		}
		const updatedRoom: RoomData = {
			...roomData,
			videoList: filteredVideoList,
			videoProgress: 0,
		};
		global.room_list[roomIndex] = updatedRoom;
		rooms
			.to(roomData.id)
			.emit('reorder_video', { videoList: updatedRoom.videoList });
	});

	socket.on('video_ended', ({ roomId, video }) => {
		const roomIndex = global.room_list.findIndex((room) => room.id === roomId);
		if (roomIndex < 0) return;
		const roomData: RoomData = global.room_list[roomIndex];
		const newVideoList: VideoData[] = roomData.videoList.filter((vid) =>
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

	socket.on('disconnecting', () => {
		const socketJoinedRoomsId = Array.from(socket.rooms).slice(1);
		const roomListUpdated: RoomData[] = global.room_list.map((room) =>
			socketJoinedRoomsId.includes(room.id)
				? {
						...room,
						userList: room.userList.filter((user) => user.id !== socket.id),
				  }
				: room
		);
		global.room_list = roomListUpdated;
		socketJoinedRoomsId.forEach((roomId) => {
			const roomData: RoomData | undefined = global.room_list.find(
				(room) => room.id === roomId
			);
			if (!roomData) return;
			const userListWithoutIP: UserDataClient[] = roomData.userList.map(
				(user) => stripUserIPData(user)
			);
			rooms.to(roomId).emit('user_leaving', { userList: userListWithoutIP });
		});
	});
});
