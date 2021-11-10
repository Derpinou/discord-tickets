import {EventEmitter} from 'events';
import {exists, readFile, writeFile} from 'fs';
import {promisify} from 'util';
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);

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
} from "./interfaces";

import {Ticket} from "./Ticket";

/**
 * Ticket Manager
 */
export class TicketManager extends EventEmitter {
    readonly client: Client;
    options: TicketManagerOptions;
    ticketRaws: Array<TicketData>;
    tickets: Collection<string, Ticket>
    /**
     * @param {Client} client Discord Client
     * @param {TicketManagerOptions} [options] TicketManager options
     */
    constructor(client: Client, options?: TicketManagerOptions) {
        super();
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
         * Array with all tickets
         * @type {Array<TicketData>}
         */
        this.ticketRaws = [];
        /**
         * Collection with all tickets (tickets's cache)
         * @type {Collection<string, TicketData>}
         */
        this.tickets = new Collection();

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
                this.tickets.set(ticket.channel, new Ticket(this, ticket));
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

    // @ts-ignore
    async getOptions(id: string): Promise<TicketManagerOptions> {
        return this.options
    }

    /**
     * Get All ticket raw from Database/JSON storage
     * @return {Promise<Array<TicketData>>}
     */
    async getAllTickets(): Promise<Array<TicketData>> {
        // Whether the storage file exists, or not
        const storageExists = await existsAsync(this.options.storage);
        // If it doesn't exists
        if (!storageExists) {
            // Create the file with an empty array
            await writeFileAsync(this.options.storage, '[]', 'utf-8');
            return [];
        } else {
            // If the file exists, read it
            const storageContent = await readFileAsync(this.options.storage);
            try {
                const tickets = await JSON.parse(storageContent.toString());
                if (Array.isArray(tickets)) {
                    return tickets;
                } else {
                    console.log(storageContent, tickets);
                    throw new SyntaxError('The storage file is not properly formatted (tickets is not an array).');
                }
            } catch (e) {
                // @ts-ignore
                if (e.message === 'Unexpected end of JSON input') {
                    throw new SyntaxError('The storage file is not properly formatted (Unexpected end of JSON input).');
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * Save all tickets on Database/JSON storage
     * @return {Promise<boolean>}
     */
    async saveTicketRaws(): Promise<boolean> {
        await writeFileAsync(
            this.options.storage,
            JSON.stringify(this.ticketRaws),
            'utf-8'
        );
        return true;
    }

    /**
     * Check if member already has ticket
     * @param {string} guildID Discord Guild Id
     * @param {string} memberID Discord Guild Member Id
     */
    checkDoubleTickets (guildID: string, memberID: string): boolean {
        return !!this.ticketRaws.find(x => x.guild === guildID && x.member === memberID);
    }

    /**
     * Get Guild Class from client cache (is you're using shards)
     * @param {string} id Discord Guild Id
     * @return {Promise<Guild>}
     */
    getGuild(id: string): Guild | undefined {
        return this.client.guilds.cache.get(id);
    }

    /**
     * Create Ticket
     * @param {Guild} guild Discord Guild
     * @param {GuildMember} member Discord Guild Member
     * @return {Promise<Ticket>}
     */
    async createTicket(guild: Guild, member: GuildMember): Promise<Ticket | undefined> {
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
            participants: [member.id]
        };
        this.ticketRaws.push(data);
        await this.saveTicketRaws();
        const ticket = new Ticket(this, data);
        if (this.options.ticketCache) {
            this.tickets.set(data.channel, new Ticket(this, data));
        }
        if (this.options.channelTopic) {
            await channel.setTopic("ticket#" + newNumber, "Set ticket topic");
        }
        /**
         * Emitted when user create ticket
         * @event TicketManager#ticketCreate
         * @param {Ticket} ticket Ticket resolvable
         */
        this.emit("ticketCreate", ticket);
        return ticket;
    }

    /**
     * Delete Ticket
     * @param {Ticket} ticket Ticket class
     * @return {Promise<any>}
     */
    async deleteTicket (ticket: Ticket): Promise<any> {
        await ticket.guild.channels.cache.get(ticket.channelId)?.delete();
        this.ticketRaws = this.ticketRaws.filter(y => y.channel !== ticket.data.channel);
        await this.saveTicketRaws();
        if (this.options.ticketCache) {
            this.tickets.delete(ticket.channelId);
        }
        /**
         * Emitted when ticket be delete
         * @event TicketManager#ticketDeleted
         * @param {Ticket} ticket Ticket resolvable
         */
        return this.emit("ticketDeleted", ticket);
    }

    /**
     * Close Ticket
     * @param {Ticket} ticket Ticket class
     * @return {Promise<any>}
     */
    async closeTicket(ticket: Ticket): Promise<any> {
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
        })
        /**
         * Emitted when ticket be closed
         * @event TicketManager#ticketClosed
         * @param {Ticket} ticket Ticket resolvable
         * @param {string} moderator Discord User ID
         */
        return this.emit("ticketClosed", ticket);
    }

    /**
     * ReOpen ticket
     * @param {Ticket} ticket Ticket Resolvable
     * @return {Promise<any>}
     */
    async reOpenTicket(ticket: Ticket): Promise<any> {
        const options = await this.getOptions(ticket.guild.id);
        if (!options) throw new Error("Cannot find options");
        const category: CategoryChannel = ticket.guild.channels.cache.get(options.parentId) as CategoryChannel
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
        /**
         * Emitted when ticket be reopen
         * @event TicketManager#ticketReOpen
         * @param {Ticket} ticket Ticket resolvable
         */
        return this.emit("ticketReOpen", ticket);
    }
}

/**
 * Ticket Manager Config Types
 * @typedef {object} TicketManagerOptions
 * @property {boolean} enabled Library status
 * @property {string} parentID Category Id where are created tickets
 * @property {string} staffRole Staff Role ID
 * @property {boolean} [pingStaff] Bot ping staff role when ticket created
 * @property {string} closedParentID Category Id where are closed tickets
 * @property {string} [channelTopic] Ticket's channel topic
 * @property {boolean} ticketCache Storing tickets in the cache
 * @property {string} storage Storage File path
 */


/**
 * Ticket Data
 * @typedef {object} TicketData
 * @property {string} guild Discord Guild ID
 * @property {string} member Discord Guild Member ID
 * @property {string} channel Discord Channel ID
 * @property {string} number Ticket's number
 * @property {string} status Ticket's status
 * @property {Array<string>} participants Ticket's Participants list
 */