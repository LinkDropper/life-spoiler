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

- 상태: rejected (실험 무효)
- 생성일: 2026-04-19
- 종료일: 2026-05-03
- 가정: MBTI·사주와 자미두수를 수치/특성으로 비교하는 포맷이 순수 지식형(개념 설명) 대비 activeUsers/post +20% 이상 기여
- 근거: 4/13 MBTI vs 자미두수 비교형 첫 발행 당일 59명 기록 — 마케팅 시작 직후 즉각 반응. 같은 날 지식형 탐랑성 포스트 대비 체감 반응 높음 (n=1, 검증 필요)
- 검증 방법: variant A(비교형) 2건(화 T3, 목 T3), variant B(지식형) 2건(수 T2, 금 T6). utm_campaign=exp-202617-01-comparison vs exp-202617-01-knowledge
- 성공 기준: variant A activeUsers/post이 통제군(최근 4주 일반 포스트 평균 약 57명/일) 대비 +20% 이상
- 결과: **실험 무효** — 2026-04-21 계정 정지로 슬롯 4개 중 1개만 발행. UTM 추적 미작동으로 activeUsers 측정 불가. **가설 유효성 판단 불가 — Phase 3 진입 후 재실험 후보**

### [exp-202618-01] 호명형 도입부가 일반 진술형보다 url_clicks 높음

- 상태: pending
- 생성일: 2026-04-20
- 가정: 도입부 첫 줄에서 특정 페르소나를 호명("~한 분들 있죠")하는 포맷이 일반 진술형 대비 url_clicks/post +30% 이상
- 근거: 4/13~17 16건 중 호명형 도입부 4건이 평균 impressions 51 vs 일반 진술형 평균 39 (n 작음, 인용 클릭은 GA4 UTM 미작동으로 미측정). 도입부의 인격 호명은 X 알고리즘 reply 트리거에도 유리한 가설
- 검증 방법: variant A(호명형) 2건(예: "월급은 잘 모으는데 투자만 하면 마이너스인 분들"), variant B(진술형) 2건(예: "재물궁 천기성 분포는 ~"). 동일 시간대(T5) 4일 분산. utm_campaign=exp-202618-01-persona vs exp-202618-01-statement
- 성공 기준: variant A의 (url_clicks + activeUsers) 합산 지표가 variant B 대비 +30% 이상

### [exp-202618-02] 황금연휴 시즌 연결 콘텐츠가 일반 주제보다 activeUsers 기여 높음

- 상태: pending
- 생성일: 2026-04-20
- 가정: 황금연휴(4/30~5/6) 직전 주에 연휴 관련 자미두수 콘텐츠(천이궁/복덕궁/부처궁)가 일반 주제 대비 activeUsers/post +30% 이상
- 근거: 4/16 봄철 트렌드(질액궁) 포스트가 주간 최고 67명 기록 — 시즌·계절 연결 가설의 첫 강한 신호. 황금연휴는 검색 피크 시즌이라 효과 증폭 기대
- 검증 방법: variant A(황금연휴 테마) 3건(4/27 T3, 4/29 T5, 4/29 T6), variant B(일반 자미두수) 3건(같은 주 다른 슬롯). utm_campaign=exp-202618-02-holiday vs exp-202618-02-general
- 성공 기준: variant A activeUsers/post이 variant B 대비 +30% 이상. UTM 추적 수정 선행 필수

### [exp-202618-03] 본문 길이 220~280자가 100~180자보다 engagement 높음

- 상태: pending
- 생성일: 2026-04-20
- 가정: X 포스트 본문 220~280자(상한 근접)가 100~180자(중단 길이) 대비 평균 impressions +20% 이상, 좋아요/RT 합산 +50% 이상
- 근거: 메모리 피드백 "짧고 판에 박힌 포스트 → engagement 0". 4/13~17 데이터에서 길이 변수 통제 안 됨. 280자 한도까지 활용 시 정보 밀도와 공감 깊이 모두 확보 가능 가설
- 검증 방법: variant A(220~280자) 3건, variant B(100~180자) 3건. 같은 콘텐츠 유형(공감형) + 같은 시간대(T5)로 통제. utm_campaign=exp-202618-03-long vs exp-202618-03-short
- 성공 기준: variant A의 평균 impressions +20% AND (likes + RT) 합산 +50% 이상

### [exp-202618-04] 도입부 구체 숫자 사용이 일반 표현보다 impressions 높음

- 상태: pending
- 생성일: 2026-04-20
- 가정: 도입부 첫 문장에 구체 숫자(나이/년수/비율)가 포함된 포스트가 일반 표현 대비 impressions +30% 이상
- 근거: 4/14 "대운 10년 주기" 콘셉트는 발행 실패로 검증 불가. 4/13 "16칸 vs 수십만 조합" (MBTI 비교) impressions 117로 상위. 숫자가 호기심 stop 효과 유발하는 보편 카피라이팅 원리
- 검증 방법: variant A(숫자 포함) 3건(예: "10년 단위", "12궁 중 3곳"), variant B(일반 표현) 3건. T3 4일 분산. utm_campaign=exp-202618-04-number vs exp-202618-04-text
- 성공 기준: variant A impressions +30% 이상

## 기각된 가설 (최근 4주)

(없음)

## 운영 메모

- 2026-04-20 (월): 백로그에 pending 가설 4개 추가. 다음 주(W18, 4/27~5/3)는 황금연휴 주간이라 exp-202618-02(시즌 연결) 우선 선정 검토.
- 트렌드 감지(naver-trends.js)는 GitHub Actions 런너에서만 실행 가능 → 이번 주 내 weekly-metrics dispatch로 키워드 풀 확보 필요.
- UTM 추적 미작동 상태에서는 exp-202618-02·-04 평가 신뢰도 낮음 → 풀스택 개발자 이슈 해결 우선.
