import { RoomData } from './types';

export const global = {
	client_list: [] as {
		id: string;
		ip: string;
	}[],
	room_list: [] as RoomData[],
};
