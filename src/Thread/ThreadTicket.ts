import { BaseTicket } from '../Base/BaseTicket';
import { ThreadManager } from './ThreadManager';
import { TicketData } from '../types/types';

/**
 * @external GuildMember
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/GuildMember:Class}
 */

/**
 * @external TextChannel
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/TextChannel:Class}
 */

/**
 * @external ThreadChannel
 * @see {@link https://discord.js.org/docs/packages/discord.js/stable/ThreadChannel:Class}
 */

import {
	GuildMember,
	TextChannel,
	ThreadChannel
} from 'discord.js';

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
		const channel: TextChannel = this.guild.channels.cache.get(this.manager.options.channelId) as TextChannel;
		return channel?.threads.cache.get(this.channelId) as ThreadChannel;
	}

	/**
	 * Ticket's Channel, fetched from Discord when it is not cached
	 * (an archived thread is no longer cached after a restart)
	 * @return {Promise<ThreadChannel>}
	 */
	async fetchChannel(): Promise<ThreadChannel> {
		const channel = this.channel ?? await this.manager.client.channels.fetch(this.channelId);
		if (!channel?.isThread()) throw new Error("Cannot find ticket's thread");
		return channel;
	}

	/**
	 * Close Ticket
	 * @return {Promise<void>}
	 */
	async close(): Promise<void> {
		await this.manager.closeTicket(this);
	}

	/**
	 * Rename Ticket
	 * @param {string} name New ticket's name (name-0000)
	 * @return {Promise<void>}
	 */
	async rename(name: string): Promise<void> {
		await this.manager.renameTicket(this, name);
	}

	/**
	 * Delete Ticket
	 * @return {Promise<void>}
	 */
	async delete(): Promise<void> {
		await this.manager.deleteTicket(this);
	}

	/**
	 * ReOpen Ticket
	 * @return {Promise<void>}
	 */
	async reopen(): Promise<void> {
		await this.manager.reOpenTicket(this);
	}

	/**
	 * Add GuildMember to Thread
	 * @param {GuildMember} member Discord Guild Member
	 * @return {Promise<any>}
	 */
	async addMember(member: GuildMember): Promise<any> {
		const thread = await this.fetchChannel();
		await thread.members.add(member.user);
		return true;
	}

	/**
	 * Remove GuildMember from Thread
	 * @param {GuildMember} member Discord Guild Member
	 * @return {Promise<any>}
	 */
	async removeMember(member: GuildMember): Promise<any> {
		const thread = await this.fetchChannel();
		await thread.members.remove(member.id);
		return true;
	}
}