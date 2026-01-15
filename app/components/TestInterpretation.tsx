"use client";

import { useState } from "react";

interface InterpretationResult {
  chart: {
    wuxingJu: string;
    mingGong: string;
    shenGong: string;
    sihua: {
      hualu: string;
      huaquan: string;
      huake: string;
      huaji: string;
    };
  };
  interpretation: {
    preview: {
      headline: string;
      description: string;
    };
    details: {
      summary: string;
      wealth: { title: string; content: string; highlights: string[] };
      career: { title: string; content: string; highlights: string[] };
      relationship: { title: string; content: string; highlights: string[] };
      health: { title: string; content: string; highlights: string[] };
    } | null;
    meta: {
      generatedAt: string;
      model: string;
      isFallback: boolean;
    };
  };
}

// 테스트 데이터: 윤재혁/2003.08.08/16시40분/남자/양력
const TEST_DATA = {
  name: "윤재혁",
  birthDate: "2003-08-08",
  birthTime: "16:40",
  gender: "male" as const,
  calendarType: "solar" as const,
};

export default function TestInterpretation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeDetails, setIncludeDetails] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...TEST_DATA, includeDetails }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "요청 실패");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>자미두수 AI 해석 테스트</h1>

      <div
        style={{
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>테스트 데이터</h3>
        <p style={{ margin: "5px 0" }}>
          <strong>이름:</strong> {TEST_DATA.name}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>생년월일:</strong> {TEST_DATA.birthDate}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>시간:</strong> {TEST_DATA.birthTime}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>성별:</strong> 남자
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>역법:</strong> 양력
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={includeDetails}
            onChange={(e) => setIncludeDetails(e.target.checked)}
          />
          상세 해석 포함 (재물/직업/인연/건강)
        </label>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: loading ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "분석 중..." : "운세 분석하기"}
      </button>

      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #f00",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <strong>오류:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          {/* 명반 정보 */}
          <div
            style={{
              background: "#e8f4ff",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>명반 정보</h3>
            <p style={{ margin: "5px 0" }}>
              <strong>오행국:</strong> {result.chart.wuxingJu}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>명궁:</strong> {result.chart.mingGong}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>신궁:</strong> {result.chart.shenGong}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>사화:</strong> 화록({result.chart.sihua.hualu}), 화권(
              {result.chart.sihua.huaquan}), 화과({result.chart.sihua.huake}),
              화기({result.chart.sihua.huaji})
            </p>
          </div>

          {/* 미리보기 */}
          <div
            style={{
              background: "#fff3e0",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>
              {result.interpretation.preview.headline}
            </h3>
            <p style={{ margin: 0 }}>
              {result.interpretation.preview.description}
            </p>
          </div>

          {/* 상세 해석 */}
          {result.interpretation.details && (
            <>
              {/* 종합 */}
              <div
                style={{
                  background: "#f0f0f0",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 10px 0" }}>종합 총평</h3>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {result.interpretation.details.summary}
                </p>
              </div>

              {/* 각 영역 */}
              {(
                ["wealth", "career", "relationship", "health"] as const
              ).map((key) => {
                const section = result.interpretation.details![key];
                return (
                  <div
                    key={key}
                    style={{
                      background: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    <h3 style={{ margin: "0 0 10px 0" }}>{section.title}</h3>
                    <p style={{ margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>
                      {section.content}
                    </p>
                    <div>
                      <strong>핵심 포인트:</strong>
                      <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                        {section.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* 메타 정보 */}
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              textAlign: "right",
            }}
          >
            <p style={{ margin: "5px 0" }}>
              모델: {result.interpretation.meta.model}
            </p>
            <p style={{ margin: "5px 0" }}>
              생성: {new Date(result.interpretation.meta.generatedAt).toLocaleString()}
            </p>
            {result.interpretation.meta.isFallback && (
              <p style={{ margin: "5px 0", color: "#f00" }}>
                (폴백 응답)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
