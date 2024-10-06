import { Socket } from 'socket.io';

export type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface UserData {
	id: string;
	ip: string;
	name: string;
}

export type UserDataClient = Omit<UserData, 'ip'>;

export interface RoomDataClient extends Omit<RoomData, 'userList'> {
	userList: UserDataClient[];
}

export interface MessageData {
	id: string;
	user: UserData;
	message: string;
	timestamp: number;
}

export interface RoomData {
	id: string;
	createdAt: number;
	userList: UserData[];
	messageList: MessageData[];
	videoList: VideoData[];
}

export interface AllRoomData {
	userData: UserDataClient;
	roomData: RoomDataClient;
}

type ServerToClientEvents = {
	oops: (error: any) => void;
	all_room_data: (data: AllRoomData) => void;
	new_user_joined: (userData: UserDataClient) => void;
	new_message_received: (messageData: MessageData) => void;
	new_video_added: (videoData: VideoData[]) => void;
	start_video_playback: () => void;
	stop_video_playback: () => void;
	jump_to_video_time: (seconds: number) => void;
	video_ended: (data: { roomId: string; time: number }) => void;
	error: (message: string) => void;
};

type ClientToServerEvents = {
	send_message: (data: { roomId: string; message: string }) => void;
	add_video: (data: { roomId: string; video: VideoData }) => void;
	start_video_playback: (roomId: string) => void;
	stop_video_playback: (roomId: string) => void;
	jump_to_video_time: (data: { roomId: string; time: number }) => void;
	change_video: (data: { roomId: string; videoId: string }) => void;
	video_ended: (roomId: string) => void;
};

export type Hosts = 'youtube';

export interface VideoData {
	host: Hosts;
	id: string;
	url: string;
	title: string | null;
	channelId: string | null;
	channelName: string;
	iFrameSrcId: string;
	livestreamChat: boolean;
	thumbnailUrl: string | null;
}

export interface YoutubeResponse {
	kind: string;
	etag: string;
	nextPageToken: string;
	prevPageToken: string;
	pageInfo: {
		totalResults: number;
		resultsPerPage: number;
	};
	items: YoutubeVideo[];
}

export interface YoutubeVideo {
	kind: string;
	etag: string;
	id: string;
	snippet: {
		publishedAt: string;
		channelId: string;
		title: string;
		description: string;
		thumbnails: {
			[key: string]: {
				url: string;
				width: number;
				height: number;
			};
		};
		channelTitle: string;
		tags: string[];
		categoryId: string;
		liveBroadcastContent: string;
		defaultLanguage: string;
		localized: {
			title: string;
			description: string;
		};
		defaultAudioLanguage: string;
	};
}
