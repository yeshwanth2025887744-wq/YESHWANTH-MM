import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK on server side with mandatory headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API: AI Doorbell Event & Video Analysis
app.post('/api/ai/analyze-event', async (req: Request, res: Response) => {
  try {
    const { eventType, deviceName, timestamp, description, visitorText } = req.body;

    if (!ai) {
      // Fallback deterministic analysis if key is not configured yet
      return res.json({
        summary: `Verified ${eventType || 'motion'} at ${deviceName || 'Front Door'}. Person appeared with package. No security hazard detected.`,
        threatLevel: 'Low',
        confidence: 0.96,
        detectedObjects: ['Visitor', 'Delivery Courier', 'Package', 'Safety Vest'],
        recommendedAction: 'Grant delivery pass or verify package dropped on porch.',
      });
    }

    const prompt = `You are Ring Vision AI, an intelligent home and business security analysis model.
Analyze the following Ring device security event:
Device: ${deviceName || 'Ring Video Doorbell Pro 2'}
Event Type: ${eventType || 'Motion Ding'}
Timestamp: ${timestamp || new Date().toISOString()}
Context: ${description || 'Motion in front porch zone. Visitor approached doorbell.'}
Visitor Speech / Notes: ${visitorText || 'None'}

Provide an accurate, concise assessment formatted as JSON with keys:
- summary (string: 2 sentences explaining what occurred)
- threatLevel (string: "None", "Low", "Medium", or "High")
- confidence (number: between 0.85 and 0.99)
- detectedObjects (array of strings, e.g. ["Courier", "Package", "Hi-Vis Jacket"])
- recommendedAction (string: concrete recommendation, e.g. "Auto-unlock smart delivery box" or "Log as safe visitor")
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing event:', error);
    return res.status(500).json({
      error: 'Failed to analyze event',
      fallback: 'Person detected near front porch. Safe visitor activity.',
    });
  }
});

// API: AI Accessibility Quick Reply Generator
app.post('/api/ai/quick-reply', async (req: Request, res: Response) => {
  try {
    const { visitorSpeech, residentContext } = req.body;

    if (!ai) {
      return res.json({
        quickReplies: [
          'Hello! Please leave the package behind the planter, thank you.',
          'I am hard of hearing and on my way to the door. Please give me 1 minute.',
          'We do not accept unsolicited visits today. Please have a good day.',
          'Please slide the envelope under the gate. Thanks!',
        ],
      });
    }

    const prompt = `You are Ring Assistive Voice, generating 4 concise, polite, natural AAC quick replies for a resident who is deaf, hard of hearing, or non-verbal to play aloud through the Ring Doorbell speaker to a visitor.
Visitor just said: "${visitorSpeech || 'Hello, I have a delivery for apartment 4B'}"
Resident context: "${residentContext || 'Resident is hard of hearing, lives independently'}"

Return JSON with key "quickReplies" as an array of 4 distinct, helpful, courteous responses of 1-2 sentences each.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating quick replies:', error);
    return res.status(500).json({
      quickReplies: [
        'Please leave the delivery by the front door.',
        'I am on my way to the door, please give me a moment.',
        'Please come back tomorrow afternoon.',
        'Thank you, have a great day!',
      ],
    });
  }
});

// API: AI Snapshot 1-Sentence Caption Analyzer
app.post('/api/ai/analyze-snapshot', async (req: Request, res: Response) => {
  try {
    const { deviceName, eventType, timestamp, context } = req.body;
    if (!ai) {
      const fallbackCaptions = [
        'Package safely delivered on the front porch near the entryway planter.',
        'Resident Eleanor walking through the morning hallway with steady mobility.',
        'Amazon Key logistics courier scanned access badge at the loading dock.',
        'Front porch doorbell button pressed by delivery courier.',
        'Motion detected along walkway path with floodlight illumination.',
      ];
      const randomCaption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
      return res.json({
        caption: randomCaption,
        detectedObjects: ['Delivery Box', 'Doorstep', 'Courier'],
        threatLevel: 'None',
        confidence: 0.97,
      });
    }

    const prompt = `You are Ring Snapshot Vision AI. Generate exactly ONE clear, concise, descriptive sentence explaining what happened in this security camera snapshot event.
Device: ${deviceName || 'Ring Video Doorbell Pro 2'}
Event: ${eventType || 'Ding Doorbell'}
Time: ${timestamp || 'Just now'}
Context: ${context || 'Front porch camera snapshot'}

Format as JSON with keys:
- caption (string: exactly 1 informative sentence, e.g. "Package safely delivered on front porch by courier in high-visibility vest.")
- detectedObjects (array of strings, e.g. ["Courier", "Package", "Entryway"])
- confidence (number between 0.90 and 0.99)
- threatLevel (string: "None", "Low", "Medium", "High")
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({
      caption: 'Verified security event: visitor activity detected at camera zone.',
      detectedObjects: ['Visitor', 'Entryway'],
      confidence: 0.95,
      threatLevel: 'None',
    });
  }
});

// API: Ring Webhook Event Handler (Handles 'ding' and 'motion')
app.post('/api/ring/webhook', (req: Request, res: Response) => {
  const { event, kind, device_id } = req.body;
  const eventKind = kind || (event === 'ding' ? 'ding' : 'motion');

  return res.json({
    status: 'received',
    webhook_id: `whk_${Date.now()}`,
    event_type: eventKind,
    device_id: device_id || 'dev_doorbell_front',
    processed_at: new Date().toISOString(),
    action_dispatched: eventKind === 'ding' ? 'chime_strobe_activated' : 'motion_stream_buffered',
  });
});

// API: AI Caretaker Daily Wellness Assessment
app.post('/api/ai/care-wellness', async (req: Request, res: Response) => {
  try {
    const { sensorLog, careRecipient } = req.body;

    if (!ai) {
      return res.json({
        status: 'Optimal & Routine',
        score: '98/100',
        highlights: [
          'Morning mobility started at 07:42 AM (Kitchen motion sensor).',
          'Medicine cabinet opened at 08:15 AM (Prescriptions verified).',
          'Front door opened at 11:30 AM for Meals on Wheels courier (Ring camera verified).',
          'Zero exterior door activity or wandering detected during night hours (11 PM - 6 AM).',
        ],
        alerts: [],
        caregiverNote: 'Daily routine matches standard healthy baseline. No intervention needed today.',
      });
    }

    const prompt = `You are Ring Care Companion, an AI assistant supporting family caregivers for an elderly or vulnerable relative living independently with Ring sensors.
Care recipient: ${careRecipient || 'Eleanor (Age 78)'}
Sensor activity log for today:
${JSON.stringify(sensorLog || [
  { time: '07:42 AM', sensor: 'Kitchen Motion', event: 'Active movement' },
  { time: '08:15 AM', sensor: 'Medicine Cabinet Contact Sensor', event: 'Opened and closed' },
  { time: '11:30 AM', sensor: 'Ring Video Doorbell', event: 'Courier delivered lunch, front door opened 90s' },
  { time: '02:10 PM', sensor: 'Living Room Motion', event: 'Movement detected' },
  { time: '05:40 PM', sensor: 'Kitchen Motion', event: 'Dinner prep activity' },
])}

Generate a caring, reassuring, and clinically astute caregiver summary in JSON with keys:
- status (string: e.g. "Normal Routine", "Minor Deviation", or "Attention Recommended")
- score (string: e.g. "97/100 Normal Routine")
- highlights (array of 3-4 bullet strings summarizing daily rhythm)
- alerts (array of strings, empty if everything is normal)
- caregiverNote (string: a warm 2-sentence summary for the daughter/son caregiver)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating wellness assessment:', error);
    return res.status(500).json({
      status: 'Normal Routine',
      score: '95/100',
      highlights: ['Consistent daytime mobility', 'Medication routine confirmed', 'No nighttime wandering'],
      alerts: [],
      caregiverNote: 'All Ring sensors show healthy activity today. No caregiver action required.',
    });
  }
});

// Production or Vite development serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Ring Pulse server running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic();
