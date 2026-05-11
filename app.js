// app.js

// HTML 요소들을 쉽게 제어하기 위해 변수에 할당합니다.
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchButton');
const statusMessage = document.getElementById('statusMessage');
const repoList = document.getElementById('repoList');

/**
 * GitHub API를 호출하여 저장소 데이터를 가져오는 비동기 함수입니다. (fetchRepos)
 * 데이터를 가져오는 로직만 담당합니다.
 * @param {string} keyword - 검색할 키워드
 * @returns {Promise<Object>} - GitHub에서 받아온 JSON 데이터
 */
async function fetchRepos(keyword) {
  // 1. 검색어를 URL에 안전하게 포함시키기 위해 인코딩(처리)합니다.
  const encodedKeyword = encodeURIComponent(keyword);
  
  // 2. 검색을 위한 API 주소를 만듭니다. (별점 기준 내림차순, 6개 결과)
  const url = `https://api.github.com/search/repositories?q=${encodedKeyword}&sort=stars&order=desc&per_page=6`;

  // 3. fetch를 사용하여 네트워크 요청을 보내고 응답이 올 때까지 기다립니다(await).
  const response = await fetch(url);

  // 4. 서버 응답이 성공(OK)인지 확인합니다. (성공이 아니면 에러를 발생시킵니다)
  if (!response.ok) {
    throw new Error(`GitHub API 요청에 실패했습니다. (상태 코드: ${response.status})`);
  }

  // 5. 받아온 응답 데이터를 JSON 형식으로 변환하여 반환합니다.
  return await response.json();
}

/**
 * 받아온 데이터 배열을 HTML 카드 형태로 만들어 화면에 표시합니다. (renderRepos)
 * @param {Array} items - GitHub 저장소 데이터 배열
 */
function renderRepos(items) {
  items.forEach(repo => {
    // 새로운 div 요소를 생성하여 카드 레이아웃을 만듭니다.
    const card = document.createElement('div');
    card.className = 'repo-card';
    
    // 데이터가 null이거나 비어있을 경우를 대비해 기본 문구를 설정합니다.
    const description = repo.description || '설명이 없습니다.';
    const language = repo.language || '알 수 없음';
    
    // 천 단위로 콤마(,)를 찍어서 보기 좋게 포맷팅합니다.
    const stars = repo.stargazers_count.toLocaleString();
    const forks = repo.forks_count.toLocaleString();

    // 카드 내부의 HTML 구조를 작성합니다.
    card.innerHTML = `
      <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
      <div class="repo-info">
        <span class="language" title="주 사용 언어">🏷️ ${language}</span>
        <span class="stars" title="Star 수">⭐ ${stars}</span>
        <span class="forks" title="Fork 수">🍴 ${forks}</span>
      </div>
      <div class="description">${description}</div>
    `;
    
    // 완성된 카드를 목록(repoList)에 추가합니다.
    repoList.appendChild(card);
  });
}

/**
 * 검색을 통합해서 관리하는 비동기 함수입니다. (handleSearch)
 * 입력값 검증, 데이터 요청, 화면 렌더링을 모두 제어합니다.
 */
async function handleSearch() {
  // 1. 입력창(searchInput)에 적힌 텍스트를 가져오고, trim()으로 앞뒤 공백을 없앱니다.
  const keyword = searchInput.value.trim();
  
  // 2. 만약 공백을 다 지웠는데도 텍스트가 비어있다면 (빈 문자열이라면)
  if (keyword === "") {
    // 상태 메시지 영역(statusMessage)에 에러 스타일을 적용하고 문구를 띄웁니다.
    statusMessage.className = 'status-message error';
    statusMessage.textContent = '⚠️ 검색어를 입력해 주세요.';
    repoList.innerHTML = ''; // 이전 검색 결과 화면에서 지우기
  } else {
    console.log("검색어:", keyword);
    
    // 검색 시작 시 화면 상태 메시지 업데이트
    statusMessage.className = 'status-message';
    statusMessage.textContent = '⏳ 검색 중...';
    repoList.innerHTML = '';

    try {
      // 3. fetchRepos 함수로 데이터를 가져옵니다.
      const data = await fetchRepos(keyword);

      if (data.items.length === 0) {
        statusMessage.textContent = `🤔 '${keyword}'에 대한 결과가 없습니다.`;
        return;
      }

      // 4. 받아온 데이터를 renderRepos 함수에 전달하여 화면에 그립니다.
      statusMessage.textContent = `✅ '${keyword}' 검색 완료!`;
      renderRepos(data.items);

    } catch (error) {
      // 5. 오류 처리는 요구사항에 따라 console.error로 유지합니다.
      console.error('검색 중 오류 발생:', error);
      statusMessage.className = 'status-message error';
      statusMessage.textContent = '🚨 오류가 발생했습니다.';
    }
  }
}

// -------------------------------------------------------------------
// 이벤트 연결 (Event Listeners)
// -------------------------------------------------------------------

// 검색 버튼 클릭 시 검색 함수(handleSearch) 실행
searchBtn.addEventListener('click', handleSearch);

// 입력창에서 키보드를 눌렀을 때 엔터 키인지 확인하여 검색 함수 실행
searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    handleSearch();
  }
});

