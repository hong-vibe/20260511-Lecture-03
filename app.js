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
 * 사용자 화면에 검색 진행 상태를 보여주고 결과를 처리하는 함수입니다.
 * @param {string} keyword - 검색할 키워드
 */
async function searchRepositories(keyword) {
  // 검색 시작 시 화면 상태 메시지를 업데이트하고 이전 결과를 지웁니다.
  statusMessage.className = 'status-message';
  statusMessage.textContent = '⏳ 검색 중... 데이터를 불러오고 있습니다.';
  repoList.innerHTML = ''; 

  try {
    // 1. fetchRepos 함수를 호출하여 실제 데이터를 비동기적으로 가져옵니다.
    const data = await fetchRepos(keyword);

    // 2. 검색 결과가 하나도 없는 경우를 처리합니다.
    if (data.items.length === 0) {
      statusMessage.className = 'status-message';
      statusMessage.textContent = `🤔 '${keyword}'에 대한 검색 결과가 없습니다.`;
      return;
    }
    
    // 3. 검색 성공 시 상태를 업데이트합니다.
    statusMessage.className = 'status-message';
    statusMessage.textContent = `✅ '${keyword}'에 대한 검색을 완료했습니다. (${data.items.length}개 표시)`;
    
    // 4. 받아온 데이터(data.items)를 화면에 카드 형태로 그리는 함수를 호출합니다.
    renderCards(data.items);

  } catch (error) {
    // 에러가 발생한 경우(네트워크 문제 등) 콘솔에 기록하고 사용자에게 알립니다.
    console.error('검색 중 에러 발생:', error);
    statusMessage.className = 'status-message error';
    statusMessage.textContent = '🚨 데이터를 불러오는 데 실패했습니다.';
  }
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

/**
 * 검색을 통합해서 관리하는 함수입니다. (handleSearch)
 * 공통된 검색 로직을 이곳에 모아 중복 코드를 줄입니다.
 */
function handleSearch() {
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

