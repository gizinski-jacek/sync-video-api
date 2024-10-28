import { Socket } from 'socket.io';

export type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface UserData {
	id: string;
	ip: string;
	name: string;
	roomIdOwnerList: string[];
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
	videoProgress: number;
}

export interface AllRoomData {
	userData: UserDataClient;
	roomData: RoomDataClient;
}

type ServerToClientEvents = {
	oops: (error: any) => void;
	all_room_data: (data: AllRoomData) => void;
	new_user_joined: (userData: UserDataClient) => void;
	user_leaving: (userId: string) => void;
	new_chat_message: (messageData: MessageData[]) => void;
	new_video_added: (videoData: VideoData[]) => void;
	video_removed: (videoData: VideoData[]) => void;
	start_video: (videoProgress: number) => void;
	video_progress: (videoProgress: number) => void;
	playback_rate_change: (playbackRate: number) => void;
	change_video: (videoData: VideoData[]) => void;
	video_ended: (videoData: VideoData[]) => void;
	error: (message: string) => void;
};

type ClientToServerEvents = {
	new_chat_message: (data: { roomId: string; message: string }) => void;
	new_video_added: (data: { roomId: string; video: VideoData }) => void;
	video_removed: (data: { roomId: string; video: VideoData }) => void;
	start_video: (data: { roomId: string }) => void;
	video_progress: (data: { roomId: string; videoProgress: number }) => void;
	playback_rate_change: (data: {
		roomId: string;
		playbackRate: number;
	}) => void;
	change_video: (data: { roomId: string; video: VideoData }) => void;
	video_ended: (data: { roomId: string; video: VideoData }) => void;
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
