import {Ticket} from "./Ticket";

export type StorageType = string | "custom";
export interface TicketManagerOptions {
    enabled: boolean
    parentId: string
    staffRole: string
    pingStaff?: boolean
    closeParentId: string
    channelTopic: boolean
    ticketCache: boolean
    storage: StorageType
}


export type TicketStatus = "closed" | "open";
export interface TicketData {
    guild: string
    member: string
    channel: string
    number: number
    status: TicketStatus
    participants: Array<string>
}

export interface TicketManagerEvents {
    'ticketCreate' :  (ticket: Ticket) => void;
    'ticketClosed' :  (ticket: Ticket) => void;
    'ticketReOpen' :  (ticket: Ticket) => void;
    'ticketDeleted':  (ticket: Ticket) => void;
}

