# 코드 스타일 규칙

코드를 작성/수정할 때 참조한다. (네이밍, TypeScript, 함수/변수 작성, Import 순서)

## 포맷팅 (Prettier)

- 세미콜론: 사용 (`semi: true`)
- 따옴표: 쌍따옴표 (`singleQuote: false`)
- 들여쓰기: 스페이스 2칸 (`tabWidth: 2`)
- 줄 길이: 80자 (`printWidth: 80`)
- 후행 쉼표: ES5 호환 (`trailingComma: "es5"`)
- 화살표 함수 괄호: 항상 사용 (`arrowParens: "always"`)

## 네이밍 규칙

| 대상                     | 규칙             | 예시                                       |
| ------------------------ | ---------------- | ------------------------------------------- |
| 변수                     | camelCase, 명사  | `userName`, `userList`, `isLoading`        |
| 함수                     | camelCase, 동사  | `fetchData`, `createUser`, `validateInput` |
| 이벤트 핸들러 (Props)    | on + 동사        | `onClick`, `onSubmit`, `onChange`          |
| 이벤트 핸들러 (내부)     | handle + 동사    | `handleClick`, `handleSubmit`              |
| 상수                     | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL`          |
| 타입, 인터페이스, 클래스 | PascalCase       | `UserProfile`, `OAuthClient`               |
| React 컴포넌트           | PascalCase       | `UserCard`, `LoginButton`                  |
| 파일명 (일반)            | kebab-case       | `oauth-client.ts`, `types.ts`              |
| 파일명 (React 컴포넌트)  | PascalCase       | `UserCard.tsx`                             |
| 디렉토리                 | kebab-case       | `auth-provider`, `user-profile`            |

**변수와 함수 네이밍 원칙:**

- 변수는 명사로 작성: 데이터가 무엇인지 표현 (`user`, `errorMessage`, `selectedItems`)
- 함수는 동사로 시작: 어떤 동작을 하는지 표현 (`getUser`, `setName`, `handleError`)
- 이벤트 핸들러:
  - **Props로 전달되는 핸들러**: `on` 접두사 사용 (`onClick`, `onSubmit`)
  - **컴포넌트 내부 핸들러**: `handle` 접두사 사용 (`handleClick`, `handleSubmit`)

```typescript
// Good
const userName = "John"; // 명사 - 데이터
const fetchUser = () => {}; // 동사 - 동작

interface ButtonProps {
  onClick: () => void; // Props는 'on' 접두사
}

function Button({ onClick }: ButtonProps) {
  const handleClick = () => {
    console.log("Button clicked!");
    onClick();
  };

  return <button onClick={handleClick}>Click me</button>;
}

// Bad
const getName = "John"; // 동사를 변수에 사용
const user = () => {}; // 명사를 함수에 사용
const changeHandler = (e) => {}; // 접두사 컨벤션 미준수
```

## TypeScript 규칙

- `any` 타입 사용 금지 - `unknown`을 사용하고 타입 가드로 좁히기
- 명시적 반환 타입 권장 (복잡한 함수의 경우)
- `interface` vs `type`: 객체 형태는 `interface`, 유니온/인터섹션은 `type` 사용
- Non-null assertion (`!`) 사용 최소화
- 타입 추론이 명확한 경우 타입 어노테이션 생략 가능

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
}

type OAuthProvider = "google" | "kakao";

// Bad
const user: any = fetchUser();
```

## 함수 작성 규칙

- 화살표 함수 선호 (`prefer-arrow-callback`)
- 함수는 한 가지 일만 수행 (단일 책임 원칙)
- 순수 함수 선호 - 사이드 이펙트 최소화
- 조기 반환(early return) 패턴 사용

```typescript
// Good - 조기 반환
const processUser = (user: User | null): string => {
  if (!user) {
    return "Unknown";
  }
  return user.name;
};

// Bad - 중첩된 조건문
const processUser = (user: User | null): string => {
  if (user) {
    return user.name;
  } else {
    return "Unknown";
  }
};
```

## 변수 선언

- `const` 우선 사용 (`prefer-const`)
- `var` 사용 금지 (`no-var`)
- 구조 분해 할당 사용 (`prefer-destructuring`)
- 템플릿 리터럴 사용 (`prefer-template`)

```typescript
// Good
const { id, name } = user;
const message = `Hello, ${name}!`;

// Bad
var id = user.id;
const message = "Hello, " + name + "!";
```

## Import 규칙

- 경로 별칭 사용: `@/*` (프로젝트 루트 기준)
- import 순서:
  1. 외부 패키지 (react, next, etc.)
  2. 내부 모듈 (@/libs, @/components)
  3. 상대 경로 (./types, ../utils)
- **import 그룹 사이에는 빈 줄 추가**
- 타입 import는 `import type` 구문으로 값 import와 분리

```typescript
// Good
import { z } from "zod/v4";

import { OAuthError } from "./errors";
import { OAuthTokenResponseSchema } from "./types";
import type { OAuthClient, OAuthProvider } from "./types";
```
