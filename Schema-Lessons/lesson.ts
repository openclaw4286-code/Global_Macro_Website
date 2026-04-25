import { z } from "zod";

/**
 * Worldbeat lesson schema v2.
 *
 * v1 → v2 주요 변경:
 *   1. chain.middle (단일) → chain.steps (배열, 1~3단계)
 *      다단계 인과 사슬 표현 (예: 전쟁 → 봉쇄 → 유가 → 인플레)
 *
 *   2. outcome에 impact 필드 추가 (positive/negative/neutral)
 *      한 사건 안의 수혜/피해 대조 시각화 (예: 전쟁 → 주식↓ vs 방산↑)
 *
 *   3. meta.country (필수) → meta.subject (일반화)
 *      국가뿐 아니라 기업/섹터도 트리거의 주체가 될 수 있음
 *      location은 선택 — 지도 핀은 location이 있는 경우만 표시
 *
 *   4. category에 'tech' 추가
 *      기술·산업 파괴(disruption) 카테고리. 보라색 톤.
 *
 *   5. supplements.charts (배열화)
 *      여러 차트 비교 가능. 각 차트에 caption 추가.
 */

// ─── 인과 사슬 노드 ─────────────────────────────────────
export const ChainNodeSchema = z.object({
  text: z.string().min(2).max(30),
  sub: z.string().min(1).max(20),
});

// ─── Outcome (impact 추가) ─────────────────────────────
// impact는 사용자에게 "누가 이득이고 누가 손해인지"를 색깔로 알려줍니다.
//   positive: 초록 — 수혜
//   negative: 빨강 — 피해
//   neutral:  회색 — 중립적 변화 (둘 다 아님)
export const OutcomeSchema = ChainNodeSchema.extend({
  impact: z.enum(["positive", "negative", "neutral"]),
});

// ─── 인과 사슬 (다단계 지원) ────────────────────────────
// trigger → steps[0] → steps[1] → ... → outcomes
// steps는 1~3개. 0개는 허용 안 함 (그러면 그냥 trigger → outcomes)
// 너무 길면 (4+) 다이어그램이 복잡해지고 학습 효과가 떨어집니다.
export const CausalChainSchema = z.object({
  trigger: ChainNodeSchema,
  steps: z.array(ChainNodeSchema).min(1).max(3),
  outcomes: z.array(OutcomeSchema).min(2).max(5),
});

// ─── 차트 데이터 ───────────────────────────────────────
export const ChartDataSchema = z
  .object({
    type: z.enum(["line", "bar"]),
    label: z.string(),
    /** 차트 옆에 붙을 짧은 설명 (선택). 차트가 여러 개일 때 특히 중요. */
    caption: z.string().max(120).optional(),
    xLabels: z.array(z.string()).min(2),
    values: z.array(z.number()).min(2),
  })
  .refine((d) => d.xLabels.length === d.values.length, {
    message: "xLabels와 values의 길이가 같아야 합니다",
  });

// ─── Subject (트리거의 주체) ───────────────────────────
// v1의 country 단일 필드를 일반화.
//   type='country':  국가 단위 사건 (연준 결정, 중국 부동산 등)
//   type='company':  특정 기업 사건 (Anthropic, 엔비디아 등)
//   type='sector':   산업 섹터 사건 (반도체 업계, 코코아 시장 등)
export const SubjectSchema = z.object({
  type: z.enum(["country", "company", "sector"]),
  /** 표시될 이름 (예: "미국", "Anthropic", "글로벌 코코아 산업") */
  name: z.string().min(1).max(40),
  /** 국가 코드 — country 타입일 때만 의미 있음 (지도 강조용) */
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
});

// ─── 수업 ──────────────────────────────────────────────
export const LessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),

  meta: z.object({
    subject: SubjectSchema,
    /** 지도 핀 위치 [경도, 위도]. 없으면 핀이 안 찍힘. */
    location: z
      .tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ])
      .optional(),
    category: z.enum(["policy", "trade", "commodity", "risk", "tech"]),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tags: z.array(z.string()).default([]),
  }),

  headline: z.object({
    title: z.string().min(5).max(40),
    hook: z.string().min(10).max(80),
  }),

  chain: CausalChainSchema,

  story: z.object({
    body: z.string().min(100),
    keyTakeaway: z.string().min(10).max(140),
  }),

  supplements: z
    .object({
      /** 차트 배열. 0~3개 권장. */
      charts: z.array(ChartDataSchema).max(3).default([]),
      relatedLessons: z.array(z.string()).default([]),
      sources: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .default([]),
    })
    .default({}),
});

// ─── 타입 추출 ─────────────────────────────────────────
export type Lesson = z.infer<typeof LessonSchema>;
export type ChainNode = z.infer<typeof ChainNodeSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;
export type CausalChain = z.infer<typeof CausalChainSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type Subject = z.infer<typeof SubjectSchema>;

// ─── 카테고리 색상 ─────────────────────────────────────
export const CATEGORY_COLORS: Record<Lesson["meta"]["category"], string> = {
  policy: "#378ADD",
  trade: "#1D9E75",
  commodity: "#EF9F27",
  risk: "#D85A30",
  tech: "#7F77DD", // 신규: 보라 — 기술·산업 파괴
};

export const CATEGORY_LABELS: Record<Lesson["meta"]["category"], string> = {
  policy: "금융정책",
  trade: "무역·산업",
  commodity: "원자재",
  risk: "리스크·이슈",
  tech: "기술·산업 파괴",
};

// ─── Impact 색상 ───────────────────────────────────────
// 다이어그램의 outcome 박스에 적용. 카테고리 색깔과 별개로 작동.
export const IMPACT_COLORS: Record<Outcome["impact"], string> = {
  positive: "#1D9E75", // 초록 — 수혜
  negative: "#D85A30", // 빨강 — 피해
  neutral: "#888780",  // 회색 — 중립
};

export const IMPACT_LABELS: Record<Outcome["impact"], string> = {
  positive: "수혜",
  negative: "피해",
  neutral: "중립",
};
