// app.js

// HTML 요소들을 쉽게 제어하기 위해 변수에 할당합니다.
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchButton');
const statusMessage = document.getElementById('statusMessage');
const repoList = document.getElementById('repoList');

/**
 * GitHub API를 호출하여 저장소를 검색하는 함수입니다.
 * @param {string} keyword - 검색할 키워드
 */
function searchRepositories(keyword) {
  // 검색 시작 시 상태 메시지 업데이트
  statusMessage.className = 'status-message';
  statusMessage.textContent = '⏳ 검색 중... 데이터를 불러오고 있습니다.';
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
      if (data.items.length === 0) {
        statusMessage.className = 'status-message';
        statusMessage.textContent = `🤔 '${keyword}'에 대한 검색 결과가 없습니다.`;
        return;
      }
      
      // 검색 완료 시 상태 업데이트
      statusMessage.className = 'status-message';
      statusMessage.textContent = `✅ '${keyword}'에 대한 검색을 완료했습니다. (${data.items.length}개 표시)`;
      
      // 검색된 데이터를 바탕으로 화면에 카드 렌더링
      renderCards(data.items);
    })
    .catch(error => {
      console.error('검색 중 에러 발생:', error);
      statusMessage.className = 'status-message error';
      statusMessage.textContent = '🚨 데이터를 불러오는 데 실패했습니다.';
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

// -------------------------------------------------------------------
// 검색 버튼 클릭 이벤트 설정
// -------------------------------------------------------------------
// 사용자가 'searchButton' 아이디를 가진 버튼을 클릭했을 때 작동하는 코드입니다.
searchBtn.addEventListener('click', () => {
  // 1. 입력창(searchInput)에 적힌 텍스트를 가져오고, trim()으로 앞뒤 공백을 없앱니다.
  const keyword = searchInput.value.trim();
  
  // 2. 만약 공백을 다 지웠는데도 텍스트가 비어있다면 (빈 문자열이라면)
  if (keyword === "") {
    // 3. 상태 메시지 영역(statusMessage)에 에러 스타일을 적용하고 문구를 띄웁니다.
    statusMessage.className = 'status-message error';
    statusMessage.textContent = '⚠️ 검색어를 입력해 주세요.';
    repoList.innerHTML = ''; // 이전 검색 결과 화면에서 지우기
  } else {
    // 4. 입력값이 정상적으로 있다면 개발자 도구 콘솔창(F12)에 검색어를 출력합니다.
    console.log("검색어:", keyword);
    
    // (기존에 만들어둔 GitHub API 검색 함수를 실행하여 화면에 결과를 그립니다)
    searchRepositories(keyword);
  }
});

// 엔터 키 입력 시 검색 실행 이벤트 (선택사항)
searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchBtn.click();
  }
});
