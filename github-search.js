/**
 * GitHub에서 저장소를 검색하는 함수입니다.
 * @param {string} keyword - 사용자가 입력한 검색어
 */
function searchGithubRepositories(keyword) {
  // 1. API 기본 주소 및 검색어 설정
  const baseUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}`;

  // 2. 정렬 및 개수 제한 조건 추가 (Template Literal 방식 사용)
  const url = `${baseUrl}&sort=stars&order=desc&per_page=6`;

  // 결과를 표시할 HTML 요소 가져오기
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '<div class="loading">검색 중... ⏳</div>';

  // 완성된 URL을 사용하여 데이터를 요청합니다.
  fetch(url)
    .then(response => {
      // 서버에서 응답이 오면 JSON 형태로 변환합니다.
      return response.json();
    })
    .then(data => {
      console.log("검색된 저장소 목록:", data.items);
      // 검색된 데이터를 화면에 그려주는 함수 호출
      displayResults(data.items);
    })
    .catch(error => {
      console.error("데이터를 불러오는 중 에러가 발생했습니다:", error);
      resultsContainer.innerHTML = `<div class="error">데이터를 불러오는 데 실패했습니다: ${error.message}</div>`;
    });
}

/**
 * 검색된 저장소 목록을 HTML 화면에 그려주는 함수
 * @param {Array} items - GitHub API에서 받아온 저장소 배열
 */
function displayResults(items) {
  const resultsContainer = document.getElementById('results');
  
  // 기존 검색 결과 지우기
  resultsContainer.innerHTML = '';

  if (!items || items.length === 0) {
    resultsContainer.innerHTML = '<div class="loading">검색 결과가 없습니다.</div>';
    return;
  }

  // 받아온 저장소 배열을 하나씩 돌면서 카드 형태로 화면에 추가합니다.
  items.forEach(repo => {
    // 새로운 div 요소를 생성합니다.
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // 카드 안의 HTML 내용을 채워 넣습니다.
    card.innerHTML = `
      <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
      <div class="stars">⭐ ${repo.stargazers_count.toLocaleString()} stars</div>
      <div class="description">${repo.description || '설명이 없습니다.'}</div>
    `;
    
    // 완성된 카드를 결과 영역에 추가합니다.
    resultsContainer.appendChild(card);
  });
}

// -------------------------------------------------------------------
// 이벤트 리스너 설정 (버튼 클릭 시 검색 실행)
// -------------------------------------------------------------------
document.getElementById('searchBtn').addEventListener('click', () => {
  // 검색창에 입력된 텍스트를 가져옵니다.
  const keyword = document.getElementById('searchInput').value;
  
  if (keyword.trim() !== '') {
    // 입력값이 있으면 검색 함수를 실행합니다.
    searchGithubRepositories(keyword);
  } else {
    alert('검색어를 입력해주세요.');
  }
});

// 처음 화면이 열렸을 때 'react' 키워드로 초기 검색을 한번 실행합니다.
searchGithubRepositories('react');
