// Steam Bot v2.0

/**
 * This code's prerequisites are:
 * npm install steam-user
 * npm install steam-totp
 * npm install steam-tradeoffer-manager
 * npm install steamcommunity
 */

// Config file
const config = require('./config.json');
// const config = require('./config-totp.json');

// Modules
const SteamUser = require('steam-user'),
    SteamTopt = require('steam-totp'),
    SteamCommunity = require('steamcommunity'),
    TradeOfferManager = require('steam-tradeoffer-manager');

// Objects
const client = new SteamUser(),
    community = new SteamCommunity();

const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en'
});

const logOnOptions = {
    accountName: config.username,
    password: config.password
    // twoFactorCode: SteamTopt.generateAuthCode(config.shared_secret)
};

// Logins on Steam and simulates its client
client.logOn(logOnOptions);
console.log(`\nSteam Bot v2.0`);
console.log(`\nHere we go~\n`);

client.on('loggedOn', () => {
    console.log('Successfully logged into Steam!');

    // Sets status (can also receive a second parameter to change steam name)
    client.setPersona(SteamUser.EPersonaState.Online);
    // Sets currently playing game(s)
    client.gamesPlayed(config.games);
});

let wallet;

client.chat.on('friendMessage', (message) => {
    // getPersonas() for nickname is having issues
    let id64 = message.steamid_friend.getSteamID64();
    let name = client.users[id64] ? client.users[id64].player_name + ' ' : '';
    
    console.log('Message from ' + name + '(' + id64 + '): ' + message.message);
});

// TODO: Needs revision
// friendMessage#id64 only works on deprecated
client.on('friendMessage#76561198235235440', (steamId, message) => {
    if (!message.startsWith(`${config.prefix}`))
        return;

    const args = message.split(" ").slice(1);

    if (message.startsWith(`${config.prefix}idle`)) {
        if (!args[0]) return client.chatMessage(steamId, `Please use the command correctly! (${config.prefix}idle <appid1 appid2>)`);
        let gamesNum = args.map(parseFloat);
        client.gamesPlayed(gamesNum);
    }

    if (message.startsWith(`${config.prefix}add`)) {
        if (!args[0]) return client.chatMessage(steamId, `Please specify a Steam64 ID (${config.prefix}add <steam64id>)`);
        client.addFriend(args[0]);
    }

    if (message.startsWith(`${config.prefix}remove`)) {
        if (!args[0]) return client.chatMessage(steamId, `Please specify a Steam64 ID (${config.prefix}remove <steam64id>)`);
        client.removeFriend(args[0]);
    }

    if (message.startsWith(`${config.prefix}block`)) {
        if (!args[0]) return client.chatMessage(steamId, `Please specify a Steam64 ID (${config.prefix}block <steam64id>)`);
        client.blockUser(args[0]);
    }

    if (message.startsWith(`${config.prefix}unblock`)) {
        if (!args[0]) return client.chatMessage(steamId, `Please specify a Steam64 ID (${config.prefix}unblock <steam64id>)`);
        client.unblockUser(args[0]);
    }

    if (message.startsWith(`${config.prefix}funds`)) {
        client.chatMessage(steamId, `My wallet balance is: ${wallet}`);
    }

    if (message.startsWith(`${config.prefix}reply`)) {
        let message2 = args.join(" ");
        client.chatMessage(steamId, message2)
    }

    if (message.startsWith(`${config.prefix}comment`)) {
        let steamId2 = args[0];
        let comment = args.slice(1).join(" ");
        if (!steamId2) return;
        community.postUserComment(steamId2, comment);
    }

    if (message.startsWith(`${config.prefix}reboot`)) {
        process.exit(1);
    }

    if (message.startsWith(`${config.prefix}rename`)) {
        let username = args.slice(0).join(' ');
        if (!username) {
            client.chatMessage(steamId, 'Syntax Error (/setname <personaName)');
        } else {
            if (username.length < 2) {
                client.chatMessage(steamId, 'Username must be longer than 2 characters');
            } else if (username.length > 32) {
                client.chatMessage(steamId, 'Username must not be greater than 32 characters');
            } else {
                client.setPersona(SteamUser.Steam.EPersonaState.Online, username);
            }
        }
    }

    if (message.startsWith(`${config.prefix}setstatus`)) {
        if (!args[0]) 
            return client.chatMessage(steamId, `Please use the command correctly! (${config.prefix}setstatus <status>)`);

        let state = args[0];
        let states = new Map([
            ["online", SteamUser.Steam.EPersonaState.Online],
            ["away", SteamUser.Steam.EPersonaState.Away],
            ["snooze", SteamUser.Steam.EPersonaState.Snooze],
            ["busy", SteamUser.Steam.EPersonaState.Busy],
            ["trade", SteamUser.Steam.EPersonaState.LookingToTrade],
            ["play", SteamUser.Steam.EPersonaState.LookingToPlay]
        ]);

        if (states.has(state))
            client.setPersona(states.get(state));
        else
            return client.chatMessage(steamId, `Sorry but I couldn't find a state with the name ${state}\nAvailable states: online, away, snooze, busy, trade, play`);
    }
});

client.on('friendRelationship', (steamId, relationship) => {
    // getPersonas() for nickname is having issues
    if (relationship === 2) {
        let id64 = steamId.getSteamID64();
        client.addFriend(steamId);

        let name = client.users[id64] ? client.users[id64].player_name + ' ' : '';
        console.log('Accepted a friend request from ' + name + '(' + id64 +')');
    }
});

client.on('wallet', function(hasWallet, currency, balance) {
    wallet = SteamUser.formatCurrency(balance, currency);
});

client.on('error', (err) => {
    console.log(err);
});

// Event listener to pass the cookies to the manager
// client.on('webSession', (sessionid, cookies) => {
//     manager.setCookies(cookies);

//     community.setCookies(cookies);
//     community.startConfirmationChecker(15000, config.identity_secret); // <- checks if there's any pending confirmation every 10 secs
// });

// Accepts all trade offers from an specific account i.e your main account
// manager.on('newOffer', offer => {
//     if (offer.partner.getSteamID64() === config.trusted_account) {
//         offer.accept((err, status) => {
//             if (err) { // <- if error occurs, show output to the user
//                 console.log('Something went wrong Status: ', err);
//             } else { // <- else, trade confirmed
//                 console.log(`Trade offer accepted. Status: ${status}.`);
//             }
//         });
//     } else { // <- if trade offer comes from an untrusted account
//         offer.decline(err => {
//             if (err) {
//                 console.log('Something went wrong Status: ' + err);
//             } else {
//                 console.log('Cancelled offer from other account.');
//             }
//         });
//     }
// });
