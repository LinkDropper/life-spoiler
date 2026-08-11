# React/Next.js 컴포넌트 규칙

React 컴포넌트나 페이지를 작성/수정할 때 참조한다.

- 서버 컴포넌트 기본 사용 (App Router)
- 클라이언트 컴포넌트는 `"use client"` 지시문 명시
- 컴포넌트는 단일 책임 원칙 준수
- Props 인터페이스는 컴포넌트와 같은 파일에 정의

```typescript
// Good
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
}

export const UserCard = ({ user, onSelect }: UserCardProps) => {
  // ...
};
```

UI 접근성/다국어(KO/EN/JA) 관련 규칙은 `.claude/rules/ui-accessibility-i18n.md`를 함께 참조한다.
