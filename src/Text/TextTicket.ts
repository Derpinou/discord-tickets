import { TicketManager } from "./TicketManager";
import { TicketData } from "../types/types";
import { BaseTicket } from "../Base/BaseTicket";

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildMember}
 */

/**
 * @external TextChannel
 * @see {@link https://discord.js.org/#/docs/main/stable/class/TextChannel}
 */

import {
    GuildMember,
    TextChannel
} from "discord.js";
/**
 * Represents a Ticket
 * @extends {BaseTicket}
 */
export class TextTicket extends BaseTicket{
    readonly manager: TicketManager;
    /**
     * @param {TicketManager} manager The Ticket Manager
     * @param {TicketData} data The ticket data
     */
    constructor(manager: TicketManager, data: TicketData) {
        super(manager, data)
        /**
         * The Ticket manager
         * @readonly
         * @type {TicketManager}
         */
        this.manager = manager;
    }
    /**
     * Ticket's Channel
     * @type {TextChannel}
     * @readonly
     */
    get channel(): TextChannel {
        return this.guild.channels.cache.get(this.channelId) as TextChannel
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
     * Add GuildMember to Ticket
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<any>}
     */
    addMember(member: GuildMember): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.channel.permissionOverwrites.edit(member, {
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
            this.channel.permissionOverwrites.edit(member, {
                SEND_MESSAGES: false,
                VIEW_CHANNEL: false
            }).catch(e => {
                reject(e);
            });
            resolve(true);
        })
    }
}
