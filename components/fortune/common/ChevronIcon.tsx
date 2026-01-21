import styles from "./ChevronIcon.module.css";

interface ChevronIconProps {
  expanded: boolean;
  size?: "small" | "medium";
  className?: string;
}

export const ChevronIcon = ({
  expanded,
  size = "medium",
  className = "",
}: ChevronIconProps) => {
  const sizeClass = size === "small" ? styles.small : styles.medium;
  const expandedClass = expanded ? styles.expanded : "";

  return (
    <svg
      className={`${styles.chevron} ${sizeClass} ${expandedClass} ${className}`}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M5 12.5L10 7.5L15 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
