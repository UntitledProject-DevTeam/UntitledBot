const { getVoiceConnection } = require("@discordjs/voice");
const zBotTextPreprocessor = require("../ttsUtils/TextPreprocessor");
const zBotTextToSpeech = require("../ttsUtils/TextToSpeech");

const Discord = require("discord.js");
module.exports = {
  name: "messageCreate",
    async execute(message, client) {
      const { GData } = message.client;
    if (message.author.bot) return;

    const guildId = message.guildId;
    const memberId = message.member.id;

    //const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(guildId);

    if (!connection) return;

    const guildConfig = GData.initGuildConfigIfUndefined(guildId);

    const onEventTextChannelId = message.channel.id;
    const targetTextChannelId = guildConfig.textChannelId;

    if (onEventTextChannelId !== targetTextChannelId) return;

    const memberSpeakerConfig = GData.initMemberSpeakerConfigIfUndefined(
      guildId,
      memberId
    );

    const text = message.content;
    const dictionary = GData.initGuildDictionaryIfUndefined(guildId);

    //const zBotTextPreprocessor = require("./zBotTextPreprocessor");
    const splitedText = zBotTextPreprocessor(text, dictionary);

    const speaker = memberSpeakerConfig;
    const player = connection.state.subscription.player;
    const queue = GData.initGuildQueueIfUndefined(guildId);

    //const zBotTextToSpeech = require("./zBotTextToSpeech");
    await zBotTextToSpeech(splitedText, speaker, player, queue);

    return;
  },
};
