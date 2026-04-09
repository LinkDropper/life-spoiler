export interface FaceReportSection {
  headline: string;
  content: string;
  tags: [string, string];
  score: number;
}

export interface FaceReportAction {
  title: string;
  detail: string;
}

export interface FaceReportData {
  /** 전체 인상 요약 (인생스포 life_spoiler 대응) */
  profile: {
    headline: string;
    description: string;
    summary: string;
  };
  /** 얼굴 관찰 — 관상학 기반 부위별 묘사 */
  observation: {
    headline: string;
    content: string;
  };
  /** 기질·성향 */
  personality: FaceReportSection;
  /** 일·커리어 */
  career: FaceReportSection;
  /** 재물 */
  wealth: FaceReportSection;
  /** 인연·관계 */
  relationship: FaceReportSection;
  /** 실행 가능한 액션 5개 */
  actions: FaceReportAction[];
  /** SNS 공유용 한 줄 카피 */
  shareLine: string;
}
