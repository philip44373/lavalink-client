import type { Track, UnresolvedTrack } from "./Track.js";
export interface StoredQueue {
    current: Track | null;
    previous: Track[];
    tracks: (Track | UnresolvedTrack)[];
}
export interface QueueStoreManager {
    /** @async get a Value (MUST RETURN UNPARSED!) */
    get: (guildId: string) => Promise<StoredQueue | string>;
    /** @async Set a value inside a guildId (MUST BE UNPARSED) */
    set: (guildId: string, value: StoredQueue | string) => Promise<void | boolean>;
    /** @async Delete a Database Value based of it's guildId */
    delete: (guildId: string) => Promise<void | boolean>;
    /** @async Transform the value(s) inside of the QueueStoreManager (IF YOU DON'T NEED PARSING/STRINGIFY, then just return the value) */
    stringify: (value: StoredQueue | string) => Promise<StoredQueue | string>;
    /** @async Parse the saved value back to the Queue (IF YOU DON'T NEED PARSING/STRINGIFY, then just return the value) */
    parse: (value: StoredQueue | string) => Promise<Partial<StoredQueue>>;
}
export interface ManagerQueueOptions {
    /** Maximum Amount of tracks for the queue.previous array. Set to 0 to not save previous songs. Defaults to 25 Tracks */
    maxPreviousTracks?: number;
    /** Custom Queue Store option */
    queueStore?: QueueStoreManager;
    /** Custom Queue Watcher class */
    queueChangesWatcher?: QueueChangesWatcher;
}
export interface QueueChangesWatcher {
    /** get a Value (MUST RETURN UNPARSED!) */
    tracksAdd: (guildId: string, tracks: (Track | UnresolvedTrack)[], position: number, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => void;
    /** Set a value inside a guildId (MUST BE UNPARSED) */
    tracksRemoved: (guildId: string, tracks: (Track | UnresolvedTrack)[], position: number | number[], oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => void;
    /** Set a value inside a guildId (MUST BE UNPARSED) */
    shuffled: (guildId: string, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => void;
}
