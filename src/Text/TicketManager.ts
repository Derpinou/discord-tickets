import { TextTicket } from './TextTicket';
import { BaseManager } from '../Base/BaseManager';

/**
 * @external CategoryChannel
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/CategoryChannel:Class}
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
 * @external GuildBasedChannel
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/GuildBasedChannel:TypeAlias}
 */

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/GuildMember:Class}
 */

/**
 * @external OverwriteResolvable
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/OverwriteResolvable:TypeAlias}
 */

/**
 * @external PermissionFlagsBits
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/PermissionFlagsBits:Variable}
 */

import {
	CategoryChannel,
	ChannelType,
	Client,
	Collection,
	Guild,
	GuildBasedChannel,
	GuildMember,
	OverwriteResolvable,
	OverwriteType,
	PermissionFlagsBits,
	PermissionOverwrites,
	Routes
} from 'discord.js';
import {
	TicketManagerOptions,
	TicketData,
	TicketManagerEvents
} from '../types/types';
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
				this.tickets.set(ticket.channel, new TextTicket(this, ticket));
			});
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
	 * @param {string} _id
	 * @return {TicketManagerOptions}
	 */
	// @ts-ignore
	async getOptions(_id: string): Promise<TicketManagerOptions> {
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
		if (!options) throw new Error('Cannot find options');
		const category: CategoryChannel = guild.channels.cache.get(options.parentId) as CategoryChannel;
		if (!category || category.type !== ChannelType.GuildCategory) throw new Error('Cannot find tickets category, please check id/if channel type is GuildCategory');
		const guildsTickets = this.ticketRaws.filter(ticket => ticket.guild === guild.id);
		let number: string | number;
		if (guildsTickets.length > 0) {
			number = guildsTickets.sort((ticketA, ticketB) => ticketB.number - ticketA.number)[0].number;
		} else number = 0;
		number = (parseInt(String(number)) + 1).toString();
		let newNumber = '0000' + number;
		newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
		const channel = await guild.channels.create({
			name: `ticket-${newNumber}`,
			type: ChannelType.GuildText,
			parent: category,
			topic: this.options.channelTopic ? 'ticket#' + newNumber : undefined,
			permissionOverwrites: [
				{
					id: member.id,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
				},
				{
					id: guild.roles.everyone,
					deny: [PermissionFlagsBits.ViewChannel]
				}, {
					id: options.staffRole,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
				}
			]
		});
		const data: TicketData = {
			guild: guild.id,
			channel: channel.id,
			member: member.id,
			// @ts-ignore
			number: number,
			status: 'open',
			participants: [member.id],
			type: 'channel'
		};
		this.ticketRaws.push(data);
		await this.saveTicketRaws();
		const ticket = new TextTicket(this, data);
		if (this.options.ticketCache) {
			this.tickets.set(data.channel, new TextTicket(this, data));
		}
		/**
		 * Emitted when user create ticket
		 * @event TicketManager#ticketCreate
		 * @param {TextTicket} ticket Ticket resolvable
		 */
		this.emit('ticketCreate', ticket);
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
		return this.emit('ticketDeleted', ticket);
	}

	/**
	 * Close Ticket
	 * The channel is moved and its permissions replaced right away, the `closed-` rename follows in the background
	 * @param {TextTicket} ticket Ticket class
	 * @return {Promise<any>}
	 */
	async closeTicket(ticket: TextTicket): Promise<any> {
		const options = await this.getOptions(ticket.guild.id);
		if (!options) throw new Error('Cannot find options');
		const category: CategoryChannel = ticket.guild.channels.cache.get(options.closeParentId) as CategoryChannel;
		if (!category || category.type !== ChannelType.GuildCategory) throw new Error("Cannot find closed's tickets category, please check id/if channel type is GuildCategory");
		const ticketChannelToClose = ticket.guild.channels.cache.get(ticket.channelId);
		if (!ticketChannelToClose) return;
		let newNumber = '0000' + ticket.number;
		newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
		await this.moveTicketChannel(ticketChannelToClose, category, [
			{
				id: ticket.memberId,
				type: OverwriteType.Member,
				deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			},
			{
				id: ticket.guild.roles.everyone,
				type: OverwriteType.Role,
				deny: [PermissionFlagsBits.ViewChannel]
			}, {
				id: options.staffRole,
				type: OverwriteType.Role,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			}
		]);
		this.renameInBackground(ticketChannelToClose, `closed-${newNumber}`);
		const data = ticket.data;
		data.status = 'closed';
		ticket = new TextTicket(this, data);
		this.tickets.set(ticket.channelId, ticket);
		const index = this.ticketRaws.indexOf(data);
		this.ticketRaws[index] = data;
		await this.saveTicketRaws();
		/**
		 * Emitted when ticket be closed
		 * @event TicketManager#ticketClosed
		 * @param {TextTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketClosed', ticket);
	}

	/**
	 * ReOpen ticket
	 * The channel is moved and its permissions replaced right away, the `ticket-` rename follows in the background
	 * @param {TextTicket} ticket Ticket Resolvable
	 * @return {Promise<any>}
	 */
	async reOpenTicket(ticket: TextTicket): Promise<any> {
		const options = await this.getOptions(ticket.guild.id);
		if (!options) throw new Error('Cannot find options');
		const category: CategoryChannel = ticket.guild.channels.cache.get(options.parentId) as CategoryChannel;
		if (!category || category.type !== ChannelType.GuildCategory) throw new Error('Cannot find tickets category, please check id/if channel type is GuildCategory');
		const ticketChannel = ticket.guild.channels.cache.get(ticket.channelId);
		if (!ticketChannel) return;
		let newNumber = '0000' + ticket.number;
		newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
		await this.moveTicketChannel(ticketChannel, category, [
			{
				id: ticket.memberId,
				type: OverwriteType.Member,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			},
			{
				id: ticket.guild.roles.everyone,
				type: OverwriteType.Role,
				deny: [PermissionFlagsBits.ViewChannel]
			}, {
				id: options.staffRole,
				type: OverwriteType.Role,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			}
		]);
		this.renameInBackground(ticketChannel, `ticket-${newNumber}`);
		const data = ticket.data;
		data.status = 'open';
		ticket = new TextTicket(this, data);
		this.tickets.set(ticket.channelId, ticket);
		const index = this.ticketRaws.indexOf(data);
		this.ticketRaws[index] = data;
		await this.saveTicketRaws();
		/**
		 * Emitted when ticket be reopen
		 * @event TicketManager#ticketReOpen
		 * @param {TextTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketReOpen', ticket);
	}

	/**
	 * Rename Ticket
	 * @param {ThreadTicket} ticket ThreadTicket
	 * @param {string} name new Name
	 * @return {Promise<any>}
	 */
	async renameTicket (ticket: TextTicket, name: string): Promise<any> {
		let newNumber = '0000' + ticket.number;
		newNumber = newNumber.slice(newNumber.length - 4, newNumber.length + 2);
		await ticket.channel.setName(`${name}-${newNumber}`);
		/**
		 * Emitted when ticket be renamed
		 * @event TicketManager#ticketRename
		 * @param {TextTicket} ticket Ticket resolvable
		 */
		return this.emit('ticketRename', ticket);
	}

	/**
	 * Move a ticket channel to a category and replace its permissions in one request.
	 * Unlike GuildChannel#edit, the request carries no name/topic field, so it is never held back
	 * behind a rename waiting for Discord's limit (2 renames per channel every 10 minutes)
	 * @private
	 * @param {GuildBasedChannel} channel Ticket channel
	 * @param {CategoryChannel} category Destination category
	 * @param {Array<OverwriteResolvable>} permissionOverwrites Overwrites replacing the current ones
	 * @return {Promise<void>}
	 */
	async moveTicketChannel(channel: GuildBasedChannel, category: CategoryChannel, permissionOverwrites: OverwriteResolvable[]): Promise<void> {
		await this.client.rest.patch(Routes.channel(channel.id), {
			body: {
				parent_id: category.id,
				permission_overwrites: permissionOverwrites.map(overwrite => PermissionOverwrites.resolve(overwrite, channel.guild))
			}
		});
	}

	/**
	 * Rename a ticket channel without waiting for it: once Discord's limit (2 renames per channel
	 * every 10 minutes) is reached, discord.js holds the request for several minutes.
	 * A failed rename is reported as a process warning instead of crashing the bot
	 * @private
	 * @param {GuildBasedChannel} channel Ticket channel
	 * @param {string} name New channel name
	 */
	renameInBackground(channel: GuildBasedChannel, name: string): void {
		channel.setName(name).catch(error => process.emitWarning(`discord-tickets: could not rename channel ${channel.id} to "${name}": ${error.message}`));
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