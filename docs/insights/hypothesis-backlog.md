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

- 상태: rejected
- 생성일: 2026-04-19
- 가정: MBTI·사주와 자미두수를 수치/특성으로 비교하는 포맷이 순수 지식형(개념 설명) 대비 activeUsers/post +20% 이상 기여
- 근거: 4/13 MBTI vs 자미두수 비교형 첫 발행 당일 59명 기록 — 마케팅 시작 직후 즉각 반응. 같은 날 지식형 탐랑성 포스트 대비 체감 반응 높음 (n=1, 검증 필요)
- 검증 방법: variant A(비교형) 2건(화 T3, 목 T3), variant B(지식형) 2건(수 T2, 금 T6). utm_campaign=exp-202617-01-comparison vs exp-202617-01-knowledge
- 성공 기준: variant A activeUsers/post이 통제군(최근 4주 일반 포스트 평균 약 57명/일) 대비 +20% 이상
- 결과: **기각** — knowledge variant 미실행, eval_date(2026-04-26) +49일 초과, GA4 데이터 미수집. 재설계 후 재시도 가능 (4주 내 동일 가설 재생성 금지: ~2026-07-12)

### [exp-202618-01] 호명형 도입부가 일반 진술형보다 url_clicks 높음

- 상태: pending
- 생성일: 2026-04-20
- 가정: 도입부 첫 줄에서 특정 페르소나를 호명("~한 분들 있죠")하는 포맷이 일반 진술형 대비 url_clicks/post +30% 이상
- 근거: 4/13~17 16건 중 호명형 도입부 4건이 평균 impressions 51 vs 일반 진술형 평균 39 (n 작음, 인용 클릭은 GA4 UTM 미작동으로 미측정). 도입부의 인격 호명은 X 알고리즘 reply 트리거에도 유리한 가설
- 검증 방법: variant A(호명형) 2건(예: "월급은 잘 모으는데 투자만 하면 마이너스인 분들"), variant B(진술형) 2건(예: "재물궁 천기성 분포는 ~"). 동일 시간대(T5) 4일 분산. utm_campaign=exp-202618-01-persona vs exp-202618-01-statement
- 성공 기준: variant A의 (url_clicks + activeUsers) 합산 지표가 variant B 대비 +30% 이상

### [exp-202618-02] 황금연휴 시즌 연결 콘텐츠가 일반 주제보다 activeUsers 기여 높음

- 상태: rejected
- 생성일: 2026-04-20
- 가정: 황금연휴(4/30~5/6) 직전 주에 연휴 관련 자미두수 콘텐츠(천이궁/복덕궁/부처궁)가 일반 주제 대비 activeUsers/post +30% 이상
- 근거: 4/16 봄철 트렌드(질액궁) 포스트가 주간 최고 67명 기록 — 시즌·계절 연결 가설의 첫 강한 신호. 황금연휴는 검색 피크 시즌이라 효과 증폭 기대
- 검증 방법: variant A(황금연휴 테마) 3건(4/27 T3, 4/29 T5, 4/29 T6), variant B(일반 자미두수) 3건(같은 주 다른 슬롯). utm_campaign=exp-202618-02-holiday vs exp-202618-02-general
- 성공 기준: variant A activeUsers/post이 variant B 대비 +30% 이상. UTM 추적 수정 선행 필수
- 결과: **기각** — 황금연휴(4/30~5/6) 시즌 종료로 실험 기간 자동 만료. GITHUB_PAT 만료로 발행 불가 상태에서 시즌 경과. 시즌성 콘텐츠 효과 검증은 exp-202624-01로 대체 가설 수립. (4주 내 동일 가설 재생성 금지: ~2026-07-12)

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

### [exp-202624-01] 여름/상반기 전환기 시즌 콘텐츠가 일반 주제보다 activeUsers 기여 높음

- 상태: pending
- 생성일: 2026-06-14
- 가정: 6~7월 여름 돌입 + 상반기 마무리 시즌(회고/방향 재설정)에 연결된 자미두수 콘텐츠(복덕궁/관록궁/재백궁 '중간 점검' 테마)가 일반 주제 대비 activeUsers/post +20% 이상
- 근거: 4/16 봄철 계절 연결 포스트(질액궁)가 당시 일별 최고 67명 기록. 상위 포스트 패턴 P-002에서 계절/맥락 도입부가 +82% 효과 확인. 6~7월은 연중 자기 성찰 검색 피크 가능성 높음.
- 검증 방법: variant A(여름/상반기 마무리 테마) 3건(복덕궁·관록궁·재백궁), variant B(일반 자미두수 개념) 3건. 동일 슬롯(T5) 분산. utm_campaign=exp-202624-01-season vs exp-202624-01-general
- 성공 기준: variant A activeUsers/post이 variant B 대비 +20% 이상 (GA4 UTM 추적 복구 선행 필수)
- 주의: 계절성 보정 미구현. 가설 평가 시 marketing-insights.md에 "계절성 의심" 태그 병기.

### [exp-202624-02] 금요일 T5/T6 슬롯이 평일 동일 슬롯 대비 impressions 높음

- 상태: pending
- 생성일: 2026-06-14
- 가정: 금요일 T5 슬롯 발행 포스트가 화~목 T5 발행 포스트 대비 impressions +30% 이상
- 근거: 4/17(금) T5 교우궁 관계형 104 impressions — 전체 20건 중 비-운세 포스트 최고 성과. 금요일 저녁 SNS 사용 패턴(주말 준비, 관계 에너지 분출) 가설과 일치. 4/17 T5·T6 3건 모두 상위 10건 진입.
- 검증 방법: variant A(금요일 T5/T6 관계형) 4건(2주), variant B(화~목 T5 관계형) 4건. 주제·길이·도입부 유사하게 통제. utm_campaign=exp-202624-02-fri vs exp-202624-02-weekday
- 성공 기준: variant A 평균 impressions이 variant B 대비 +30% 이상

### [exp-202624-03] 서비스 성장 지표 공개 포스트가 일반 교육 포스트보다 engagement 높음

- 상태: pending
- 생성일: 2026-06-14
- 가정: "인생스포 사용자 N명 돌파" 등 서비스 실제 성장 데이터를 공유하는 포스트가 자미두수 개념 설명 포스트 대비 likes+RT+replies 합산 +50% 이상
- 근거: 2026-06-11 "벌써 약 8천명이 사용해주신 인생스포" 포스트가 11 impressions / 2 likes / 1 RT — 동기간 일반 포스트 대비 engagement 비율(likes/impressions) 약 18% vs 평균 4%. 팔로워가 서비스 성장에 공감적 반응 보인 첫 신호.
- 검증 방법: variant A(서비스 성장/마일스톤 공개) 2건, variant B(자미두수 지식형) 2건. 동일 시간대(T5). utm_campaign=exp-202624-03-milestone vs exp-202624-03-edu
- 성공 기준: variant A (likes+RT+replies)/impressions 비율이 variant B 대비 +50% 이상

## 기각된 가설 (최근 4주)

### [exp-202617-01] 비교형 vs 지식형 — 기각 (2026-06-14)
- 사유: knowledge variant 미실행 + eval_date 49일 초과 + GA4 미수집
- 재시도 가능일: 2026-07-12 이후

### [exp-202618-02] 황금연휴 시즌 연결 — 기각 (2026-06-14)
- 사유: 시즌(4/30~5/6) 종료 후 PAT 만료로 실험 불가
- 재시도 가능일: 2026-07-12 이후 (대체 가설: exp-202624-01)

## 운영 메모

- 2026-04-20 (월): 백로그에 pending 가설 4개 추가. 다음 주(W18, 4/27~5/3)는 황금연휴 주간이라 exp-202618-02(시즌 연결) 우선 선정 검토.
- 트렌드 감지(naver-trends.js)는 GitHub Actions 런너에서만 실행 가능 → 이번 주 내 weekly-metrics dispatch로 키워드 풀 확보 필요.
- UTM 추적 미작동 상태에서는 exp-202618-02·-04 평가 신뢰도 낮음 → 풀스택 개발자 이슈 해결 우선.
- 2026-06-14 (일): GITHUB_PAT 만료로 2026-05-22 이후 발행/GA4/X 메트릭 전면 중단. PAT 갱신이 모든 실험 실행의 전제 조건. 갱신 즉시 exp-202618-01(호명형) + exp-202618-03(긴 본문) 우선 실행 권장.
