const express = require('express');
const router = express.Router();
const { nanoidCustom } = require('../lib/utils');
const { roomList } = require('../socketio/socketio');

router.get('/create-room', async (req, res, next) => {
	let newRoomId = nanoidCustom();
	if (!roomList.length) {
		const newRoom = {
			id: newRoomId,
			userList: [],
			messageList: [],
			videoList: [],
		};
		roomList.push(newRoom);
		return res.status(200).json({ roomId: newRoomId });
	} else {
		while (roomList.find((room) => room.id === newRoomId)) {
			newRoomId = nanoidCustom();
		}
		return res.status(200).json({ roomId: newRoomId });
	}
});

module.exports = router;
