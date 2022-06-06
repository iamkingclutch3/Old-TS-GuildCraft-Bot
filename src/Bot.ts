import BotClient, { Settings } from "./client/BotClient";
import expresss from 'express';
import { createHash } from "crypto";
import bodyParser from 'body-parser';
import { TextChannel } from "discord.js";
import snoowrap from "snoowrap";
import { getRandom } from "random-useragent";

export const settings: Settings = require('./assets/config.json');
export const secretKey = createHash('sha256').update(settings.link.secret).digest('hex');
export const client: BotClient = new BotClient(settings);
export const express = expresss();

export const reddit = new snoowrap({
  userAgent: getRandom(),
  clientId: settings.reddit.clientId,
  clientSecret: settings.reddit.clientSecret,
  refreshToken: settings.reddit.refreshToken
});

express.use(bodyParser.json());

express.post('/message/', async (req, res) => {
  if(!req.body?.server || !req.body.world || !req.body.message || !req.body.uuid || !req.body.name || !req.body.displayName) return res.json({
    status: 400,
    error: 'Invalid request body'
  });
  if(!req.body.secret || req.body.secret !== secretKey) return res.json({
    status: 401,
    error: 'Unauthorized'
  });
  const server = settings.info.servers.find((v) => v.name === req.body.server);
  if(!server || !server.channelId) return res.json({
    status: 400,
    error: 'Server not found'
  });
  const channel = await client.channels.fetch(server.channelId).catch(() => {});
  if(!channel) return res.json({
    status: 500,
    error: 'Invalid text channel'
  });
  const x = settings.info.msgFormat + "";
  (channel as TextChannel).send(x
    .replace(/%server%/g, server.fancyName)
    .replace(/%world%/g, req.body.world)
    .replace(/%name%/g, req.body.name)
    .replace(/%message%/g, req.body.message)
    .replace(/%uuid%/g, req.body.uuid)
    .replace(/%displayname%/g, req.body.displayName));
  return res.json({
    status: 200,
    message: 'Successful'
  });
});

express.listen(settings.link.port, () => {
  console.log('Listening on port: ' + settings.link.port);
});
client.start();

process.on('uncaughtException', function (exception) {
  console.log(exception)
   });