---
description: 콘텐츠 발행 승인 프로세스 - 모든 포스트는 승인 후 발행
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# 포스트 승인 규칙

## 원칙

**모든 콘텐츠는 사용자의 최종 승인 후에만 발행한다.**

## 승인 프로세스

### 1. 초안 작성

콘텐츠 라이터 또는 소셜 미디어 마케터가 초안을 작성한다.
- social-tracker.csv에 status=draft로 기록
- 초안 내용을 `docs/posts/drafts/` 에 저장

### 2. 에이전트 팀 리뷰

CMO가 다른 마케팅 에이전트들에게 리뷰를 요청한다.
모든 마케터(콘텐츠 라이터, 소셜 미디어 마케터, 성과 분석가)가 다음을 검토:

- 브랜드 보이스 준수 여부
- 금지 표현 포함 여부
- UTM 파라미터 정확성
- 콘텐츠 품질 및 정확성
- 중복 여부

### 3. 승인 기준

**에이전트 전원 동의 시 자동 발행.**

하나라도 반대가 있으면:
1. 반대 사유를 명시
2. 수정 후 재리뷰
3. 전원 동의 시 발행

### 4. 발행

전원 승인 완료 시:
1. social-tracker.csv status를 approved로 변경
2. 자동 발행 스크립트 실행 (X API)
3. 발행 후 status를 posted로 변경
4. Discord에 발행 알림

## 승인 기록

초안 파일에 승인 이력을 남긴다:

```markdown
## 승인
- content-writer: approved
- social-media-marketer: approved
- performance-analyst: approved
- cmo: approved -> 발행
```
