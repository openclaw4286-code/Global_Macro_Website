# macromap

매크로경제 사건이 어떻게 시장과 일상으로 번지는지를 한 사건씩 따라가는 학습 사이트.

각 lesson은 trigger → 1~3단계 과정 → 2~5개 결과의 인과 사슬로 시각화되고, 결과는 수혜·피해·중립으로 색 분류됩니다. 본문은 사건 사실 + 거시경제 원리 + 한국적 함의 3단락 구조.

## 폴더 구조

```
.
├── lessons/                     # 발행된 lesson JSON (스키마 v2)
├── schema/lesson.ts             # Zod 스키마 + 타입 + 색상 상수 (진실의 원천)
├── scripts/validate-lessons.ts  # 빌드 게이트로 작동하는 검증 스크립트
├── components/                  # CausalChain, Chart, ChartGrid, LessonCard 등
├── lib/lessons.ts               # JSON 로더 (LessonSchema.parse, 모듈 캐시)
├── app/                         # Next.js 14 App Router (/, /lessons/[id])
├── prompts/                     # 운영용 프롬프트 (A·B·C)
├── 908-doha-ui/                 # 디자인 시스템 (토큰·폰트만 사용)
├── WRITING-GUIDE.md             # 매주 발행 워크플로우
└── MIGRATION.md                 # 스키마 v1 → v2 변경 사유
```

## 로컬 실행

```bash
npm install
npm run validate   # 모든 lessons/*.json을 LessonSchema로 검증
npm run dev        # http://localhost:3000
npm run build      # validate를 거친 후 정적 빌드
```

`build`는 `validate && next build` 순서로 실행되므로, 검증 실패 시 빌드가 막힙니다.

## 운영 도구

매주 lesson을 발행하는 워크플로우와 도구:

- [`WRITING-GUIDE.md`](./WRITING-GUIDE.md) — 발행 주기, 매주 체크리스트, 함정 7가지
- [`prompts/`](./prompts/) — 사건 발견·초안 작성·교차 검증 프롬프트 3종 + 사용 철학

신규 lesson 발행 흐름:
1. `prompts/A-event-discovery.md`로 후보 사건 결정
2. `prompts/B-lesson-draft.md`로 초안 생성, 사실·인과·톤 검수
3. `lessons/{date-slug}.json`에 추가
4. `npm run validate` 통과 확인 후 push → Vercel 자동 배포

## 배포

`main`에 머지되면 Vercel이 자동 빌드·배포합니다. 빌드 단계에서 `npm run validate`가 실행되므로 잘못된 lesson JSON은 production에 도달하지 못합니다.

## 라이선스

코드: MIT (`LICENSE`)
디자인 토큰·Pretendard 폰트: 908-doha-ui 번들 라이선스에 따름 (`908-doha-ui/README.md`)
