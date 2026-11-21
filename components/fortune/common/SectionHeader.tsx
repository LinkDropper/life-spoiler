import { ChevronIcon } from "./ChevronIcon";

import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}

export const SectionHeader = ({
  title,
  expanded,
  onToggle,
}: SectionHeaderProps) => {
  return (
    <button type="button" className={styles.sectionHeader} onClick={onToggle}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <ChevronIcon expanded={expanded} />
    </button>
  );
};
