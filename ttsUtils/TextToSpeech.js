require("dotenv").config();

const envVoiceServers = process.env.voiceServers;
const envVoiceServerTextLengthLimit = parseInt(process.env.voiceServerTextLengthLimit);
const envSamplingRate = parseInt(process.env.samplingRate);
const VOICEVOX_API_URL = process.env.VOICEVOX_API_URL;
const COEIROINK_API_URL = process.env.COEIROINK_API_URL;
const YTTS_API_URL = process.env.YTTS_API_URL;

const crypto = require("crypto");
const { setTimeout } = require("timers/promises");
const { entersState, AudioPlayerStatus } = require("@discordjs/voice");

async function zBotTextToSpeech(splitedText, speaker, player, queue) {
  const fullTextLength = splitedText.reduce(
    (sum, text) => sum + text.length,
    0
  );
  if (fullTextLength > envVoiceServerTextLengthLimit) {
    splitedText = ["文字数が多すぎます"];
  }

  const uuid = crypto.randomUUID();

  enQueue(queue, uuid);

  let count = 30 * 10;

  while (queue[0] !== uuid) {
    await setTimeout(100);

    count--;

    if (queue.length == 0 || count === 0) {
      deQueue(queue, uuid);
      return;
    }
  }

  const resources = [];

  for (const text of splitedText) {
    const resource = await voiceSynthesis(text, speaker);
    resources.push(resource);
  }

  for (const resource of resources) {
    await entersState(player, AudioPlayerStatus.Idle, 30 * 1000);

    if (queue.length == 0 || queue[0] !== uuid) {
      deQueue(queue, uuid);
      return;
    }

    player.play(resource);
  }

  deQueue(queue, uuid);

  return;
}

const { default: axios } = require("axios");
const { Readable } = require("stream");
const { createAudioResource, StreamType } = require("@discordjs/voice");

async function voiceSynthesis(text, speaker) {
  let baseURL = speaker.engine === 'voicevox' ? VOICEVOX_API_URL : COEIROINK_API_URL;
  baseURL = speaker.engine === 'ytts' ? YTTS_API_URL : baseURL;
  
  const rpc = axios.create({
    baseURL: baseURL,
    proxy: false,
    timeout: 30 * 1000,
  });

  if (speaker.engine === 'coeiroink') {
    // COEIROINKの場合は直接synthesis
    const synthesisParam = {
      "speakerUuid": speaker.uuid,
      "styleId": parseInt(speaker.id),
      "text": text,
      "speedScale": parseFloat(speaker.speedScale) || 1.0,
      "volumeScale": parseFloat(speaker.volumeScale) || 1.0,
      "pitchScale": parseFloat(speaker.pitchScale) || 0.0,
      "intonationScale": parseFloat(speaker.intonationScale) || 1.0,
      "prePhonemeLength": 0.1,
      "postPhonemeLength": 0.1,
      "outputSamplingRate": envSamplingRate
    };

    const response = await rpc.post(
      "v1/synthesis",
      JSON.stringify(synthesisParam),  // JSON文字列に変換
      {
        responseType: "arraybuffer",
        headers: {
          "accept": "audio/wav",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response || response.status !== 200) return;
    return createResponseResource(response.data);

  } else if (speaker.engine === 'voicevox') {
    // VOICEVOXの場合は従来通りquery→synthesis
    const response_query = await rpc.post(
      "audio_query?text=" + encodeURIComponent(text) + "&speaker=" + speaker.id,
      null,
      {
        headers: { accept: "application/json" },
      }
    );

    if (!response_query || response_query.status !== 200) return;

    const query = response_query.data;
    query.speedScale = parseFloat(speaker.speedScale) || 1.0;
    query.pitchScale = parseFloat(speaker.pitchScale) || 0.0;
    query.intonationScale = parseFloat(speaker.intonationScale) || 1.0;
    query.volumeScale = parseFloat(speaker.volumeScale) || 1.0;
    query.outputSamplingRate = envSamplingRate;

    const response_synthesis = await rpc.post(
      "synthesis?speaker=" + speaker.id,
      query,
      {
        responseType: "arraybuffer",
        headers: {
          accept: "audio/wav",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response_synthesis || response_synthesis.status !== 200) return;
    return createResponseResource(response_synthesis.data);
  } else if (speaker.engine === 'ytts') {
    // YTTSの場合はフォームデータとして送信
    const formData = new URLSearchParams();
    formData.append('speaker', speaker.id);
    formData.append('text', text);

    const response = await rpc.post(
      "synth",
      formData,
      {
        responseType: "arraybuffer",
        headers: {
          "accept": "audio/wav",
          "Content-Type": "application/x-www-form-urlencoded"
        },
      }
    );

    if (!response || response.status !== 200) return;
    return createResponseResource(response.data);
  }
}

function createResponseResource(data) {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  
  return createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
  });
}

function enQueue(queue, uuid) {
  if (!queue || !uuid) return;

  queue.push(uuid);
  return;
}

function deQueue(queue, uuid) {
  if (!queue || !uuid) return;

  const index = queue.indexOf(uuid);

  if (index !== -1) {
    queue.splice(0, index + 1);
  }

  return;
}

module.exports = zBotTextToSpeech;
