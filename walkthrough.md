# GitHub Repository Search Board 작업 요약

기존에 단일 파일로 구성되었던 검색 기능과 디자인을, 유지보수와 확장성을 고려하여 HTML, CSS, JavaScript 3개의 파일로 명확히 분리하는 작업을 진행했습니다.

## 1. 구조적 분리 (HTML)
기본적인 UI 요소들이 쉽게 제어될 수 있도록 `index.html` 구조를 재편했습니다.

- **`#searchInput`**: 사용자가 검색어를 입력하는 영역
- **`#searchBtn`**: 검색을 실행하는 버튼
- **`#statusMessage`**: 검색 중 로딩 상태나 에러 발생 여부를 텍스트로 보여주는 영역
- **`#repoList`**: 검색 결과(카드)들이 동적으로 삽입될 빈 컨테이너

> [!NOTE]
> `style.css`와 `app.js`를 각각 `<head>`와 `<body>` 하단에 `<link>` 및 `<script>` 태그를 이용해 연결했습니다.

## 2. 디자인 분리 (CSS)
기존 HTML 안에 혼재되어 있던 스타일을 `style.css`로 분리했습니다.

- 화면 가운데 정렬 및 깔끔한 회색조의 배경색 지정
- **CSS Grid**를 활용하여 검색 결과가 화면 너비에 따라 자동으로 여러 줄로 배치되도록 설정 (`grid-template-columns: repeat(auto-fill, ...);`)
- 요소들에 적절한 여백과 테두리, 그림자(box-shadow)를 주어 모던한 카드(Card) 형태 구현

## 3. 로직 분리 (JavaScript)
API 호출 및 DOM 제어 로직을 `app.js`로 완전히 분리했습니다.

- **명확한 DOM 제어**: `document.getElementById`를 사용해 HTML 요소들을 최상단 변수로 관리
- **상태 메시지 처리**: 데이터를 가져오는 동안에는 "검색 중... ⏳", 결과가 없거나 에러가 났을 때에는 적절한 텍스트로 상태 영역 업데이트
- **기능 개선**: 마우스 클릭뿐만 아니라, 입력창에서 `Enter` 키를 눌렀을 때도 바로 검색이 실행되도록 이벤트 리스너 추가

## 변경 사항 요약 (Diff)
결과적으로 아래 세 파일이 새롭게 구성되었습니다.
```diff:index.html
===
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Repository Search Board</title>
  <!-- CSS 파일 연결 -->
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>GitHub 저장소 검색기</h1>
      
      <!-- 1. 검색어 입력창 & 2. 검색 버튼 -->
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="검색어를 입력하세요 (예: javascript)">
        <button id="searchBtn">검색</button>
      </div>
    </header>

    <main>
      <!-- 3. 상태 메시지 영역 (로딩중, 에러, 결과 없음 등 표시) -->
      <div id="statusMessage" class="status-message"></div>

      <!-- 4. 저장소 카드 목록을 보여줄 영역 -->
      <div id="repoList" class="repo-list">
        <!-- 자바스크립트를 통해 이곳에 카드들이 추가될 예정입니다. -->
      </div>
    </main>
  </div>

  <!-- JavaScript 파일 연결 -->
  <script src="app.js"></script>
</body>
</html>

```
```diff:style.css
===
/* style.css */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f6f8fa;
  color: #24292f;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

header {
  text-align: center;
  margin-bottom: 40px;
}

h1 {
  color: #0969da;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  justify-content: center;
  gap: 10px;
}

#searchInput {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
}

#searchInput:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

#searchBtn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background-color: #2da44e;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

#searchBtn:hover {
  background-color: #2c974b;
}

.status-message {
  text-align: center;
  font-size: 16px;
  margin-bottom: 20px;
  color: #57606a;
}

.status-message.error {
  color: #cf222e;
}

.repo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 이후 app.js에서 생성할 카드 스타일 미리 정의 */
.repo-card {
  background: white;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.repo-card h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.repo-card a {
  color: #0969da;
  text-decoration: none;
}

.repo-card a:hover {
  text-decoration: underline;
}

.repo-card .stars {
  font-size: 14px;
  color: #e3b341;
  font-weight: bold;
  margin-bottom: 10px;
}

.repo-card .description {
  font-size: 14px;
  color: #57606a;
  line-height: 1.5;
  flex-grow: 1;
}
```
```diff:app.js
===
// app.js

// HTML 요소들을 쉽게 제어하기 위해 변수에 할당합니다.
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusMessage = document.getElementById('statusMessage');
const repoList = document.getElementById('repoList');

/**
 * GitHub API를 호출하여 저장소를 검색하는 함수입니다.
 * @param {string} keyword - 검색할 키워드
 */
function searchRepositories(keyword) {
  // 검색 시작 시 상태 메시지 업데이트
  statusMessage.textContent = '검색 중... ⏳';
  statusMessage.className = 'status-message';
  repoList.innerHTML = ''; // 이전 검색 결과 초기화

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc&per_page=6`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // 검색 완료 시 상태 메시지 초기화
      statusMessage.textContent = '';
      
      if (data.items.length === 0) {
        statusMessage.textContent = '검색 결과가 없습니다.';
        return;
      }
      
      // 검색된 데이터를 바탕으로 화면에 카드 렌더링
      renderCards(data.items);
    })
    .catch(error => {
      console.error('검색 중 에러 발생:', error);
      statusMessage.textContent = '데이터를 불러오는 데 실패했습니다.';
      statusMessage.className = 'status-message error';
    });
}

/**
 * 받아온 데이터 배열을 HTML 카드 형태로 만들어 화면에 표시합니다.
 * @param {Array} items - GitHub 저장소 데이터 배열
 */
function renderCards(items) {
  items.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    
    card.innerHTML = `
      <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
      <div class="stars">⭐ ${repo.stargazers_count.toLocaleString()}</div>
      <div class="description">${repo.description || '설명이 없습니다.'}</div>
    `;
    
    repoList.appendChild(card);
  });
}

// 검색 버튼 클릭 이벤트
searchBtn.addEventListener('click', () => {
  const keyword = searchInput.value.trim();
  if (keyword) {
    searchRepositories(keyword);
  } else {
    alert('검색어를 입력해주세요.');
  }
});

// 엔터 키 입력 시 검색 실행 이벤트 (선택사항)
searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchBtn.click();
  }
});
```

---

이로써 프론트엔드 기본 3요소(뼈대, 꾸밈, 동작)가 완벽하게 분리되어, 앞으로 새로운 기능을 추가하거나 디자인을 바꿀 때 훨씬 관리하기 편해졌습니다.
