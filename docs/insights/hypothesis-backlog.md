# 가설 백로그

CMO가 관리하는 마케팅 가설 풀. 매주 일요일 T6에 갱신.

## 상태

- **pending**: 제안됨, 아직 실험 배정 안 됨
- **running**: 이번 주 실험 중
- **validated**: 검증됨 → `learned-playbook.md`에 전술로 반영됨
- **rejected**: 기각됨
- **observing**: 추가 관찰 필요 (1~2주 연장)

## 형식

```markdown
### [exp-YYYYWW-NN] 제목

- 상태: pending | running | validated | rejected | observing
- 생성일: YYYY-MM-DD
- 가정: 한 줄 설명
- 근거: 최근 데이터 기반 논리
- 검증 방법: 실험 설계 (variant, 샘플 크기, utm_campaign)
- 성공 기준: variant가 통제군 대비 activeUsers/post +20% 이상
- 결과 (평가 후 기입): 채택/기각/관찰 + 실측 수치
```

---

## 활성 가설

### [exp-202617-01] 비교형 포맷이 지식형보다 activeUsers 기여 높음

- 상태: running
- 생성일: 2026-04-19
- 가정: MBTI·사주와 자미두수를 수치/특성으로 비교하는 포맷이 순수 지식형(개념 설명) 대비 activeUsers/post +20% 이상 기여
- 근거: 4/13 MBTI vs 자미두수 비교형 첫 발행 당일 59명 기록 — 마케팅 시작 직후 즉각 반응. 같은 날 지식형 탐랑성 포스트 대비 체감 반응 높음 (n=1, 검증 필요)
- 검증 방법: variant A(비교형) 2건(화 T3, 목 T3), variant B(지식형) 2건(수 T2, 금 T6). utm_campaign=exp-202617-01-comparison vs exp-202617-01-knowledge
- 성공 기준: variant A activeUsers/post이 통제군(최근 4주 일반 포스트 평균 약 57명/일) 대비 +20% 이상
- 결과 (평가 후 기입): —

## 기각된 가설 (최근 4주)

(없음)
