import { BaseManager } from '../Base/BaseManager';

/**
 * @external ThreadChannel
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/ThreadChannel:Class}
 */

/**
 * @external Client
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/Client:Class}
 */

/**
 * @external Collection
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/Collection:Class}
 */

/**
 * @external Guild
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/Guild:Class}
 */

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/GuildMember:Class}
 */

/**
 * @external TextChannel
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/TextChannel:Class}
 */

/**
 * @external Role
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/Role:Class}
 */

import {
	ChannelType,
	Client,
	Collection,
	Guild,
	GuildMember,
	Role,
	TextChannel,
	ThreadAutoArchiveDuration,
	ThreadChannel
} from 'discord.js';
import {
	ThreadManagerOptions,
	TicketData,
	ThreadManagerEvents
} from '../types/types';
import { ThreadTicket } from './ThreadTicket';

/**
 * Thread Ticket Manager
 * @extends {BaseManager}
 */
export class ThreadManager extends BaseManager {
	readonly client: Client;
	readonly options: ThreadManagerOptions;
	tickets: Collection<string, ThreadTicket>;
	constructor(client: Client, options?: ThreadManagerOptions) {
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
		 * @type {ThreadManagerOptions}
		 */
		this.options = options as ThreadManagerOptions;
		/**
		 * Collection with all tickets (tickets's cache)
		 * @type {Collection<string, TicketData>}
		 */
		this.tickets = new Collection<string, ThreadTicket>();
		this.cachingTickets().then(() => null);
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
				this.tickets.set(ticket.channel, new ThreadTicket(this, ticket));
			});
		}
	}

	// @ts-ignore
	on<U extends keyof ThreadManagerEvents>(
		event: U, listener: ThreadManagerEvents[U]
	): this;

	emit<U extends keyof ThreadManagerEvents>(
		event: U, ...args: Parameters<ThreadManagerEvents[U]>
	): boolean;

	/**
	 * Get options
	 * @private
	 * @param {string} _id
	 * @return {ThreadManagerOptions}
	 */
	// @ts-ignore
	async getOptions(_id: string): Promise<ThreadManagerOptions> {
		return this.options;
	}

	/**
	 * Create Ticket
	 * @param {Guild} guild Discord Guild
	 * @param {GuildMember} member Discord Guild Member
	 * @return {Promise<TextTicket>}
	 * @example
	 * //Create Thread Ticket
	 * await ticketThread.createTicket(message.guild, message.member)
	 */
	async createTicket(guild: Guild, member: GuildMember): Promise<ThreadTicket | undefined> {
		const options = await this.getOptions(guild.id);
		if (!options) throw new Error('Cannot find options');
		const channel: TextChannel = guild.channels.cache.get(options.channelId) as TextChannel;
		if (!channel || channel.type !== ChannelType.GuildText) throw new Error('Cannot find tickets channel, please check id/if channel type is GuildText');
		const guildsTickets = this.ticketRaws.filter(ticket => ticket.guild === guild.id);
		let number: string | number;
		if (guildsTickets.length > 0) {
			number = guildsTickets.sort((ticketA, ticketB) => ticketB.number - ticketA.number)[0].number;
		} else number = 0;
		number = (parseInt(String(number)) + 1).toString();
		let newNumber = '0000' + number;
		newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
		const role: Role = guild.roles.cache.get(options.staffRole) as Role;
		if (!role) throw new Error('Cannot find staff role');
		const thread = await channel.threads.create({
			name: `ticket-${newNumber}`,
			reason: `Create Thread Ticket for ${member.user.tag}`,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
			type: ChannelType.PrivateThread,
			invitable: false
		}) as ThreadChannel;
		await thread.members.add(member.user);
		await thread.members.add('@me');
		await Promise.all(role.members.map(m => thread.members.add(m.user)));
		const data: TicketData = {
			guild: guild.id,
			channel: thread.id,
			member: member.id,
			// @ts-ignore
			number: number,
			status: 'open',
			participants: [member.id],
			type: 'thread'
		};
		this.ticketRaws.push(data);
		await this.saveTicketRaws();
		const ticket = new ThreadTicket(this, data);
		if (this.options.ticketCache) {
			this.tickets.set(data.channel, new ThreadTicket(this, data));
		}

		/**
		 * Emitted when user create ticket
		 * @event ThreadManager#ticketCreate
		 * @param {ThreadManager} ticket Ticket resolvable
		 */
		this.emit('ticketCreate', ticket);
		return ticket;
	}

	/**
	 * Delete Ticket
	 * @param {TextTicket} ticket Ticket class
	 * @return {Promise<any>}
	 */
	async deleteTicket (ticket: ThreadTicket): Promise<any> {
		const thread = await ticket.fetchChannel();
		await thread.delete();
		this.ticketRaws = this.ticketRaws.filter(y => y.channel !== ticket.channelId);
		await this.saveTicketRaws();
		if (this.options.ticketCache) {
			this.tickets.delete(ticket.channelId);
		}
		/**
		 * Emitted when ticket be delete
		 * @event ThreadManager#ticketDeleted
		 * @param {ThreadTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketDeleted', ticket);
	}

	/**
	 * Close Ticket
	 * @param {TextTicket} ticket Ticket class
	 * @return {Promise<any>}
	 */
	async closeTicket(ticket: ThreadTicket): Promise<any> {
		const thread = await ticket.fetchChannel();
		await thread.members.remove(ticket.memberId);
		await thread.setArchived(true);
		const data = ticket.data;
		data.status = 'closed';
		ticket = new ThreadTicket(this, data);
		this.tickets.set(ticket.channelId, ticket);
		const index = this.ticketRaws.indexOf(data);
		this.ticketRaws[index] = data;
		await this.saveTicketRaws();
		/**
		 * Emitted when ticket be closed
		 * @event ThreadManager#ticketClosed
		 * @param {TextTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketClosed', ticket);
	}

	/**
	 * ReOpen ticket
	 * @param {TextTicket} ticket Ticket Resolvable
	 * @return {Promise<any>}
	 */
	async reOpenTicket(ticket: ThreadTicket): Promise<any> {
		const thread = await ticket.fetchChannel();
		await thread.setArchived(false);
		await thread.members.add(ticket.memberId);
		const data = ticket.data;
		data.status = 'open';
		ticket = new ThreadTicket(this, data);
		this.tickets.set(ticket.channelId, ticket);
		const index = this.ticketRaws.indexOf(data);
		this.ticketRaws[index] = data;
		await this.saveTicketRaws();
		/**
		 * Emitted when ticket be reopen
		 * @event ThreadManager#ticketReOpen
		 * @param {ThreadTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketReOpen', ticket);
	}
	/**
	 * Rename Ticket
	 * @param {ThreadTicket} ticket ThreadTicket
	 * @param {string} name new Name
	 * @return {Promise<any>}
	 */
	async renameTicket (ticket: ThreadTicket, name: string): Promise<any> {
		let newNumber = '0000' + ticket.number;
		newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
		const thread = await ticket.fetchChannel();
		await thread.setName(`${name}-${newNumber}`);
		/**
		 * Emitted when ticket be renamed
		 * @event ThreadManager#ticketRename
		 * @param {ThreadTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketRename', ticket);
	}
}

/**
 * Threads Ticket Manager Config Types
 * @typedef {object} ThreadManagerOptions
 * @property {boolean} enabled Manager status
 * @property {string} channelId Discord Channel Id where are created tickets
 * @property {string} staffRole Discord Role id who can access to tickets
 * @property {boolean} ticketCache Storing tickets in the cache
 * @property {StorageType} storage Storage File path
 */