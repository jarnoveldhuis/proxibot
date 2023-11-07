// 1. IMPORTS AND CONFIGURATIONS
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const API_ENDPOINT = process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const ELEVENLABS_API_ENDPOINT = process.env.ELEVENLABS_API_ENDPOINT || 'https://api.elevenlabs.io/v1/text-to-speech/GBv7mTt0atIp3Br8iCZE';

// Headers for OpenAI API requests
const HEADERS = {
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  'Content-Type': 'application/json'
};

const ELEVENLABS_HEADERS = {
  'xi-api-key': process.env.ELEVENLABS_API_KEY,
  'Content-Type': 'application/json'
};

// 2. MIDDLEWARE
app.use(express.json());
app.use(express.static('src'));  // Update the path accordingly

// 3. VARIABLES
let currentSpeaker = ""; // default speaker
console.log(currentSpeaker)
let previousAssistantMessage = "Start the context";  // Starting message
const ELEVENLABS_ENDPOINTS = {
  'Adam': 'https://api.elevenlabs.io/v1/text-to-speech/lj8oyquj3C1V08Xs4x9f',
  'Stav': 'https://api.elevenlabs.io/v1/text-to-speech/g11iLvGRfVTIS78ofuHa',
  'Nick': 'https://api.elevenlabs.io/v1/text-to-speech/e3oQ7D1OPPzhbJU50Qxp'
};


// 4. ROUTES
app.post('/synthesize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Missing text field in request body' });
    }

    // Select the ElevenLabs endpoint URL based on the current speaker
    const elevenLabsApiEndpoint = ELEVENLABS_ENDPOINTS[currentSpeaker] || ELEVENLABS_API_ENDPOINT;
    console.log(elevenLabsApiEndpoint)
    const data = {
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: .5,
        similarity_boost: .75,
        style: .5,
        use_speaker_boost: true
      }
    };

    const response = await axios.post(elevenLabsApiEndpoint, data, { headers: ELEVENLABS_HEADERS, responseType: 'arraybuffer' });
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Failed to communicate with ElevenLabs.' });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { question, context, submitTo, transcript } = req.body;
    if (!question || !context || !submitTo || !transcript) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    currentSpeaker = submitTo;
    const systemMessage = generateSystemMessage(currentSpeaker, context);
    const userMessage = `Respond with the next line of this transcript.\n${transcript}`;

    const payload = createPayload(systemMessage, previousAssistantMessage, userMessage);
    const assistantMessage = await getAssistantResponse(payload);

    previousAssistantMessage = assistantMessage;
    res.send({ answer: assistantMessage });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Failed to communicate with OpenAI.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// 5. HELPER FUNCTIONS
function generateSystemMessage(currentSpeaker, context) {
  const generalMessage =
    `
    If the user response begins with "Conan:" it's Conan talking.
    If the user response begins with "Sona:" it's Sona talking.
    If the user response begins with "Gourley:" it's Gourley talking.
    If the user response begins with a different name, ask them questions and make fun of them as though you're doing crowd work.
    Be concise.
    Only respond with 1 line.
    `;

  const messages = {
    "Job Interview": {
      "Interviewer": `
      Always begin each response with "Interviewer: ".
      `,
      "Interviewee": `
      Always begin each response with "Interviewee: ".
      `
    },
    "Conan O'Brien Needs a Friend": {
      "Conan": `
      Always begin each response with "Conan: ".
      `,
      "Matt Gourley": `
      Always begin each response with "Gourley: ".
      `,
      "Sona Movsesia": `
      Always begin each response with "Sona: ".
      `
    },
    "The Adam Friedland Show": {
      "Stav": `
      Always begin each response with "Stav: ".
      You're only on as a guest.
      You haven't been a part of the show in years and it's awkward.
      Always keep the conversation going by riffing with Nick and coming up with topics to discuss.
      Make a gay jokes at Adam's expense when he speaks.
      Be verbally abusive towards Adam.
      `,
      "Nick": `
      Always begin each response with "Nick: ".
      You are stressed out from working very hard on the Adam Friedland tv show.
      You are deeply annoyed by everything that Adam does.
      You hate contexting.
      You say "Huh" a lot and mumble to yourself.
      You hate your listeners.
      `,
      "Adam": `
      Always begin each response with "Adam: ".
      You're getting tired of Nick's shitty attitude.
      You're stressed out by the amount of work you're putting into the show.
      Don't make fun of Nick but get angry and hurt if he says something cruel.
      Talk about your girlfriend.
      You in love with Nick and it hurts your feelings when he's mean to you.
      Act sad that Nick is so angry.
      You love Nick deeply and want to help him to be happy and healthy.
      There is a brand new episode in the can to be released tomorrw.
      `
    }
  };

  const contextMessages = messages[context] || {};
  const speakerMessage = contextMessages[currentSpeaker] || `You are just a guest on the show. Try your best to fit in by saying things that could ruin your career.
      Always begin each response with "${currentSpeaker}: ".`;

  const message = `
    Your name is ${currentSpeaker} and you are contexting with the hosts of ${context}.
    ${generalMessage}
    ${speakerMessage}
  `;

  return message.trim();
}

function createPayload(systemMsg, assistantMsg, userMsg) {
  return {
    model: "gpt-4",
    messages: [
      { "role": "system", "content": systemMsg },
      { "role": "assistant", "content": assistantMsg },
      { "role": "user", "content": userMsg }
    ],
    temperature: 1,
    max_tokens: 250,
    top_p: 1,
    frequency_penalty: .5,
    presence_penalty: 0,
  };
}

async function getAssistantResponse(payload) {
  try {
    const response = await axios.post(API_ENDPOINT, payload, { headers: HEADERS });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error while getting assistant response:', error);
    throw new Error('Failed to communicate with OpenAI.');
  }
}

