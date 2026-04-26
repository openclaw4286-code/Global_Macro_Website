// 메인 페이지 세계 지도 — 서버 컴포넌트, 0 client JS.
// d3-geo Equal Earth projection으로 GeoJSON → SVG path 변환을 빌드 시 수행.
// world-atlas의 110m TopoJSON을 fs 없이 import (Next.js가 JSON 모듈로 처리).

import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import countriesData from "world-atlas/countries-110m.json";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Lesson,
} from "@/schema/lesson";

const VIEW_W = 800;
const VIEW_H = 400;
const PIN_R = 6;
const PIN_RING = 2;
const HIT_R = 14;        // 모바일 터치/포인터 hit 영역 반경 (투명)
const LABEL_OFFSET = 10; // 핀 ↔ 라벨 거리

// 한 번만 빌드 시 변환. module scope에서 실행됨.
const fc = feature(
  countriesData as unknown as Parameters<typeof feature>[0],
  // @ts-expect-error — runtime accepts string key; d3 types want object reference
  countriesData.objects.countries
) as unknown as FeatureCollection<Geometry, { name: string }>;

// 동아시아 중심: 경도 127.5° (한반도 중앙) 으로 회전한 뒤 Sphere에 fit.
// rotate 후 fitSize 호출 순서가 중요 — rotate 먼저 적용해야 회전된 sphere에 맞는 scale·translate가 계산됨.
const projection = geoEqualEarth()
  .rotate([-127.5, 0])
  .fitSize([VIEW_W, VIEW_H], { type: "Sphere" });
const path = geoPath(projection);
const sphereD = path({ type: "Sphere" }) ?? "";
const countryDs = fc.features.map((f) => path(f) ?? "").filter(Boolean);

type Pin = {
  id: string;
  cx: number;
  cy: number;
  color: string;
  label: string;
  category: string;
  labelOnLeft: boolean;
};

function projectPins(lessons: Lesson[]): Pin[] {
  // 같은 지역에 lesson 다수 등장 시 jitter 또는 클러스터링 필요.
  // 현재 4 lesson 규모에서는 미해당.
  const out: Pin[] = [];
  for (const l of lessons) {
    if (!l.meta.location) continue;
    const pt = projection(l.meta.location);
    if (!pt) continue;
    const [cx, cy] = pt;
    out.push({
      id: l.id,
      cx,
      cy,
      color: CATEGORY_COLORS[l.meta.category],
      label: l.headline.title,
      category: CATEGORY_LABELS[l.meta.category],
      // 라벨이 우측 컨테이너 경계 침범 막기 위해 임계값 0.6×W (=480).
      // 동아시아 중심(rotate −127.5°) 기준: Anthropic(620)만 좌측 flip 대상.
      labelOnLeft: cx > VIEW_W * 0.6,
    });
  }
  return out;
}

export function WorldMap({ lessons }: { lessons: Lesson[] }) {
  const pins = projectPins(lessons);
  const ariaLabel = `세계 지도 — ${pins.length}개 lesson의 사건 발생 위치`;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* sphere 윤곽 (지구의 가장자리) */}
      <path
        d={sphereD}
        fill="var(--surface)"
        stroke="var(--border-line)"
        strokeWidth={0.5}
      />
      {/* 국가 채움 */}
      <g>
        {countryDs.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="var(--surface-sunken)"
            stroke="var(--border-line)"
            strokeWidth={0.5}
          />
        ))}
      </g>
      {/* 핀 + hover 라벨 */}
      <g>
        {pins.map((p) => {
          const labelX = p.labelOnLeft
            ? p.cx - PIN_R - LABEL_OFFSET
            : p.cx + PIN_R + LABEL_OFFSET;
          const anchor = p.labelOnLeft ? "end" : "start";
          return (
            <a
              key={p.id}
              href={`/lessons/${p.id}`}
              aria-label={`${p.category}: ${p.label}`}
              className="group"
            >
              {/* 투명한 큰 hit 영역 — 모바일 터치 타깃 보강 */}
              <circle cx={p.cx} cy={p.cy} r={HIT_R} fill="transparent" />
              {/* 보이는 핀 */}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={PIN_R}
                fill={p.color}
                stroke="var(--surface)"
                strokeWidth={PIN_RING}
              />
              {/* hover 시 나타나는 제목.
                  halo: stroke-width 3px (paint-order=stroke로 stroke 먼저 그림).
                  가독성 이슈 시 4~5px로 키우거나 배경 rect 추가 검토. */}
              <text
                x={labelX}
                y={p.cy}
                fontSize={11}
                fontWeight={500}
                fill="var(--text-primary)"
                stroke="var(--surface)"
                strokeWidth={3}
                paintOrder="stroke"
                textAnchor={anchor}
                dominantBaseline="middle"
                pointerEvents="none"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                {p.label}
              </text>
            </a>
          );
        })}
      </g>
    </svg>
  );
}
