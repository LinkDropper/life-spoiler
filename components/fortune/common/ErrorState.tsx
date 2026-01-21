import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  message: string;
  buttonText: string;
  onButtonClick: () => void;
}

export const ErrorState = ({
  message,
  buttonText,
  onButtonClick,
}: ErrorStateProps) => {
  return (
    <div className={styles.error}>
      <p>{message}</p>
      <button
        type="button"
        className={styles.backButton}
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    </div>
  );
};
