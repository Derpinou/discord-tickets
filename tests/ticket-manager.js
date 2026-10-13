/*
 * Setup:
 *   >_ npm run build
 *   Create .env file
 *    - TOKEN  Bot token
 *    - PARENT_ID  Category id where open tickets are created
 *    - CLOSE_PARENT_ID  Category id where closed tickets are moved
 *    - STAFF_ROLE  Role id allowed to see every ticket
 *   >_ node tests/ticket-manager.js
 *
 *   !create  Create a ticket
 *   !close  Close the ticket
 *   !reopen  Re-open the ticket
 *   !rename <name>  Rename the current ticket
 *   !add @member  Give a member access to the ticket
 *   !remove @member  Remove a member from the ticket
 *   !delete  Delete the ticket
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { TicketManager, version } = require('../'); // resolves to lib/index.js
require('dotenv').config();

const config = {
	token: process.env.TOKEN,
	parentId: process.env.PARENT_ID,
	closeParentId: process.env.CLOSE_PARENT_ID,
	staffRole: process.env.STAFF_ROLE
};

for (const [key, value] of Object.entries(config)) {
	if (!value) throw new Error(`Missing required environment variable for "${key}".`);
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel]
});

const manager = new TicketManager(client, {
	enabled: true,
	parentId: config.parentId,
	closeParentId: config.closeParentId,
	staffRole: config.staffRole,
	channelTopic: true,
	ticketCache: true,
	storage: './tests/tickets-text.json'
});

for (const event of ['ticketCreate', 'ticketClosed', 'ticketReOpen', 'ticketRename', 'ticketDeleted']) {
	manager.on(event, (ticket) => {
		console.log(`[event] ${event} -> channel:${ticket.channelId} number:${ticket.number} status:${ticket.status}`);
	});
}

client.once('clientReady', () => {
	console.log(`Logged in as ${client.user.tag} (discord-tickets v${version}) — TicketManager test bot ready.`);
});

client.on('messageCreate', async (message) => {
	if (message.author.bot || !message.guild) return;
	if (!message.content.startsWith('!')) return;

	const [command, ...args] = message.content.slice(1).trim().split(/\s+/);
	const ticket = manager.tickets.get(message.channel.id);

	try {
		switch (command.toLowerCase()) {
			case 'create': {
				const created = await manager.createTicket(message.guild, message.member);
				await message.reply(`Ticket created: <#${created.channelId}>`);
				break;
			}
			case 'close': {
				if (!ticket) return void message.reply('This channel is not a ticket.');
				await ticket.close();
				await message.reply('Ticket closed.');
				break;
			}
			case 'reopen': {
				console.log('reopen');
				if (!ticket) return void message.reply('This channel is not a ticket.');
				await ticket.reopen();
				await message.reply('Ticket re-opened.');
				break;
			}
			case 'rename': {
				if (!ticket) return void message.reply('This channel is not a ticket.');
				if (!args[0]) return void message.reply('Usage: `!rename <name>`');
				await ticket.rename(args[0]);
				await message.reply(`Ticket renamed to \`${args[0]}\`.`);
				break;
			}
			case 'add': {
				if (!ticket) return void message.reply('This channel is not a ticket.');
				const member = message.mentions.members.first();
				if (!member) return void message.reply('Usage: `!add @member`');
				await ticket.addMember(member);
				await message.reply(`Added ${member.user.tag} to the ticket.`);
				break;
			}
			case 'remove': {
				if (!ticket) return void message.reply('This channel is not a ticket.');
				const member = message.mentions.members.first();
				if (!member) return void message.reply('Usage: `!remove @member`');
				await ticket.removeMember(member);
				await message.reply(`Removed ${member.user.tag} from the ticket.`);
				break;
			}
			case 'delete': {
				if (!ticket) return void message.reply('This channel is not a ticket.');
				await ticket.delete();
				break;
			}
			default:
				break;
		}
	} catch (error) {
		console.error(`[error] command "${command}":`, error);
		await message.reply(`Error: ${error.message}`).catch(() => null);
	}
});

client.login(config.token);