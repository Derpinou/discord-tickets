import {TicketManager} from "./TicketManager";

import {TicketData, TicketStatus} from "./interfaces";

import {
    Guild,
    GuildMember,
    TextChannel
} from "discord.js";

/**
 * Represents a Ticket
 */
export class Ticket {
    readonly manager: TicketManager;
    readonly data: TicketData;
    readonly guildId: string;
    readonly channelId: string;
    readonly memberId: string;
    readonly number: number;
    readonly status: TicketStatus;
    participants: Array<string>;
    /**
     * @param {TicketManager} manager The Ticket Manager
     * @param {TicketData} data The ticket data
     */
    constructor(manager: TicketManager, data: TicketData) {
        /**
         * The Ticket manager
         * @readonly
         * @type {TicketManager}
         */
        this.manager = manager;
        /**
         * The ticket data
         * @readonly
         * @type {TicketData}
         */
        this.data = data;
        /**
         * The discord guild id
         * @readonly
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
         * @private
         * @type {string}
         */
        this.number = data.number;
        /**
         * The ticket status
         * @readonly
         * @type {TicketStatus}
         */
        this.status = data.status;
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
     * Ticket's Channel
     * @type {Guild}
     * @readonly
     */
    get channel(): TextChannel {
        return this.guild?.channels.cache.get(this.channelId) as TextChannel
    }

    /**
     * Ticket's Member
     * @type {Guild}
     * @readonly
     */
    get member(): GuildMember {
        return this.guild.members.cache.get(this.memberId) as GuildMember
    }

    /**
     * Close Ticket
     * @return {Promise<void>}
     */
    async close(): Promise<void> {
        await this.manager.closeTicket(this)
    }

    /**
     * Delete Ticket
     * @return {Promise<void>}
     */
    async delete(): Promise<void> {
        await this.manager.deleteTicket(this)
    }

    /**
     * ReOpen Ticket
     * @return {Promise<void>}
     */
    async reopen(): Promise<void> {
        await this.manager.reOpenTicket(this)
    }

    /**
     * Add GuildMember to Ticket
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<any>}
     */
    addMember(member: GuildMember): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let guild = await this.manager.getGuild(this.guildId);
            if (!guild) return reject(`Cannot find guild`);
            let channel: TextChannel | undefined = guild.channels.cache.get(this.channelId) as TextChannel;
            if (!channel) return reject(`Cannot find channel`);
            channel.permissionOverwrites.edit(member, {
                SEND_MESSAGES: true,
                VIEW_CHANNEL: true
            }).catch(e => {
                reject(e);
            });
            resolve(true);
        });
    }

    /**
     * Remove GuildMember from Ticket
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<any>}
     */
    removeMember(member: GuildMember): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let guild = await this.manager.getGuild(this.guildId);
            if (!guild) return reject(`Cannot find guild`);
            let channel: TextChannel | undefined = guild.channels.cache.get(this.channelId) as TextChannel;
            if (!channel) return reject(`Cannot find channel`);
            channel.permissionOverwrites.edit(member, {
                SEND_MESSAGES: false,
                VIEW_CHANNEL: false
            }).catch(e => {
                reject(e);
            });
            resolve(true);
        })
    }
}