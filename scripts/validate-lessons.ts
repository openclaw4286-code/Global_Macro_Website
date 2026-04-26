/**
 * 모든 lessons/*.json 파일을 LessonSchema (v2)로 검증합니다.
 *
 * 사용법:  npx tsx scripts/validate-lessons.ts
 * 한 파일이라도 실패하면 exit code 1로 종료합니다.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LessonSchema } from "../schema/lesson";

const LESSONS_DIR = join(__dirname, "..", "lessons");

const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.log("lessons/ 폴더에 JSON 파일이 없습니다.");
  process.exit(0);
}

let hasError = false;
const ids = new Set<string>();

for (const file of files) {
  const path = join(LESSONS_DIR, file);
  let raw: unknown;

  try {
    raw = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    console.error(`✗ ${file} — JSON 파싱 실패: ${(e as Error).message}`);
    hasError = true;
    continue;
  }

  const result = LessonSchema.safeParse(raw);

  if (!result.success) {
    console.error(`✗ ${file}`);
    for (const issue of result.error.issues) {
      console.error(`    ${issue.path.join(".")}: ${issue.message}`);
    }
    hasError = true;
    continue;
  }

  if (ids.has(result.data.id)) {
    console.error(`✗ ${file} — id "${result.data.id}"가 중복됩니다`);
    hasError = true;
    continue;
  }
  ids.add(result.data.id);

  const expectedFilename = `${result.data.id}.json`;
  if (file !== expectedFilename) {
    console.warn(`⚠ ${file} — 파일명이 id와 다릅니다 (예상: ${expectedFilename})`);
  }

  // v2 추가 검증: outcome impact 분포 체크
  // 모든 outcome이 같은 impact면 "대조 구조"가 의미 없음 → 경고
  const impacts = new Set(result.data.chain.outcomes.map((o) => o.impact));
  if (impacts.size === 1 && result.data.chain.outcomes.length >= 3) {
    const only = [...impacts][0];
    console.warn(
      `⚠ ${file} — 모든 outcome이 '${only}'입니다. 수혜/피해 대조가 약합니다.`
    );
  }

  console.log(`✓ ${file}`);
}

console.log("");

if (hasError) {
  console.error(`검증 실패. 위 오류를 확인하세요.`);
  process.exit(1);
}

console.log(`${files.length}개 파일 모두 통과.`);
