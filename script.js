import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  push
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_eMQEfRFj58UTR3pamyfzAeySKTsYDZk",
  authDomain: "naniruni-9ae4a.firebaseapp.com",
  databaseURL: "https://naniruni-9ae4a-default-rtdb.firebaseio.com",
  projectId: "naniruni-9ae4a",
  storageBucket: "naniruni-9ae4a.firebasestorage.app",
  messagingSenderId: "188382104370",
  appId: "1:188382104370:web:21944c5e088b081344652b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;
let currentQuestion = "";

// 💾 페이지 로드 시 기존에 입력했던 OpenAI API 키가 있다면 자동으로 불러오기
window.addEventListener("DOMContentLoaded", () => {
  const savedKey = localStorage.getItem("openai_api_key");
  if (savedKey) {
    const apiKeyInput = document.getElementById("apiKeyInput");
    if (apiKeyInput) apiKeyInput.value = savedKey;
  }
});

/* 구글 로그인 */
document
  .getElementById("loginBtn")
  .addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      currentUser = result.user;

      document.getElementById("userInfo").innerText =
        "로그인: " + currentUser.displayName;

    } catch(err) {
      alert("로그인 실패");
      console.error(err);
    }
  });

/* 질문 생성 */
document
  .getElementById("questionBtn")
  .addEventListener("click", () => {
    const job = document.getElementById("jobInput").value.trim();

    if(!job){
      alert("직무를 입력하세요");
      return;
    }

    const questions = [
      `${job} 분야에서 가장 중요한 역량은 무엇이라고 생각합니까?`,
      `${job} 직무를 선택한 이유를 설명해주세요.`,
      `${job} 분야에서 문제를 해결했던 경험이 있습니까?`,
      `${job} 분야에서 본인의 강점은 무엇입니까?`,
      `${job} 관련 프로젝트 경험을 설명해주세요.`
    ];

    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById("questionBox").innerText = currentQuestion;
  });

/* TTS */
document
  .getElementById("ttsBtn")
  .addEventListener("click", () => {
    if(!currentQuestion){
      alert("먼저 질문을 생성하세요");
      return;
    }

    const speech = new SpeechSynthesisUtterance(currentQuestion);
    speech.lang = "ko-KR";
    speechSynthesis.speak(speech);
  });

/* 답변 평가 (진짜 OpenAI GPT API 연동) */
document
  .getElementById("feedbackBtn")
  .addEventListener("click", async () => {
    const answer = document.getElementById("answerInput").value.trim();
    const apiKey = document.getElementById("apiKeyInput")?.value.trim();

    // 1. 유효성 검사 (API 키, 답변, 질문이 다 있는지 확인)
    if(!apiKey){
      alert("OpenAI API 키를 먼저 입력해주세요!\n(보안을 위해 코드에 저장되지 않고 브라우저에만 기억됩니다)");
      return;
    }

    if(!currentQuestion){
      alert("면접 질문이 생성되지 않았습니다. [면접 질문 생성]을 먼저 눌러주세요.");
      return;
    }

    if(!answer){
      alert("답변을 입력하세요");
      return;
    }

    // 미래의 사용을 위해 브라우저 내부(localStorage)에 API 키 안전하게 저장
    localStorage.setItem("openai_api_key", apiKey);

    // AI 로딩 상태 표시
    document.getElementById("feedbackBox").innerText = "⏳ AI 면접관이 답변을 정밀 분석 중입니다. 잠시만 기다려주세요...";

    try {
      // 2. OpenAI API 호출
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // 가장 빠르고 비용이 저렴한 고성능 모델 사용
          messages: [
            {
              role: "system",
              content: `당신은 대기업 인사담당자 출신의 꼼꼼하고 예리한 AI 면접관입니다. 
지원자가 제출한 직무, 면접 질문, 그리고 답변을 깊이 있게 분석해서 면접 피드백을 작성해야 합니다.

반드시 사용자가 읽기 편하도록 아래 형식을 엄격히 지켜서 답변해 주세요:

점수 : [0~100 사이의 점수 계산]점

장점 :
[사용자의 답변에서 논리적이거나 키워드를 잘 캐치해 낸 칭찬 코멘트를 2~3줄로 작성]

개선점 :
[직무와 연관 지어 답변에서 부족한 점이나 보완해야 할 점을 2~3줄로 날카롭고 솔직하게 작성]

모범 답변 팁 :
[질문의 의도 파악과 함께, 어떤 구조(STAR 기법 등)나 직무 키워드를 사용해 대답하면 훨씬 훌륭한 답변이 되는지 구조적 가이드라인 제공]`
            },
            {
              role: "user",
              content: `지원 직무: ${document.getElementById("jobInput").value}\n면접 질문: ${currentQuestion}\n사용자 답변: ${answer}`
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();

      // 에러 코드 처리
      if (!response.ok) {
        throw new Error(data.error?.message || "API 요청에 실패했습니다.");
      }

      // GPT가 반환한 최종 텍스트 추출
      const feedback = data.choices[0].message.content;

      // 3. 화면에 피드백 꽂아주기
      document.getElementById("feedbackBox").innerText = feedback;

      /* 4. Firebase 리얼타임 데이터베이스에 진짜 피드백 저장 */
      if(currentUser){
        await push(
          ref(db, "interviewResults"),
          {
            user: currentUser.displayName,
            email: currentUser.email,
            job: document.getElementById("jobInput").value,
            question: currentQuestion,
            answer: answer,
            feedback: feedback, // 하드코딩 텍스트가 아닌, 진짜 GPT가 작성해 준 피드백이 저장됩니다.
            createdAt: new Date().toISOString()
          }
        );
      }

    } catch(err) {
      alert("AI 평가 중 오류가 발생했습니다.");
      console.error(err);
      document.getElementById("feedbackBox").innerText = `⚠️ 평가 실패\n\n오류 내용: ${err.message}\n\n[체크포인트]\n1. OpenAI API 키가 올바른지 확인해 주세요.\n2. OpenAI 계정에 사용 가능한 크레딧(잔액)이 남아있는지 확인해 주세요.`;
    }
  });
