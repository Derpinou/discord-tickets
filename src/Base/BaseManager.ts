import { EventEmitter } from 'events';
import {
    exists,
    readFile,
    writeFile
} from 'fs';
import { promisify } from 'util';
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);

/**
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Client}
 */

/**
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Guild}
 */

import {
    Client,
    Guild,
} from "discord.js";

import {
    BaseManagerOptions,
    TicketData,
} from "../types/types";

/**
 * Ticket Manager
 * @extends {EventEmitter}
 */
export class BaseManager extends EventEmitter {
    readonly client: Client;
    options: BaseManagerOptions;
    ticketRaws: Array<TicketData>;

    /**
     * @param {Client} client Discord Client
     * @param {TicketManagerOptions} [options] TicketManager options
     */
    constructor(client: Client, options?: BaseManagerOptions) {
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
        this.options = options as BaseManagerOptions;
        /**
         * Array with all tickets
         * @type {Array<TicketData>}
         */
        this.ticketRaws = [];
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
     * @return {boolean}
     */
    checkDoubleTickets(guildID: string, memberID: string): boolean {
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
}

/**
 * Storage File path:
 * * "Json file path"
 * * "custom"
 * @typedef {string} StorageType
 */

/**
 * Base Manager Config Types
 * @typedef {object} BaseManagerOptions
 * @property {boolean} enabled Manager status
 * @property {string} staffRole Discord Role id who can access to tickets
 * @property {boolean} ticketCache Storing tickets in the cache
 * @property {StorageType} storage Storage File path
 */