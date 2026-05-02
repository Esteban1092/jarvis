# PRD — J.A.R.V.I.S Voice Assistant

## Problem Statement (original, verbatim)
> crea un codigo de jarvis que se pueda activar con un activate por voz y que razone por su cuenta AQ.Ab8RN6IJ_SrRdl1Ayf8cyPC22o9m8jHd-GxvANiZp5kC6EbvPw esta es la api de geminis para que sirva y raze adecuadamente tiene que ser una esfera y cada vez que hable suelte un tipo de aura color azul la esfera que sea color balnco con azul y que a lado de la esfera este el chat o lo que decimos o interactuamos

## User Choices
- LLM: Gemini (key user-supplied: `AQ.Ab8RN6IJ_...`). Fallback: Emergent LLM Key (universal).
- Models: gemini-2.5-flash (default) + gemini-2.5-pro (toggle)
- TTS: Browser Web Speech API
- Languages: Español + English (auto by selector)
- Persistence: MongoDB

## Architecture
- **Backend** FastAPI on `:8001` with `/api` prefix; emergentintegrations `LlmChat` for Gemini.
  - User key tried first, on any failure falls back to `EMERGENT_LLM_KEY` and flags `used_fallback_key=true`.
  - Multi-turn context replayed as conversation transcript (last 12 msgs).
- **Frontend** React 19 + TailwindCSS + Framer Motion + Shadcn UI.
  - `Jarvis.jsx` — split layout (sphere left, chat right).
  - `Sphere.jsx` — animated white-blue orb with state-based motion (idle/waiting/listening/speaking/thinking) and pulsing cyan auras.
  - `ChatPanel.jsx` — messages, model+lang selectors, manual input.
  - `useVoice.js` — Web Speech API wake-word ("activate" / "activar" / "jarvis") + browser TTS.
- **DB**: MongoDB collection `chat_messages` — `{id, session_id, role, content, model, timestamp(ISO)}`. `_id` excluded on read.

## API
- `GET /api/` — health
- `POST /api/chat` `{session_id, message, model}` → `{reply, model, session_id, used_fallback_key}`
- `GET /api/chat/history/{session_id}`
- `DELETE /api/chat/history/{session_id}`

## Implemented (2026-02 Day 1)
- [x] Voice activation via wake-word "activate" / "activar" / "jarvis"
- [x] White+blue sphere with reactive cyan aura animations (idle/waiting/listening/speaking/thinking states)
- [x] Bilingual ES/EN responses with selector
- [x] Browser TTS speaking the responses (toggleable)
- [x] Live transcript display while user speaks
- [x] Chat panel with persistent MongoDB history per session
- [x] Model selector (gemini-2.5-flash / gemini-2.5-pro)
- [x] Clear history button
- [x] Automatic fallback to Emergent LLM Key when user-supplied Gemini key fails
- [x] Backend tests: 10/10 pytest passing
- [x] Frontend send-btn click verified post-fix

## Known Issues / Notes
- The user-supplied Gemini key (`AQ.Ab8...`) is NOT a valid Google AI Studio key (they start with `AIza`). The app silently falls back to Emergent LLM Key — fully working.
- Web Speech API only works in Chrome/Edge. Firefox/Safari users see "Voz no soportada".

## Backlog
### P1
- Streaming responses (token-by-token reveal)
- Voice command shortcuts ("clear chat", "switch language", "switch model")
- Background ambient audio when speaking

### P2
- 3D WebGL sphere (Three.js) with real audio-reactive vertex displacement
- Multi-session UI (list, switch sessions)
- Custom voice via ElevenLabs (premium TTS)
- User-configurable wake-word

### P3
- Memory/RAG layer for long-term Jarvis context
- Tool-use (web search, calendar, weather)

## Next Action Items
- (Optional) Replace user's invalid Gemini key with valid `AIza...` to use their own quota
- Consider streaming for snappier feel
