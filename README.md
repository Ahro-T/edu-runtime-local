# edu-runtime

AI 기반 학습 관리 시스템. Discord를 통해 학습자가 지식 노드를 탐색하고, AI가 구조화된 루브릭으로 평가합니다.

## 빠른 시작

### 1. 환경 설정

```bash
./scripts/setup-dev.sh
```

대화형으로 `.env`를 생성합니다. 아래 항목을 입력합니다:

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `LLM_URL` | LLM 서버 주소 | `http://ollama:11434` |
| `LLM_MODEL` | 사용할 모델 | `gemma4:e2b` |
| `OPENCLAW_DISCORD_TOKEN` | Discord 봇 토큰 | 빈 값 |
| `OPENCLAW_DISCORD_GUILD_ID` | Discord 서버 ID | 빈 값 |
| `LOG_LEVEL` | 로그 레벨 | `info` |

### 2. Discord 봇 설정

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 봇 생성
2. **Bot > Privileged Gateway Intents** 에서 3개 모두 활성화:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
3. 봇을 서버에 초대:
   ```
   https://discord.com/oauth2/authorize?client_id=<BOT_CLIENT_ID>&scope=bot&permissions=277025770560
   ```
4. `.env`에 토큰과 서버 ID 입력

### 3. OpenClaw 내부 설정

컨테이너 시작 후, OpenClaw 내부 설정을 해야 합니다:

```bash
sudo podman exec edu-runtime_openclaw_1 sh -c 'cat > /home/openclaw/.openclaw/openclaw.json << EOF
{
  "agents": {
    "defaults": {
      "model": { "primary": "ollama/gemma4:e2b" }
    }
  },
  "models": {
    "mode": "replace",
    "providers": {
      "ollama": {
        "baseUrl": "http://ollama:11434",
        "api": "openai-completions",
        "apiKey": "EMPTY",
        "models": [
          {
            "id": "gemma4:e2b",
            "name": "Gemma 4 E2B",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 131072,
            "maxTokens": 4096
          }
        ]
      }
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "token": "<DISCORD_BOT_TOKEN>"
    }
  }
}
EOF'
```

> `gateway.auth.token`은 첫 실행 시 자동 생성됩니다. `sudo podman exec edu-runtime_openclaw_1 cat /home/openclaw/.openclaw/openclaw.json`으로 확인하세요.

### 4. 실행

```bash
# 로컬 모드 (Ollama + Gemma 4 E2B, GPU 필요)
CONTAINER_RUNTIME=podman ./scripts/start.sh local

# 리모트 모드 (외부 Ollama 서버)
CONTAINER_RUNTIME=podman ./scripts/start.sh remote

# 둘 다 동시 실행 가능 (포트 분리)
```

| | 로컬 모드 | 리모트 모드 |
|---|---|---|
| API | :3000 | :3001 |
| PostgreSQL | :5432 | :5433 |
| OpenClaw | :18789 | :18790 |
| LLM | Ollama (:11434) | 외부 Ollama |

### 5. 중지 / 정리

```bash
# 중지 (데이터 보존)
CONTAINER_RUNTIME=podman ./scripts/stop.sh          # 전부
CONTAINER_RUNTIME=podman ./scripts/stop.sh local     # 로컬만
CONTAINER_RUNTIME=podman ./scripts/stop.sh remote    # 리모트만

# 완전 삭제 (모든 데이터 + 프로젝트 삭제)
CONTAINER_RUNTIME=podman ./scripts/cleanup.sh
```

## NUC 배포 (democlaw + RTX 3070)

별도 NUC에 democlaw(llama.cpp + OpenClaw)와 함께 배포:

```bash
git clone https://github.com/Ahro-T/edu-runtime-local.git
cd edu-runtime-local
./scripts/setup-nuc.sh
```

`setup-nuc.sh`가 자동으로:
1. democlaw 클론 (llama.cpp + Gemma 4 E4B GGUF)
2. LLM 서버 시작 (첫 실행 시 ~5.7GB 모델 다운로드)
3. edu-runtime (app + postgres) 시작
4. 헬스체크 후 URL 출력

```
NUC 아키텍처:
  democlaw (외부)          edu-runtime (내부)
  ┌─────────────┐         ┌──────────────┐
  │ llama.cpp   │◄────────│ App (Fastify)│
  │ Gemma 4 E4B │ LLM API │              │
  │ :8000       │         │ :3000        │
  ├─────────────┤         ├──────────────┤
  │ OpenClaw    │         │ PostgreSQL   │
  │ :18789      │         │ :5432        │
  └─────────────┘         └──────────────┘
      democlaw-net (공유 네트워크)
```

수동 시작/정지:
```bash
./scripts/start.sh democlaw    # edu-runtime만 시작 (democlaw 이미 실행 중일 때)
./scripts/stop.sh democlaw     # edu-runtime만 정지 (democlaw 유지)
```

## 개발

```bash
npm run build          # TypeScript 컴파일
npm run dev            # 파일 변경 시 자동 재시작
npm test               # 테스트 (Vitest + Testcontainers)
npm run migrate        # DB 마이그레이션
```

## 아키텍처

```
Discord 학습자 → OpenClaw (봇) → App (Fastify API) → PostgreSQL
                                                    → Ollama Gemma 4 (AI 채점)
                                                    → wiki-vault (콘텐츠)

Curriculum Agent (cron) → vault → wiki-vault (6시간마다 인덱스 재생성)
```

- **Hexagonal Architecture**: Domain → Ports → Adapters
- **DI**: `composition-root.ts`에서 모든 의존성 조립
- **Graceful Degradation**: LLM 불가 시 제출 저장, 복구 후 재평가

## 커리큘럼 (3개 필러, 23개 노드)

| 필러 | 노드 수 | 주요 주제 |
|------|---------|----------|
| agents | 9 | core loop, tool use, planning, ReAct, reflection, memory, multi-agent, architectures, prompt chaining |
| harnesses | 7 | orchestration, tool registry, eval loop, benchmarks, guardrails, observability, sandboxing |
| foundations | 4 | chain-of-thought, function calling, structured output, RAG |
| openclaw | 3 | plugin model, discord gateway, runtime |
