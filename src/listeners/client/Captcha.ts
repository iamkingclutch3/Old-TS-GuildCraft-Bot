import { Listener } from 'discord-akairo';
import { TextChannel } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { Guild } from 'discord.js';
import { GuildMember } from 'discord.js';
import { join } from 'path';
import { loadImage, createCanvas } from 'canvas';
import { sleep, updateChannelPerm } from '../../Utils';
import { MessageAttachment } from 'discord.js';
import { settings } from '../../Bot';

export default class CaptchaLis extends Listener {
  public constructor() {
    super('captcha', {
      emitter: 'client',
      event: 'guildMemberAdd',
      category: 'client',
    });
  }

  public async exec(member: GuildMember) {
    if(member.user.bot) return;
    const role = await getUnverifiedRole(member.guild);
    const chan = await getUnverifiedChannnel(member.guild);
    const dm = await member.user.createDM();
    await member.roles.add(role);

    const randomtext = getCaptcha();
    const image = await loadImage(join(__dirname, '..', '..', 'assets', 'captcha.jpg'));
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.font = '80px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(randomtext, 0, image.height- 25, image.width);
    
    const msgEmbed: MessageEmbed = new MessageEmbed({
      author: {
        name: member.guild.name,
        iconURL: member.guild.iconURL()
      },
      title: 'Captcha Verification',
      description: 'Please enter the text below to get verified',
      footer: {
        text: 'You have 3 tries and 30 seconds to respond.'
      }
    }).setTitle("Captcha Verification")
      .setColor("RANDOM")
      .setImage("attachment://image.jpg");
    msgEmbed.attachFiles([new MessageAttachment(canvas.toBuffer('image/jpeg'), 'image.jpg')]);
    const succ = await dm.send(msgEmbed).catch(() => {});
    if(!succ) {
      const err = await chan.send({
        embed: {
          color: 'RANDOM',
          title: 'Alert',
          description: `<@${member.id}>, You need to have your DMs Open for captcha verification`,
          footer: {
            text: 'You will kicked in 15 seconds, please rejoin.'
          }
        }
      });
      await sleep(15000);
      await err.delete();
      await member.kick();
      return;
    }
    let tries = 0;
    while(tries < settings.captchaTries) {
      const res = (await dm.awaitMessages((message) => message.author.id === member.user.id, {
        max: 1,
        time: 30000
      })).first();
      if(!res) {
        await dm.send({
          embed: {
            title: 'Timeout',
            color: 'RANDOM',
            description: 'You took too long to respond and so, have been kicked from the server.',
          }
        });
        await member.kick();
        return;
      } 
      if(res.content === randomtext) {
        await member.roles.remove(role);
		await member.roles.add('543537777053270016');
        return dm.send({
          embed: {
            color: 'RANDOM',
            title: 'Verified',
            description: 'You have been verified and can now access the rest of the discord server.'
          }
        });
      } else {
        if(settings.captchaTries - tries - 1 > 0)
        await dm.send({
          embed: {
            color: 'RANDOM',
            title: 'Invalid',
            description: `Captcha entered is invalid, you have ${settings.captchaTries - tries - 1} more tries.`
          }
        });
        tries++;
      }
    }

    await dm.send({
      embed: {
        color: 'RANDOM',
        title: 'Failed',
        description: 'You have failed the verification process and have been kicked from the server.'
      }
    });
    await member.kick();
    return;
  }
}

export const getCaptcha = (length = 5) => {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
}

export const getUnverifiedRole = async (guild: Guild) => {
  if(!guild) return;
  let unverified = guild.roles.cache.find((v) => v.name === 'Unverified');
  if(!unverified) {
    unverified = await guild.roles.create({
      data: {
        name: 'Unverified',
        color: 'DARK_GREY'
      }
    });

    const chan = await getUnverifiedChannnel(guild);
    await updateChannelPerm(chan, {
      id: unverified.id,
      type: 'role',
      allow: 'VIEW_CHANNEL',
      deny: ['SEND_MESSAGES']
    });

    for(const channel of guild.channels.cache) {
      if(channel[1].id === chan.id) continue;
      await updateChannelPerm(channel[1], {
        id: unverified.id,
        type: 'role',
        deny: ['VIEW_CHANNEL']
      });
    }
  }
  return unverified;
}

export const getUnverifiedChannnel = async (guild: Guild) => {
  if(!guild) return;
  let unverified: TextChannel = guild.channels.cache.find((v) => v.type === 'text' && v.name.toLowerCase() === 'unverified') as TextChannel;
  if(!unverified) {
    unverified = await guild.channels.create('unverified', {
      type: 'text',
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          type: 'role',
          deny: ['VIEW_CHANNEL']
        }
      ]
    });
  }
  return unverified;
}