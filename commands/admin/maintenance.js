const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const { subCommandHandling, addSubCommand } = require(`../../lib/commandUtils`);

module.exports = {
  handlingCommands: subCommandHandling("admin/maintenance"),
  data: addSubCommand(
    "admin/maintenance",
    new SlashCommandBuilder()
      .setName("maintenance")
      .setDescription("メンテナンスモード")
  ),
  adminGuildOnly: true,
  /**
   * Executes the maintenance command.
   *
   * @param {CommandInteraction} interaction - The interaction object.
   * @returns {Promise<void>} - A promise that resolves when the execution is complete.
   */
  async execute(interaction) {
    subCommandHandling(this.handlingCommands, interaction);
    return;
  },
};
