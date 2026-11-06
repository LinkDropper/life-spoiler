"use client";

import {
  Sheet,
  SheetActionRow,
  SheetList,
  SheetOption,
} from "@/components/common/sheet";

export interface OptionSheetOption {
  value: string;
  label: string;
  /** 라벨 아래 보조 한 줄 */
  description?: string;
  /** 라벨의 언어 (언어 목록처럼 행마다 언어가 다를 때) */
  lang?: string;
}

/**
 * 목록 아래에 따로 두는 이동 항목 (예: 홈 프로필 셀렉트의 "프로필 추가").
 * href가 있으면 링크, 없으면 onClick을 부르는 버튼이다.
 */
export interface OptionSheetAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface OptionSheetProps {
  isOpen: boolean;
  title: string;
  /** 제목 위 영문 장식 라벨 (번역하지 않는다). 없으면 그리지 않는다 */
  eyebrow?: string;
  options: OptionSheetOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  action?: OptionSheetAction;
}

/**
 * 서비스 공용 선택 시트 — 아래에서 올라오는 시트에서 하나를 고른다.
 * 헤더 언어 선택(LanguageDrawer)과 공용 Select가 함께 쓴다.
 * 열리면 선택된 항목(없으면 첫 항목)으로 포커스가 가고, ↑↓로 이동,
 * Esc·닫기 버튼·바깥 누르기로 닫힌다. 닫히면 연 버튼으로 포커스가 돌아간다.
 */
export const OptionSheet = ({
  isOpen,
  title,
  eyebrow,
  options,
  selectedValue,
  onSelect,
  onClose,
  action,
}: OptionSheetProps) => {
  const hasSelected = options.some((option) => option.value === selectedValue);

  const handleActionClick = () => {
    action?.onClick?.();
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title} eyebrow={eyebrow}>
      <SheetList label={title}>
        {options.map((option, index) => (
          <SheetOption
            key={option.value}
            label={option.label}
            description={option.description}
            lang={option.lang}
            isSelected={option.value === selectedValue}
            isInitialFocus={
              hasSelected ? option.value === selectedValue : index === 0
            }
            onSelect={() => onSelect(option.value)}
          />
        ))}
      </SheetList>

      {action && (
        <SheetActionRow
          label={action.label}
          href={action.href}
          onClick={handleActionClick}
        />
      )}
    </Sheet>
  );
};
