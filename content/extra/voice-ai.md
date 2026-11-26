# More interview questions

## How do you handle barge-in (the user interrupts the agent)?

Keep listening **while the agent speaks**. When the VAD hears real speech, immediately **stop TTS playback**, flush queued audio, **cancel the in-flight LLM/TTS request**, and start a new turn with the interruption. Use **echo cancellation** so the agent does not hear itself, require a short minimum speech length to avoid cutting off on a cough, and keep a record of what was actually spoken so the conversation history stays truthful.

## How does end-of-turn detection work beyond simple silence?

A fixed silence timeout is a trade-off: too short cuts people off, too long feels slow. Better systems combine **VAD**, **streaming transcript content** (does the sentence sound finished? a small model or the LLM predicts "turn complete"), **prosody** (falling pitch), and adaptive timeouts (wait longer after "um…" or a trailing "and"). Tune on real calls and measure the **interruption rate** and the **dead-air time**.

## WebRTC or WebSocket for streaming voice?

**WebRTC** is built for real-time audio: UDP, jitter buffering, echo cancellation, packet-loss handling and good browser support, so it gives lower and steadier latency. **WebSocket** (TCP) is simpler to build and debug and fine on good networks, but head-of-line blocking can add delay on lossy connections. Phone systems (Twilio, Telnyx) usually stream audio to you over **WebSocket** in 8 kHz mu-law format.

## How do you reduce TTS time-to-first-audio?

Use a **streaming TTS** that returns audio chunks as it generates, send text **sentence by sentence** (or phrase by phrase) as soon as the LLM produces it, keep the connection warm, use a nearby region, pick a smaller/faster voice model, pre-generate common phrases ("One moment…"), and avoid long openings. Measure **time to first byte** separately from total synthesis time.

## How do you integrate a voice agent with the phone network?

Use a **telephony provider** (Twilio, Telnyx, Vonage) that connects PSTN calls to your server. With **Media Streams** they open a WebSocket and send you **8 kHz mu-law** audio frames; you decode, resample for STT, and send synthesised audio back in the same format. You also handle call events (answered, hang-up), **DTMF** keypad tones, call transfer to a human (SIP/REFER), recording, and concurrency limits.

## How do you make tool calls safe in a voice agent?

Voice has no screen for confirmation, so build it in: **read back** important values ("book Friday at eight for two, correct?") before any action with side effects, require an explicit "yes", validate arguments in code (allow-lists, ranges), use **idempotency keys** so a repeated request cannot double-book, limit what each tool can do, and hand off to a human for risky actions (payments, cancellations).

## How do you handle numbers, spellings and codes in speech?

STT often mis-hears digits and names. Use **domain vocabulary / keyword boosting**, ask the user to **spell** names ("A as in Alpha") and confirm by reading back, accept **DTMF** for long numbers, normalise spoken numbers ("two zero two six" vs "twenty twenty-six") with a formatter, and validate against known data (check digit, customer lookup) before acting.

## What do you do when the STT, LLM or TTS provider fails mid-call?

Add **timeouts, retries and fallbacks**: a second provider or model, a cached filler phrase ("Sorry, one moment"), then a graceful escalation ("Let me connect you to a person") instead of silence. Monitor provider health, circuit-break a failing provider so new calls skip it, and keep a text-only degraded mode. Log which stage failed so you can fix the root cause.

## How do you measure the quality of a voice agent?

Technical: **time to first audio (p50/p95)**, word error rate, interruption and dead-air rates, tool-call accuracy. Business: **task completion rate**, escalation rate, call duration, user satisfaction (post-call survey or LLM-judged transcripts). Review **sampled call recordings** weekly and build regression tests from failed calls (replay the audio and compare).

## What legal and privacy issues come with voice agents?

Tell callers they are talking to an **AI**, get **consent for recording** (laws differ by country and state), protect recordings and transcripts (encryption, retention limits, access control), redact **PII and payment data** (never let card numbers reach logs or the LLM; use a PCI-compliant IVR/DTMF flow), follow GDPR-style rights (access, deletion), and check regulations for automated calls and marketing.

## How does a speech-to-speech model change the architecture?

A speech-to-speech model (such as a realtime API) takes **audio in and produces audio out** directly, so you skip separate STT/TTS stages and can get lower latency, natural interruptions, and emotion/tone. The trade-offs: less control and visibility (no clean transcript to validate), harder to swap components, higher cost, and tool calls and guardrails must be handled through the model's own function-calling interface. Many teams use a cascade for control and speech-to-speech for the most natural feel.
