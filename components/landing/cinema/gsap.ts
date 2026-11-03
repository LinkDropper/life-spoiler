"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// 인스타그램·카카오톡 인앱 브라우저에서 주소창이 접히며 높이가 바뀔 때마다
// 고정(pin) 구간이 다시 계산되며 튀는 것을 막는다.
ScrollTrigger.config({ ignoreMobileResize: true });

/** 움직임 줄이기 설정 사용자에겐 스크롤 연출 대신 정지 화면을 보여준다 */
export const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, useGSAP };
