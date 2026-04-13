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

캠페인명은 `{날짜}-{주제}` 형식:

```
2026-04-weekly-fortune
2026-04-ziwei-intro
2026-04-compatibility-share
```

## 예시

```
https://life-spoiler.com?utm_source=x&utm_medium=social&utm_campaign=2026-04-ziwei-intro
```
