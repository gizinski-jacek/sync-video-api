import { Socket } from 'socket.io';

export type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface UserData {
	id: string;
	ip: string;
	name: string;
}

export interface MessageData {
	id: string;
	user: UserData;
	message: string;
	timestamp: number;
}

export interface RoomData {
	ownerIP: string;
	ownerId: string;
	id: string;
	createdAt: number;
	userList: UserData[];
	messageList: MessageData[];
	videoList: VideoData[];
	videoProgress: number;
}

export type UserDataClient = Omit<UserData, 'ip'>;

export interface MessageDataClient extends Omit<MessageData, 'user'> {
	user: UserDataClient;
}

export interface RoomDataClient
	extends Omit<
		RoomData,
		'userList' | 'videoProgress' | 'ownerIP' | 'messageList'
	> {
	userList: UserDataClient[];
	messageList: MessageDataClient[];
}

export type ServerToClientEvents = {
	oops: (error: any) => void;
	all_room_data: (data: {
		userData: UserDataClient;
		roomData: RoomDataClient;
	}) => void;
	user_leaving: (data: { userId: string }) => void;
	new_chat_message: (data: { messageList: MessageDataClient[] }) => void;
	new_video_added: (data: { videoList: VideoData[] }) => void;
	video_removed: (data: { videoList: VideoData[] }) => void;
	start_video: (data: { videoProgress: number }) => void;
	stop_video: () => void;
	video_progress: (data: { videoProgress: number }) => void;
	playback_rate_change: (data: { playbackRate: number }) => void;
	change_video: (data: { videoList: VideoData[] }) => void;
	video_ended: (data: { videoList: VideoData[] }) => void;
	error: (message: string) => void;
};

export type ClientToServerEvents = {
	new_chat_message: (data: { roomId: string; message: string }) => void;
	new_video_added: (data: { roomId: string; video: VideoData }) => void;
	video_removed: (data: { roomId: string; video: VideoData }) => void;
	start_video: (data: { roomId: string }) => void;
	stop_video: (data: { roomId: string }) => void;
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
