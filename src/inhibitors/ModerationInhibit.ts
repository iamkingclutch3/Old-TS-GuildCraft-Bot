import { Command } from "discord-akairo";
import { Inhibitor } from "discord-akairo";
import { Message } from "discord.js";
import { settings } from "../Bot";
import { hasRoleInRoles } from "../Utils";

class ModerationInhibit extends Inhibitor {
  constructor() {
    super("moderation", {
      reason: "moderation",
      priority: 0,
    });
  }

  async exec(message: Message, command: Command) {
    return command.categoryID === "Moderation" && !hasRoleInRoles(message.member, settings.modRoles.moderator, true);
  }
}

module.exports = ModerationInhibit;
