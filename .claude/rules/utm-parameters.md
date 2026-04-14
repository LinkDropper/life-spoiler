---
description: UTM 파라미터 규칙 - 모든 외부 링크에 적용
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# UTM 파라미터 규칙

## 형식

모든 인생스포 링크에는 UTM 파라미터를 반드시 포함한다.

```
https://life-spoiler.com?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}
```

## 값 규칙

- 모두 **소문자**
- 단어 구분은 **하이픈(-)** 사용
- 공백, 언더스코어 금지

## source 값

| 플랫폼 | utm_source |
|--------|-----------|
| X (Twitter) | x |
| 브런치 | brunch |
| 인스타그램 | instagram |
| Discord | discord |

## medium 값

| 유형 | utm_medium |
|------|-----------|
| 소셜 미디어 포스트 | social |
| 블로그 본문 링크 | blog |
| 프로필 링크 | profile |

## campaign 값

일반 포스트의 캠페인명은 `{날짜}-{주제}` 형식:

```
2026-04-weekly-fortune
2026-04-ziwei-intro
2026-04-compatibility-share
```

**실험 포스트**는 `exp-{실험ID}-{variant}` 형식:

```
exp-202617-01-question
exp-202617-01-cta
```

- 실험ID: `{ISO연도주}-{순번2자리}` (예: `202617-01` = 2026년 17주차 1번 실험)
- variant: 영문 소문자 하이픈만 (예: `question`, `cta`, `emoji`, `no-emoji`)
- 실험 프레임워크 상세: `docs/strategy/experiment-framework.md`
- 실험 포스트는 `learned-playbook.md` 전술을 따르지 않아도 됨 (가설 검증이 목적)

## 예시

```
https://life-spoiler.com?utm_source=x&utm_medium=social&utm_campaign=2026-04-ziwei-intro
https://life-spoiler.com?utm_source=x&utm_medium=social&utm_campaign=exp-202617-01-question
```
