require("dotenv").config();

const envVoiceServers = process.env.voiceServers;

const envSpeakerSpeedScaleUpperLimit = Number(
  process.env.speakerSpeedScaleUpperLimit
);
const envSpeakerSpeedScaleLowerLimit = Number(
  process.env.speakerSpeedScaleLowerLimit
);

const envSpeakerPitchScaleUpperLimit = Number(
  process.env.speakerPitchScaleUpperLimit
);
const envSpeakerPitchScaleLowerLimit = Number(
  process.env.speakerPitchScaleLowerLimit
);

const envSpeakerIntonationScaleUpperLimit = Number(
  process.env.speakerIntonationScaleUpperLimit
);
const envSpeakerIntonationScaleLowerLimit = Number(
  process.env.speakerIntonationScaleLowerLimit
);

const envSpeakerVolumeScaleUpperLimit = Number(
  process.env.speakerVolumeScaleUpperLimit
);
const envSpeakerVolumeScaleLowerLimit = Number(
  process.env.speakerVolumeScaleLowerLimit
);

const autocompleteLimit = 25;

const { getVoiceConnection } = require("@discordjs/voice");
const { joinVoiceChannel } = require("@discordjs/voice");
const { createAudioPlayer, NoSubscriberBehavior } = require("@discordjs/voice");
const { AttachmentBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("connect")
    .setDescription("Connect to a voice channel."),
  async execute(i, zBotGData) {
    const guildId = interaction.guildId;

    const textCannelId = i.channel.id;
    const voiceCannelId = i.member.voice.channel.id;
    const adapterCreator = interaction.guild.voiceAdapterCreator;

    //const { joinVoiceChannel } = require("@discordjs/voice");
    const connection = joinVoiceChannel({
      channelId: voiceCannelId,
      guildId: guildId,
      adapterCreator: adapterCreator,
    });

    if (!connection) {
      await interaction.reply("接続に失敗しました");
      return;
    }

    //const { createAudioPlayer, NoSubscriberBehavior } = require("@discordjs/voice");
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    if (!player) {
      connection.destroy();

      await interaction.reply("プレイヤーの生成に失敗しました");
      return;
    }

    const subscribe = connection.subscribe(player);

    if (!subscribe) {
      connection.destroy();

      await interaction.reply(
        "音声チャンネルへのプレイヤーの接続に失敗しました"
      );
      return;
    }
    const guildConfig = zBotGData.restoreConfig(guildId);
    guildConfig.textChannelId = textCannelId;
    guildConfig.voiceChannelId = voiceCannelId;

    zBotGData.restoreDictionary(guildId);
    zBotGData.initGuildQueueIfUndefined(guildId);

    await interaction.reply("こんにちは!UniBotを接続しました");
    return "No data";
  },
};
