require("dotenv").config();

const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');

const MAX_OPTIONS = 25; // Discordの制限

module.exports = {
  data: new SlashCommandBuilder()
    .setName('speaker')
    .setDescription('Set speaker settings')
    .addStringOption(option =>
      option
        .setName('engine')
        .setDescription('音声合成エンジン')
        .setRequired(true)
        .setChoices(
          { name: 'VOICEVOX', value: 'voicevox' },
          { name: 'COEIROINK', value: 'coeiroink' },
          { name: 'YTTS', value: 'ytts' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('話者リストのページ番号')
        .setMinValue(1)
    ),

  async execute(i, zBotGData) {
    const engine = i.options.getString('engine');
    const page = i.options.getInteger('page') || 1;
    let baseURL = engine === 'voicevox' ? 
      process.env.VOICEVOX_API_URL : 
      process.env.COEIROINK_API_URL;
    baseURL = engine === 'ytts' ?
        process.env.YTTS_API_URL :
        baseURL;

    const rpc = axios.create({
      baseURL: baseURL,
      proxy: false,
      timeout: 30 * 1000,
    });

    let allSpeakerOptions;
    
    if (engine === 'coeiroink') {
      const response = await rpc.get("/v1/speakers");
      allSpeakerOptions = response.data.flatMap(speaker => 
        speaker.styles.map(style => ({
          label: `${speaker.speakerName} (${style.styleName})`,
          value: `coeiroink:${speaker.speakerUuid}:${style.styleId}`,
          description: 'COEIROINK'
        }))
      );
    } else if (engine === 'voicevox') {
      const response = await rpc.get("/speakers");
      allSpeakerOptions = response.data.map(speaker => ({
        label: speaker.name,
        value: `voicevox:${speaker.styles[0].id}`,
        description: 'VOICEVOX'
      }));
    } else if (engine === 'ytts') {
        const response = await rpc.get("/speakers");
        allSpeakerOptions = JSON.parse(response.data).map(speaker => ({
          label: speaker,
          value: `ytts:${speaker}`,
          description: 'YTTS'
        }));
    }

    const totalPages = Math.ceil(allSpeakerOptions.length / MAX_OPTIONS);
    const startIndex = (page - 1) * MAX_OPTIONS;
    const speakerOptions = allSpeakerOptions.slice(startIndex, startIndex + MAX_OPTIONS);
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`speaker_select_${i.user.id}`)
      .setPlaceholder('話者を選択してください')
      .addOptions(speakerOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await i.reply({
      content: `話者を選択してください (${page}/${totalPages}ページ)`,
      components: [row],
      ephemeral: true
    });
  },
};
