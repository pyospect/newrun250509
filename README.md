# 뉴런(newrun) - AI 러닝 플래너

뉴런(newrun)은 AI 기반 러닝 플래너 서비스로, 사용자의 러닝 목표와 조건에 맞춤형 러닝 계획을 제공합니다. 챗봇 형식의 대화를 통해 러닝 경험, 목표, 선호도 등을 수집하여 개인화된 러닝 세션 계획을 생성합니다.

## 주요 기능

- **챗봇 인터페이스**: 자연스러운 대화를 통해 러닝 계획 생성
- **맞춤형 러닝 계획**: 사용자의 경험 수준, 목표 거리, 시간, 인터벌 선호도 등을 반영
- **캘린더 연동**: 생성된 러닝 계획을 ICS 파일로 저장하여 캘린더에 쉽게 추가
- **세부 계획 제공**: 워밍업, 본 운동, 쿨다운 등 구체적인 러닝 세션 가이드

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API를 활용한 대화형 AI
- **캘린더 통합**: ICS 표준 포맷 지원

## 시작하기

### 필수 요구사항

- Node.js 14.0 이상
- npm 또는 yarn 패키지 매니저
- Google Gemini API 키

### 설치 방법

1. 저장소 복제
   ```bash
   git clone <repository-url>
   cd newrun
   ```

2. 의존성 설치
   ```bash
   npm install
   # 또는
   yarn install
   ```

3. 환경 변수 설정
   `.env.local` 파일을 생성하고 다음 내용을 추가합니다:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. 개발 서버 실행
   ```bash
   npm run dev
   # 또는
   yarn dev
   ```

5. 브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션 사용

## 프로젝트 구조

```
├── public/              # 정적 파일
├── src/
│   ├── components/      # 리액트 컴포넌트
│   │   ├── ChatBubble.tsx       # 채팅 말풍선 컴포넌트
│   │   ├── ChatInput.tsx        # 사용자 입력 컴포넌트
│   │   ├── ChatWindow.tsx       # 채팅 창 컴포넌트
│   │   ├── LoadingSpinner.tsx   # 로딩 스피너 컴포넌트
│   │   ├── Logo.tsx             # 로고 컴포넌트
│   │   └── SummaryCard.tsx      # 러닝 계획 요약 카드 컴포넌트
│   ├── lib/            # 유틸리티 및 서비스
│   │   ├── aiClient.ts          # Gemini API 연동 클라이언트
│   │   ├── prompts.ts           # AI 프롬프트 템플릿
│   │   └── utils.ts             # 유틸리티 함수
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── api/               # API 라우트
│   │   │   ├── chat.ts         # 채팅 API 핸들러
│   │   │   └── ical.ts         # ICS 파일 생성 API 핸들러
│   │   ├── _app.tsx           # 앱 컴포넌트
│   │   ├── _document.tsx      # 문서 컴포넌트
│   │   └── index.tsx          # 메인 페이지
│   └── styles/         # 스타일 파일
├── .gitignore          # Git 무시 파일 목록
├── next.config.js      # Next.js 설정
├── package.json        # 프로젝트 메타데이터와 의존성
├── postcss.config.js   # PostCSS 설정
├── tailwind.config.js  # Tailwind CSS 설정
└── tsconfig.json       # TypeScript 설정
```

## 사용 방법

1. 웹사이트에 접속하면 AI 러닝 코치가 환영 메시지와 함께 러닝 목표를 물어봅니다.
2. 챗봇과의 대화를 통해 러닝 목표, 거리, 시간, 인터벌 선호도 등의 정보를 제공합니다.
3. AI가 수집된 정보를 바탕으로 맞춤형 러닝 계획을 생성합니다.
4. 생성된 계획은 요약 카드 형태로 표시되며, '일정 등록하기' 버튼을 통해 캘린더에 추가할 수 있습니다.

## 기능 확장 계획

- **사용자 인증**: 사용자별 프로필 및 과거 러닝 계획 저장
- **러닝 기록 통합**: 실제 러닝 앱과 연동하여 실행 결과 추적
- **커뮤니티 기능**: 러닝 계획 공유 및 러닝 메이트 찾기
- **다국어 지원**: 영어 및 기타 언어 지원 확대

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

## 문의 및 기여

프로젝트에 관한 질문이나 기여를 원하시면 이슈를 등록하거나 풀 리퀘스트를 제출해주세요. 