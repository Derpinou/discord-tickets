import { TextTicket } from "./TextTicket";
import { BaseManager } from "../Base/BaseManager";

/**
 * @external CategoryChannel
 * @see {@link https://discord.js.org/#/docs/main/stable/class/CategoryChannel}
 */

/**
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Client}
 */

/**
 * @external Collection
 * @see {@link https://discord.js.org/#/docs/collection/stable/class/Collection}
 */

/**
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Guild}
 */

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildMember}
 */

/**
 * @external Permissions
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Permissions}
 */

import {
    CategoryChannel,
    Client,
    Collection,
    Guild,
    GuildMember,
    Permissions
} from "discord.js";
import {
    TicketManagerOptions,
    TicketData,
    TicketManagerEvents,
} from "../types/types";
/**
 * Text Ticket Manager
 * @extends {BaseManager}
 */
export class TicketManager extends BaseManager {
    readonly client: Client;
    options: TicketManagerOptions;
    tickets: Collection<string, TextTicket>;
    /**
     * @param {Client} client Discord Client
     * @param {TicketManagerOptions} [options] TicketManager options
     */
    constructor(client: Client, options?: TicketManagerOptions) {
        super(client, options);
        /**
         * The Discord Client
         * @readonly
         * @type {Client}
         */
        if (!client) throw new Error('Client is a required option.');
        this.client = client;
        /**
         * The manager options
         * @type {TicketManagerOptions}
         */
        this.options = options as TicketManagerOptions;

        /**
         * Collection with all tickets (tickets's cache)
         * @type {Collection<string, TicketData>}
         */
        this.tickets = new Collection<string, TextTicket>();
        this.cachingTickets().then(r => null);
    }
    /**
     * Caching raws tickets into Array
     * @return {Promise<void>}
     * @private
     */
    async cachingTickets(): Promise<void> {
        this.ticketRaws = await this.getAllTickets();
        if (this.options.ticketCache) {
            this.ticketRaws.forEach(ticket => {
                this.tickets.set(ticket.channel, new TextTicket(this, ticket));
            })
        }
    }

    // @ts-ignore
    on<U extends keyof TicketManagerEvents>(
        event: U, listener: TicketManagerEvents[U]
    ): this;

    emit<U extends keyof TicketManagerEvents>(
        event: U, ...args: Parameters<TicketManagerEvents[U]>
    ): boolean;

    /**
     * Get options
     * @private
     * @param {string} id
     * @return {TicketManagerOptions}
     */
    // @ts-ignore
    async getOptions(id: string): Promise<TicketManagerOptions> {
        return this.options;
    }

    /**
     * Create Ticket
     * @param {Guild} guild Discord Guild
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<TextTicket>}
     * @example
     * //Create Thread Ticket
     * await ticketText.createTicket(message.guild, message.member)
     */
    async createTicket(guild: Guild, member: GuildMember): Promise<TextTicket | undefined> {
        const options = await this.getOptions(guild.id);
        if (!options) throw new Error("Cannot find options");
        const category: CategoryChannel = guild.channels.cache.get(options.parentId) as CategoryChannel;
        if (!category || category.type !== "GUILD_CATEGORY") throw new Error("Cannot find tickets category, please check id/if channel type is GUILD_CATEGORY");
        const guildsTickets = this.ticketRaws.filter(ticket => ticket.guild === guild.id);
        let number: string | number;
        if (guildsTickets.length > 0) {
            number = guildsTickets.sort((ticketA, ticketB) => ticketB.number - ticketA.number)[0].number;
        } else number = 0;
        number = (parseInt(String(number)) + 1).toString();
        let newNumber = "0000" + number;
        newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
        const channel = await guild.channels.create(`ticket-${newNumber}`, {
            type: "GUILD_TEXT",
            parent: category,
            permissionOverwrites: [
                {
                    id: member.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                },
                {
                    id: guild.roles.everyone,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }, {
                    id: options.staffRole,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                }
            ]
        });
        const data: TicketData = {
            guild: guild.id,
            channel: channel.id,
            member: member.id,
            // @ts-ignore
            number: number,
            status: "open",
            participants: [member.id],
            type: "channel"
        };
        this.ticketRaws.push(data);
        await this.saveTicketRaws();
        const ticket = new TextTicket(this, data);
        if (this.options.ticketCache) {
            this.tickets.set(data.channel, new TextTicket(this, data));
        }
        if (this.options.channelTopic) {
            await channel.setTopic("ticket#" + newNumber, "Set ticket topic");
        }
        /**
         * Emitted when user create ticket
         * @event TicketManager#ticketCreate
         * @param {TextTicket} ticket Ticket resolvable
         */
        this.emit("ticketCreate", ticket);
        return ticket;
    }

    /**
     * Delete Ticket
     * @param {TextTicket} ticket Ticket class
     * @return {Promise<any>}
     */
    async deleteTicket (ticket: TextTicket): Promise<any> {
        await ticket.channel.delete();
        this.ticketRaws = this.ticketRaws.filter(y => y.channel !== ticket.channelId);
        await this.saveTicketRaws();
        if (this.options.ticketCache) {
            this.tickets.delete(ticket.channelId);
        }
        /**
         * Emitted when ticket be delete
         * @event TicketManager#ticketDeleted
         * @param {TextTicket} ticket Ticket resolvable
         */
        return this.emit("ticketDeleted", ticket);
    }

    /**
     * Close Ticket
     * @param {TextTicket} ticket Ticket class
     * @return {Promise<any>}
     */
    async closeTicket(ticket: TextTicket): Promise<any> {
        const options = await this.getOptions(ticket.guild.id);
        if (!options) throw new Error("Cannot find options");
        const category: CategoryChannel = ticket.guild.channels.cache.get(options.closeParentId) as CategoryChannel;
        if (!category || category.type !== "GUILD_CATEGORY") throw new Error("Cannot find closed's tickets category, please check id/if channel type is GUILD_CATEGORY");
        const ticketChannelToClose = ticket.guild.channels.cache.get(ticket.channelId);
        if (!ticketChannelToClose) return;
        let newNumber = "0000"+ticket.number;
        newNumber = newNumber.slice(newNumber.length-4, newNumber.length+2);
        await ticketChannelToClose.edit({
            name: `closed-${newNumber}`,
            parent: category,
            permissionOverwrites: [
                {
                    id: ticket.member.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                },
                {
                    id: ticket.guild.roles.everyone,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }, {
                    id: options.staffRole,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                }
            ]
        });
        let data = ticket.data;
        data.status = "closed";
        ticket = new TextTicket(this, data);
        this.tickets.set(ticket.channelId, ticket);
        let index = this.ticketRaws.indexOf(data);
        this.ticketRaws[index] = data;
        await this.saveTicketRaws();
        /**
         * Emitted when ticket be closed
         * @event TicketManager#ticketClosed
         * @param {TextTicket} ticket Ticket resolvable
         */
        return this.emit("ticketClosed", ticket);
    }

    /**
     * ReOpen ticket
     * @param {TextTicket} ticket Ticket Resolvable
     * @return {Promise<any>}
     */
    async reOpenTicket(ticket: TextTicket): Promise<any> {
        const options = await this.getOptions(ticket.guild.id);
        if (!options) throw new Error("Cannot find options");
        const category: CategoryChannel = ticket.guild.channels.cache.get(options.parentId) as CategoryChannel;
        if (!category || category.type !== "GUILD_CATEGORY") throw new Error("Cannot find tickets category, please check id/if channel type is GUILD_CATEGORY");
        const ticketChannel = ticket.guild.channels.cache.get(ticket.channelId);
        if (!ticketChannel) return;
        await ticketChannel.edit({
            name: `ticket-${ticketChannel.name.split("-")[1]}`,
            parent: category,
            permissionOverwrites: [
                {
                    id: ticket.memberId,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                },
                {
                    id: ticket.guild.roles.everyone,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }, {
                    id: options.staffRole,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                }
            ]
        });
        let data = ticket.data;
        data.status = "open";
        ticket = new TextTicket(this, data);
        this.tickets.set(ticket.channelId, ticket);
        let index = this.ticketRaws.indexOf(data);
        this.ticketRaws[index] = data;
        await this.saveTicketRaws();
        /**
         * Emitted when ticket be reopen
         * @event TicketManager#ticketReOpen
         * @param {TextTicket} ticket Ticket resolvable
         */
        return this.emit("ticketReOpen", ticket);
    }

    /**
     * Rename Ticket
     * @param {ThreadTicket} ticket ThreadTicket
     * @param {string} name new Name
     * @return {Promise<any>}
     */
    async renameTicket (ticket: TextTicket, name: string): Promise<any> {
        let newNumber = "0000"+ticket.number;
        newNumber = newNumber.slice(newNumber.length-4, newNumber.length+2);
        await ticket.channel.setName(`${name}-${newNumber}`);
        /**
         * Emitted when ticket be renamed
         * @event TicketManager#ticketRename
         * @param {TextTicket} ticket Ticket resolvable
         */
        return this.emit("ticketRename", ticket);
    }
}

/**
 * Text Ticket Manager Config Types
 * @typedef {object} TicketManagerOptions
 * @property {boolean} enabled Manager status
 * @property {string} parentID Category Id where are created tickets
 * @property {string} staffRole Discord Role id who can access to tickets
 * @property {string} closedParentID Category Id where are closed tickets
 * @property {string} [channelTopic] Ticket's channel topic
 * @property {boolean} ticketCache Storing tickets in the cache
 * @property {StorageType} storage Storage File path
 */