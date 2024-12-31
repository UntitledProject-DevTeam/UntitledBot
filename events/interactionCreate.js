require("dotenv").config();
const axios = require('axios');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('speaker_select_')) return;

    const userId = interaction.customId.split('_')[2];
    if (interaction.user.id !== userId) return;

    // Initialize and update member config
    const memberConfig = client.zBotGData.initMemberSpeakerConfig(interaction.guildId, userId);
    const [engine, ...params] = interaction.values[0].split(':');
    
    memberConfig.engine = engine;
    if (engine === 'coeiroink') {
      const [uuid, styleId] = params;
      memberConfig.uuid = uuid;
      memberConfig.id = parseInt(styleId);
      const response = await axios.post(`${process.env.COEIROINK_API_URL}v1/style_id_to_speaker_meta?styleId=${styleId}`);
      await interaction.update({
        content: `スピーカー設定を更新しました:\nキャラクター: ${response.data.speakerName}\nスタイル: ${response.data.styleName}`,
        components: []
      });
    } else if (engine === 'voicevox') {
      memberConfig.id = parseInt(params[0]);
      memberConfig.uuid = null;
      
      const response = await axios.get(`${process.env.VOICEVOX_API_URL}/speakers`);
      const speaker = response.data.find(s => s.styles[0].id === memberConfig.id);
      await interaction.update({
        content: `スピーカー設定を更新しました:\n話者: ${speaker.name}`,
        components: []
      });
    } else if (engine === 'ytts') {
      memberConfig.id = params[0];
      memberConfig.uuid = null;
      await interaction.update({
        content: `スピーカー設定を更新しました:\n話者: ${params[0]}`,
        components: []
      });
    }

    // Save the configuration
    client.zBotGData.saveConfig(interaction.guildId);
  },
};
