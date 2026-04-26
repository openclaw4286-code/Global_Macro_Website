import { Chart } from "./Chart";
import type { ChartData } from "@/schema/lesson";

// 차트 개수에 따라 반응형 그리드를 결정.
//   0개: 렌더 안 함 (호출 측에서 가드해도 되지만 안전망)
//   1개: 그리드 없이 단일 폭
//   2개: 모바일 1열 / 데스크톱(sm+) 2열
//   3개: 모바일 1열 / 태블릿(sm) 2열 / 데스크톱(lg) 3열
//
// 좁아진 폭에서 x-tick 라벨 겹침은 실제 데이터 등장 후 결정 (지금은 보류).
export function ChartGrid({ charts }: { charts: ChartData[] }) {
  if (charts.length === 0) return null;

  if (charts.length === 1) {
    return <Chart chart={charts[0]} />;
  }

  const gridClass =
    charts.length === 2
      ? "grid gap-4 sm:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={gridClass}>
      {charts.map((chart, i) => (
        <Chart key={i} chart={chart} />
      ))}
    </div>
  );
}
