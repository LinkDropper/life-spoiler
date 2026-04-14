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

(아직 없음 — 2026-04-19 일요일 첫 실험 설계부터 추가)

## 기각된 가설 (최근 4주)

(없음)
