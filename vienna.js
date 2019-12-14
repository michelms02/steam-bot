// Vienna Bot v2.0

/**
 * This code's prerequisites are:
 * npm install steam-user
 * npm install steam-totp
 * npm install steam-tradeoffer-manager
 * npm install steamcommunity
 */

 // Imports
const config = require('./config.json'),
    logs = require();


 // Constants
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

// Logins on Steam and simulates its client
const logOnOptions = {
    //TODO setup login information
    accountName: config.username,
    password: config.password,

    twoFactorCode: SteamTopt.generateAuthCode(config.shared_secret),
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
    console.log('Successfully logged into Steam!');

    // Sets status (can also receive a second parameter to change steam name i.e , 'lafter' )
    client.setPersona(SteamUser.Steam.EPersonaState.Online);
    // Sets currently currently playing
    client.gamesPlayed(config.games); // <- gameID
});

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);

    community.setCookies(cookies);
    community.startConfirmationChecker(10000, config.identity_secret); // <- checks if there's any pending confirmation every 10 secs
});