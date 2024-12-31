const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("ボイスチャンネルからBotを切断します"),
  
  async execute(i, zBotGData) {
    const guildId = i.guild.id;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      await i.reply("ボイスチャンネルに接続していません。");
      return;
    }

    connection.destroy();
    zBotGData.zBotGData.delete(guildId);
    await i.reply("ボイスチャンネルから切断しました。");
  },
};
