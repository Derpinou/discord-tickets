import { BaseTicket } from "../Base/BaseTicket";
import { ThreadManager } from "./ThreadManager";
import { TicketData } from "../types/types";

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildMember}
 */

/**
 * @external TextChannel
 * @see {@link https://discord.js.org/#/docs/main/stable/class/TextChannel}
 */

/**
 * @external ThreadChannel
 * @see {@link https://discord.js.org/#/docs/main/stable/class/ThreadChannel}
 */

import {
    GuildMember,
    TextChannel,
    ThreadChannel
} from "discord.js";

/**
 * Represents a Thread Ticket
 * @extends {BaseTicket}
 */
export class ThreadTicket extends BaseTicket {
    readonly manager: ThreadManager;
    /**
     * @param {ThreadManager} manager The Ticket Manager
     * @param {TicketData} data The ticket data
     */
    constructor(manager: ThreadManager, data: TicketData) {
        super(manager, data);
        /**
         * The Ticket manager
         * @readonly
         * @type {TicketManager}
         */
        this.manager = manager;
    }
    /**
     * Ticket's Channel
     * @type {ThreadTicket}
     * @readonly
     */
    get channel() :ThreadChannel {
        const channel: TextChannel = this.guild.channels.cache.get(this.manager.options.channelId) as TextChannel
        return channel?.threads.cache.get(this.channelId) as ThreadChannel
    }

    /**
     * Close Ticket
     * @return {Promise<void>}
     */
    async close(): Promise<void> {
        await this.manager.closeTicket(this)
    }

    /**
     * Rename Ticket
     * @param {string} name New ticket's name (name-0000)
     * @return {Promise<void>}
     */
    async rename(name: string): Promise<void> {
        await this.manager.renameTicket(this, name)
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
     * Add GuildMember to Thread
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<any>}
     */
    addMember(member: GuildMember): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.channel.members.add(member.user).catch(e => {
                reject(e);
            });
            resolve(true);
        });
    }

    /**
     * Remove GuildMember from Thread
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<any>}
     */
    removeMember(member: GuildMember): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.channel.members.remove(member.id).catch(e => {
                reject(e);
            });
            resolve(true);
        })
    }
}