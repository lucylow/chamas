# NCED Implementation Guide: Chamas Voice AI

This document captures the full architecture, deployment strategy, and operational runbook for the Chamas Voice AI experience described in the NCED brief. It mirrors the hackathon narrative while grounding each section in concrete implementation details present in this repository.

---

## 1. Architecture Overview

### System Diagram — End-to-End Voice Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER DEVICE (Browser)                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  LOVABLE FRONTEND (React + Vite)                         │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │  Voice Chat Component (VoiceChat.tsx)          │    │    │
│  │  │  - Microphone input (Web Audio API)            │    │    │
│  │  │  - Audio encoding (Opus 32kbps)                │    │    │
│  │  │  - WebSocket/HTTP streaming                    │    │    │
│  │  │  - Message history display                     │    │    │
│  │  │  - MetaMask wallet connection                  │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │  Service Integrations                          │    │    │
│  │  │  - ethers.js (Sepolia blockchain)              │    │    │
│  │  │  - wagmi (React hooks for Web3)                │    │    │
│  │  │  - TanStack Query (API caching)                │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│                   HTTPS / WebSocket (TLS 1.3)                       │
│                    Compression: gzip (audio)                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Python)                         │
│                    https://api.chamas.app                           │
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │ ASR Service │───│ LLM Service │───│ TTS Service │              │
│  │ (Whisper)   │   │ (LLaMA 3.1) │   │ (Google TTS)│              │
│  │ Model: base │   │ 8B params   │   │ Swahili     │              │
│  │ Lang: Swahili   │ Q4 quantized│   │ voice       │              │
│  │ WER: <18%   │   │ Latency:1s  │   │ Latency: 2s │              │
│  └─────────────┘   └─────────────┘   └─────────────┘              │
│         ↓                   ↓                 ↓                    │
│  ┌──────────────────────────────────────────────────────┐          │
│  │         CONTEXT MEMORY (Redis)                       │          │
│  │  - Session state (user → AI turns)                   │          │
│  │  - Dialect detection cache                           │          │
│  │  - Intent classification logs                        │          │
│  │  - TTL: 3600s per session                            │          │
│  └──────────────────────────────────────────────────────┘          │
│         ↓                                                          │
│  ┌──────────────────────────────────────────────────────┐          │
│  │    BLOCKCHAIN INTERFACE (ethers.js + wagmi)          │          │
│  │  - Read chama state from Sepolia contracts           │          │
│  │  - Sign & broadcast transactions (user initiated)    │          │
│  │  - Query USDC balance, contribution history          │          │
│  └──────────────────────────────────────────────────────┘          │
│         ↓                   ↓                                      │
│  ┌──────────────┐  ┌─────────────────────────────────┐            │
│  │ Sepolia RPC  │  │  ChamaFactory Smart Contracts   │            │
│  │ (Infura)     │  │  - 0x123abc...factory          │            │
│  │              │  │  - Manages chama groups         │            │
│  │              │  │  - Handles contributions/payouts│            │
│  └──────────────┘  └─────────────────────────────────┘            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │         RATE LIMITING & SECURITY                    │           │
│  │  - Redis-based token bucket (10 req/min per IP)     │           │
│  │  - JWT token validation (session_id)                │           │
│  │  - CORS: only chamas.lovable.app + localhost        │           │
│  │  - Input sanitization (SQL injection, XSS)          │           │
│  └─────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Flow — Voice Query Processing

1. User speaks into the microphone ("Habari, ninjoin chama gani?").
2. Audio is captured at `16kHz`, encoded with `Opus @ 32 kbps`, wrapped in a `multipart/form-data` POST to `/voice/process`.
3. FastAPI stores the payload, runs Whisper ASR, and annotates confidence, dialect, language.
4. Redis-backed memory service retrieves the last five turns to preserve context.
5. Intent extraction identifies `browse_chamas`, fetching relevant data from Sepolia via `ChamaClient`.
6. LLaMA 3.1 generates the conversational response enriched with on-chain insights.
7. Google Cloud TTS (or Coqui fallback) synthesises a Swahili MP3 stream.
8. Response headers include `X-Session-ID`, `X-Intent`, `X-Dialect`, `X-Confidence`.
9. Frontend streams audio, updates transcript, and plots latency metrics (`~3.5s` p95).

---

## 3. Deployment Architecture

| Environment  | Frontend                          | Backend                             | Models                             | Contracts |
|--------------|-----------------------------------|-------------------------------------|------------------------------------|-----------|
| Development  | `localhost:5173`, hot reload, no auth, Hardhat mock chain | `localhost:8000`, single process, SQLite, local Redis | Whisper (2GB VRAM), LLaMA 3.1 (8GB VRAM), CPU TTS | Sepolia testnet + local faucet |
| Production   | `https://chamas.lovable.app`, CloudFront + TLS 1.3 | `https://api.chamas.app`, 4 gunicorn workers, RDS Postgres, ElastiCache Redis | Whisper TRT-LLM, LLaMA via vLLM, TTS ONNX | Sepolia (hackathon) |

See `docker-compose.yml` for the local topology mirroring this split-stack approach.

---

## 4. Fine-Tuning Strategy for Swahili ASR

Scripts live under `backend/scripts/`:

- `collect_swahili_data.py` aggregates Mozilla Common Voice, internal Kenyan Swahili, and heritage dialect datasets, normalising all audio to `16kHz`, lowercasing transcripts, and persisting to `./data/swahili_asr_dataset`.
- `finetune_whisper.py` adapts `openai/whisper-base` with frozen encoders, reporting WER to Weights & Biases and exporting artefacts to `./models/whisper-swahili-finetuned`.

Run locally (GPU recommended):

```bash
python backend/scripts/collect_swahili_data.py
python backend/scripts/finetune_whisper.py
```

---

## 5. Smart Contract Testing & Deployment

- Hardhat configuration (`hardhat.config.js`) pins Solidity `0.8.20` and wires Sepolia credentials via environment variables.
- Tests at `contracts/test/ChamaFactory.test.ts` cover creation flows, member joins, and contribution accounting, using ethers.js assertions.
- Deploy script (`contracts/scripts/deploy.ts`) outputs the final `ChamaFactory` address; propagate to `CHAMA_FACTORY_ADDRESS`.

Execute:

```bash
cd contracts
npm install
npx hardhat test
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 6. Performance Optimisation Checklist

- **Frontend:** route-based code splitting, lazy voice modules, service worker caching, WebP assets, client-side compression before upload.
- **Backend:** TensorRT-accelerated Whisper, batched LLM prompts, Redis/Postgres connection pooling, response caching for common intents.
- **Database:** composite indexes on `(session_id, timestamp)`, monthly partitioning for logs, archival pipeline for sessions older than 30 days.

---

## 7. Monitoring & Debugging

`backend/services/metrics.py` registers Prometheus counters, histograms, and gauges capturing request throughput, latency, and ASR quality. Integrate with Grafana dashboards and alert on `WER > 0.30`, `ASR latency > 2s`, or `Active sessions > 500`.

---

## 8. Security Best Practices

- Pydantic models enforce file size limits, UUID format, and MIME sniffing for audio uploads.
- SlowAPI token buckets throttle `/voice/process` to `10/min/IP`.
- Session identifiers are encrypted using Fernet (`ENCRYPTION_KEY`) before persistence.
- CORS restricts origins to `localhost` and `chamas.lovable.app`.

---

## 9. Testing Checklist

```bash
# Unit tests
pytest backend/tests/test_asr_service.py -v
pytest backend/tests/test_llm_service.py -v
pytest backend/tests/test_tts_service.py -v
pytest backend/tests/test_memory_service.py -v
npx hardhat test  # contracts

# Pipeline integration
pytest backend/tests/test_voice_pipeline.py::test_end_to_end_voice_query -v
pytest backend/tests/test_voice_pipeline.py::test_latency_benchmark -v

# Load testing
locust -f backend/tests/locustfile.py --host=http://localhost:8000
```

---

## 10. Troubleshooting Guide

| Issue | Symptom | Resolution |
|-------|---------|------------|
| OOM on GPU | `CUDA out of memory` | Reduce batch size, enable `device_map="auto"` |
| Slow ASR | Latency > 2s | Switch to Whisper `tiny`/`base`, enable TensorRT |
| Poor Swahili accuracy | WER > 30% | Fine-tune on Kenyan data, increase epochs |
| Microphone access denied | "Permission denied" | Enforce HTTPS, surface permission prompts |
| Redis timeout | Connection refused | Validate service health, expand timeouts |
| Contract deployment fails | "Insufficient funds" | Fund deployer via [sepoliafaucet.com](https://sepoliafaucet.com/) |
| WebSocket disconnects | Frequent reconnects | Exponential backoff, increase heartbeat timeout |

---

## Next Steps Checklist

1. Clone the repository.
2. Copy `env.local` (or equivalent) into `.env`, populate secrets.
3. Run `docker-compose up --build`.
4. Optionally fine-tune Whisper: `python backend/scripts/finetune_whisper.py`.
5. Deploy contracts: `npx hardhat run scripts/deploy.ts --network sepolia`.
6. Start the frontend: `npm run dev -- --host` inside `frontend/`.
7. Test end-to-end by recording a voice message in the UI.

Good luck with the hackathon! 🚀

