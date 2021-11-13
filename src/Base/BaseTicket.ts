import { BaseManager } from "./BaseManager";
import {
    TicketData,
    TicketStatus,
    TicketTypes
} from "../types/types";
import { TicketManager } from "../Text/TicketManager";

/**
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Guild}
 */

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildMember}
 */

import {
    Guild, GuildMember
} from "discord.js";

export class BaseTicket {
    readonly manager: BaseManager;
    readonly data: TicketData
    readonly guildId: string;
    readonly channelId: string;
    readonly memberId: string;
    readonly number: number;
    readonly status: TicketStatus;
    readonly type: TicketTypes
    participants: Array<string>;
    /**
     * @param {TicketManager} manager The Ticket Manager
     * @param {TicketData} data The ticket data
     */
    constructor(manager: BaseManager, data: TicketData) {
        /**
         * The Ticket manager
         * @readonly
         * @type {TicketManager}
         */
        this.manager = manager;
        this.data = data
        /**
         * The discord guild id
         * @readonly
         * @private
         * @type {string}
         */
        this.guildId = data.guild;
        /**
         * The discord channel id
         * @readonly
         * @private
         * @type {string}
         */
        this.channelId = data.channel;
        /**
         * The discord member id
         * @readonly
         * @private
         * @type {string}
         */
        this.memberId = data.member;
        /**
         * The ticket number
         * @readonly
         * @type {string}
         */
        this.number = data.number;
        /**
         * The ticket status
         * @readonly
         * @type {string}
         */
        this.status = data.status;
        /**
         * Ticket type
         * @type {string}
         */
        this.type = data.type;
        /**
         * The list of participants of the ticket
         * @type {Array<string>}
         */
        this.participants = data.participants;
    }
    /**
     * Ticket's Guild
     * @type {Guild}
     * @readonly
     */
    get guild(): Guild {
        return this.manager.getGuild(this.guildId) as Guild
    }

    /**
     * Ticket's Member
     * @type {GuildMember}
     * @readonly
     */
    get member(): GuildMember {
        return this.guild.members.cache.get(this.memberId) as GuildMember
    }
}

/**
 * Ticket's Status:
 * * "closed"
 * * "open"
 * @typedef {string} TicketStatus
 */

/**
 * Ticket's channel type:
 * * "thread"
 * * "channel"
 * * "dm"
 * @typedef {string} TicketTypes
 */

/**
 * Ticket Data
 * @typedef {object} TicketData
 * @property {string} guild Discord Guild ID
 * @property {string} member Discord Guild Member ID
 * @property {string} channel Discord Channel ID
 * @property {string} number Ticket's number
 * @property {TicketStatus} status Ticket's status
 * @property {Array<string>} participants Ticket's Participants list
 * @property {TicketTypes} type Ticket's channel type
 */