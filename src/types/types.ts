import {TextTicket} from "../Text/TextTicket";
import {ThreadTicket} from "../Thread/ThreadTicket";



export type StorageType = string | "custom";
export type TicketStatus = "closed" | "open";
export type TicketTypes = "thread" | "channel" | "dm";



export interface TicketData {
    guild: string
    member: string
    channel: string
    number: number
    status: TicketStatus
    participants: Array<string>
    type: TicketTypes
}

export interface TicketManagerEvents {
    'ticketCreate' :  (ticket: TextTicket) => void;
    'ticketClosed' :  (ticket: TextTicket) => void;
    'ticketReOpen' :  (ticket: TextTicket) => void;
    'ticketDeleted':  (ticket: TextTicket) => void;
    'ticketRename' :  (ticket: TextTicket) => void
}

export interface ThreadManagerEvents {
    'ticketCreate' :  (ticket: ThreadTicket) => void;
    'ticketClosed' :  (ticket: ThreadTicket) => void;
    'ticketReOpen' :  (ticket: ThreadTicket) => void;
    'ticketDeleted':  (ticket: ThreadTicket) => void;
    'ticketRename' :  (ticket: ThreadTicket) => void
}

export interface BaseManagerOptions {
    enabled: boolean
    staffRole: string
    ticketCache: boolean
    storage: StorageType
}

export interface TicketManagerOptions {
    enabled: boolean
    parentId: string
    staffRole: string
    closeParentId: string
    channelTopic: boolean
    ticketCache: boolean
    storage: StorageType
}

export interface ThreadManagerOptions {
    enabled: boolean
    channelId: string
    staffRole: string
    ticketCache: boolean
    storage: StorageType
}

