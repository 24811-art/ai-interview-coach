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

/* 구글 로그인 */

document
  .getElementById("loginBtn")
  .addEventListener("click", async () => {

    try {

      const provider =
        new GoogleAuthProvider();

      const result =
        await signInWithPopup(auth, provider);

      currentUser = result.user;

      document.getElementById("userInfo")
        .innerText =
        "로그인: " +
        currentUser.displayName;

    } catch(err) {

      alert("로그인 실패");
      console.error(err);

    }

  });

/* 질문 생성 */

document
  .getElementById("questionBtn")
  .addEventListener("click", () => {

    const job =
      document.getElementById("jobInput")
      .value
      .trim();

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

    currentQuestion =
      questions[
        Math.floor(
          Math.random() * questions.length
        )
      ];

    document.getElementById("questionBox")
      .innerText =
      currentQuestion;

  });

/* TTS */

document
  .getElementById("ttsBtn")
  .addEventListener("click", () => {

    if(!currentQuestion){
      alert("먼저 질문을 생성하세요");
      return;
    }

    const speech =
      new SpeechSynthesisUtterance(
        currentQuestion
      );

    speech.lang = "ko-KR";

    speechSynthesis.speak(speech);

  });

/* 답변 평가 */

document
  .getElementById("feedbackBtn")
  .addEventListener("click", async () => {

    const answer =
      document.getElementById("answerInput")
      .value
      .trim();

    if(!answer){
      alert("답변을 입력하세요");
      return;
    }

    let score = 60;

    if(answer.length > 50)
      score += 10;

    if(answer.length > 100)
      score += 10;

    if(answer.includes("경험"))
      score += 10;

    if(answer.includes("프로젝트"))
      score += 10;

    if(score > 100)
      score = 100;

    const feedback =
`점수 : ${score}점

장점 :
답변 길이가 적절하며 핵심 내용을 포함하고 있습니다.

개선점 :
실제 경험과 구체적인 사례를 추가하면 더욱 좋은 답변이 됩니다.

모범 답변 팁 :
본인의 경험 → 문제 상황 → 해결 과정 → 결과 순으로 설명하세요.`;

    document.getElementById("feedbackBox")
      .innerText =
      feedback;

    /* Firebase 저장 */

    if(currentUser){

      await push(
        ref(db, "interviewResults"),
        {
          user: currentUser.displayName,
          email: currentUser.email,
          job:
            document.getElementById("jobInput").value,
          question: currentQuestion,
          answer: answer,
          feedback: feedback,
          createdAt: new Date().toISOString()
        }
      );

    }

  });
