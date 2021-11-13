<div align="center">
  <br />
  <p>
    <a href="https://discord-tickets.js.org"><img src="https://cdn.sayrix.fr/1u3/logo.svg" width="546" alt="discord-tickets" /></a>
  </p>
  <br />
  <p>
    <a href="https://discord.gg/ncheNRHFR7"><img src="https://img.shields.io/discord/848500695506223104?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/discord-tickets"><img src="https://img.shields.io/npm/v/discord-tickets.svg?maxAge=3600" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/discord-tickets"><img src="https://img.shields.io/npm/dt/discord-tickets.svg?maxAge=3600" alt="npm downloads" /></a>
  </p>
</div>


## About

discord-tickets is a powerful [Node.js](https://nodejs.org) module that allows you to manage tickets very easily. Making your bot's code significantly tidier and easier to comprehend.

- Object-oriented
- Performant


## Installation

**Node.js 16.6.0 or newer is required.**  

```sh-session
npm install discord-tickets
```


## Example usage

Init Text Ticket Manager:

```js
const {TicketManager} = require('discord-tickets');


client.ticketManager = new TicketManager(client, {
     enabled: true,//If Module is enabled
     parentId: '696891020146638868',//Ticket's category
     staffRole: '613426529623605268',//Role who have access to tickets
     closeParentId: '613425648685547544',//Closed's tickets category
     channelTopic: true,
     storage: './tickets.json',//Storage
     ticketCache: true//Save tickets on cache (TicketManager#tickets.get("channelId"))
});
```

Init Threads Ticket Manager:

```js
const {ThreadManager} = require('discord-tickets');


client.ticketManager = new ThreadManager(client, {
    enabled: true,
    channelId: "697138785317814292",
    staffRole: "613426529623605268",
    storage: `./tickets.json`,
    ticketCache: true
});
```

Create Ticket:
```js
await client.ticketManager.createTicket(message.guild, message.member);
```

Get Ticket:
```js
const ticket = client.ticketManager.tickets.get('channelId');
```

Close Ticket:
```js
await client.ticketManager.closeTicket(ticket);
//or
await ticket.close();
```

ReOpen ticket:
```js
await client.ticketManager.reOpenTicket(ticket);
//or
ticket.reopen();
```

Delete Ticket: 
```js
await client.ticketManager.deleteTicket(ticket);
//or
ticket.delete();
```

Using with Database:

```js
const {TicketManager} = require('discord-tickets');
const db = require('quick.db');

class TicketManagerWithDB extends TicketManager {
    async getOptions(id){
        return  db.get(`options_${id}`)
    }
    async getAllTickets(){
        return  db.get('tickets')
    }
    async saveTicketRaws(){
        db.set('tickets', JSON.stringify(this.ticketRaws))
        return true
    }
}


client.ticketManager = new TicketManagerWithDB(client);
```


## Links

- [Website](https://discord-tickets.js.org/) ([source](https://github.com/Derpinou/discord-tickets-docs))
- [Documentation](https://discord-tickets.js.org/#/docs)
- [Support & Help Discord server](https://discord.gg/ncheNRHFR7)
- [discord.js Discord server](https://discord.gg/djs)
- [Discord API Discord server](https://discord.gg/discord-api)
- [GitHub](https://github.com/Derpinou/discord-tickets)
- [npm](https://www.npmjs.com/package/discord-tickets)


