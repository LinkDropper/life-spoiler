---
description: 소셜 미디어 활동 기록 규칙 - 소셜 미디어 마케터가 모든 활동을 CSV로 기록
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# 소셜 미디어 트래커 규칙

## 파일 위치

`docs/social-tracker.csv`

## CSV 형식

```csv
date,time,platform,type,content_summary,url,status,engagement_notes
```

## 필드 정의

| 필드 | 설명 | 예시 |
|------|------|------|
| date | YYYY-MM-DD | 2026-04-14 |
| time | HH:MM (KST) | 18:30 |
| platform | x / brunch / instagram | x |
| type | post / reply / thread / blog | post |
| content_summary | 50자 이내 요약 | 자미두수 재물궁 설명 트윗 |
| url | 발행된 콘텐츠 URL (없으면 빈칸) | |
| status | posted / draft / scheduled / failed | posted |
| engagement_notes | 반응 메모 (나중에 성과 분석가가 업데이트) | |

## 규칙

1. 콘텐츠를 발행할 때마다 **반드시** 한 행을 추가한다
2. 실패한 경우에도 status=failed로 기록한다
3. 같은 콘텐츠를 여러 플랫폼에 올리면 플랫폼별로 각각 기록한다
4. 중복 발행 금지 — 기록 전 기존 항목을 확인하여 같은 내용이 이미 posted인지 체크
