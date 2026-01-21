import styles from "./CopyToast.module.css";

interface CopyToastProps {
  message: string;
}

export const CopyToast = ({ message }: CopyToastProps) => {
  return (
    <div className={styles.copyToast}>
      <div className={styles.copyToastContent}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.687 4.31295C13.8823 4.50821 13.8823 4.8248 13.687 5.02006L7.02038 11.6867C6.82512 11.882 6.50854 11.882 6.31328 11.6867L2.97994 8.35339C2.78468 8.15813 2.78468 7.84155 2.97994 7.64628C3.1752 7.45102 3.49179 7.45102 3.68705 7.64628L6.66683 10.6261L12.9799 4.31295C13.1752 4.11769 13.4918 4.11769 13.687 4.31295Z"
            fill="white"
          />
        </svg>
        {message}
      </div>
    </div>
  );
};
