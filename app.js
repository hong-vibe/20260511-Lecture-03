// app.js

// HTML 요소들을 쉽게 제어하기 위해 변수에 할당합니다.
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchButton');
const statusMessage = document.getElementById('statusMessage');
const repoList = document.getElementById('repoList');
const translateBtn = document.getElementById('translateHintBtn');

// -------------------------------------------------------------------
// 번역 기능 관련 변수 및 함수
// -------------------------------------------------------------------

// 현재 번역 상태를 추적합니다. (false = 원문, true = 번역됨)
let isTranslated = false;

// 번역 데이터를 저장할 캐시 키와 객체를 초기화합니다.
const TRANSLATION_CACHE_KEY = 'gitquest_translation_cache';
let translationCache = JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY)) || {};

/**
 * 현재 브라우저가 내장 번역을 지원하는 Chromium 기반인지 확인합니다.
 * Chrome, Edge 등은 지원하고, Vivaldi, Brave 등은 제외합니다.
 * @returns {boolean} - 번역 기능 지원 여부
 */
function isTranslationSupported() {
  const ua = navigator.userAgent;
  // Chrome 문자열이 포함되고, Vivaldi나 Brave가 아닌 경우
  return /Chrome/.test(ua) && !/Vivaldi|Brave/.test(ua);
}

/**
 * MyMemory 무료 번역 API를 호출하여 텍스트를 번역합니다.
 * @param {string} text - 번역할 원문 텍스트
 * @param {string} from - 원본 언어 코드 (기본: 'en')
 * @param {string} to - 대상 언어 코드 (기본: 'ko')
 * @returns {Promise<string>} - 번역된 텍스트
 */
async function translateText(text, from = 'en', to = 'ko') {
  // 텍스트가 비어있거나 한글이면 번역하지 않습니다.
  if (!text || text === '설명이 없습니다.' || /[가-힣]/.test(text)) {
    return text;
  }

  // 1. 캐시에서 이미 번역된 결과가 있는지 먼저 찾아봅니다.
  if (translationCache[text]) {
    console.log('이미 번역된 데이터(캐시)를 사용합니다.');
    return translationCache[text];
  }

  // 2. 캐시에 없다면 API를 호출합니다. (de 파라미터에 이메일을 넣어 한도를 5만자로 늘립니다)
  const email = 'gitquest-dev@example.com'; 
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=${email}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const translatedText = data.responseData.translatedText;

    // 3. 번역 결과를 캐시에 저장하고 로컬 스토리지에 동기화합니다.
    translationCache[text] = translatedText;
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(translationCache));

    return translatedText;
  } catch (error) {
    console.error('번역 API 호출 중 오류가 발생했습니다:', error);
    return text; // 실패 시 원문을 그대로 보여줍니다.
  }
}

/**
 * 화면의 모든 카드 설명을 한글로 번역하거나 원문으로 복원합니다.
 */
async function toggleTranslation() {
  const descriptions = document.querySelectorAll('.description');
  
  // 번역할 카드가 없으면 아무것도 하지 않습니다.
  if (descriptions.length === 0) return;

  // 버튼 상태 변경 (번역 중 표시)
  translateBtn.disabled = true;
  translateBtn.textContent = '⏳ 번역 중...';

  if (!isTranslated) {
    // --- 영문 → 한글 번역 ---
    try {
      for (const el of descriptions) {
        // 원문을 data-original 속성에 저장해 둡니다. (나중에 복원용)
        if (!el.dataset.original) {
          el.dataset.original = el.textContent;
        }
        // MyMemory API로 번역합니다.
        const translated = await translateText(el.textContent);
        el.textContent = translated;
      }
      isTranslated = true;
      translateBtn.textContent = '🌐 원문 보기';
      translateBtn.classList.add('active');
    } catch (error) {
      console.error('번역 오류:', error);
      translateBtn.textContent = '🌐 번역';
    }
  } else {
    // --- 한글 → 영문 원문 복원 ---
    descriptions.forEach(el => {
      if (el.dataset.original) {
        el.textContent = el.dataset.original;
      }
    });
    isTranslated = false;
    translateBtn.textContent = '🌐 번역';
    translateBtn.classList.remove('active');
  }

  translateBtn.disabled = false;
}

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
 * 입력값 검증, 데이터 요청, 화면 렌더링 및 상태(로딩, 에러 등)를 모두 제어합니다.
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
    return; // 더 이상 진행하지 않고 함수를 종료합니다.
  }

  // ---------------------------------------------------------
  // 3. 검색 시작 준비 단계
  // ---------------------------------------------------------
  // [조건 5] 검색 중에는 버튼을 비활성화하여 중복 클릭을 방지합니다.
  searchBtn.disabled = true;
  
  // [조건 7] 검색을 새로 시작할 때는 이전 결과 목록을 깨끗이 비웁니다.
  repoList.innerHTML = '';
  
  // [조건 1] 사용자에게 검색이 시작되었음을 알리는 메시지를 표시합니다.
  statusMessage.className = 'status-message';
  statusMessage.textContent = '⏳ 검색 중입니다...';

  // [추가] 새로운 검색을 시작하므로 번역 상태를 초기화합니다.
  isTranslated = false;
  translateBtn.textContent = '🌐 번역';
  translateBtn.classList.remove('active');

  // [조건 4] try/catch/finally 구조를 사용하여 에러를 처리하고 마무리를 보장합니다.
  try {
    // 4. fetchRepos 함수를 호출하여 데이터를 비동기적으로 가져옵니다.
    const data = await fetchRepos(keyword);

    // [조건 2] 가져온 데이터가 하나도 없는 경우
    if (data.items.length === 0) {
      statusMessage.textContent = '🤔 검색 결과가 없습니다.';
    } else {
      // 5. 검색 결과가 있다면 화면에 카드를 그립니다.
      statusMessage.textContent = `✅ '${keyword}' 검색을 완료했습니다!`;
      renderRepos(data.items);
    }

  } catch (error) {
    // [조건 3] API 요청 중 에러가 발생한 경우 (네트워크 문제 등)
    console.error('검색 오류 발생:', error);
    statusMessage.className = 'status-message error';
    statusMessage.textContent = '🚨 데이터를 가져오지 못했습니다.';

  } finally {
    // [조건 6] 검색이 성공하든 실패하든 마지막에는 반드시 버튼을 다시 활성화합니다.
    searchBtn.disabled = false;
  }
}

// -------------------------------------------------------------------
// 인기 트렌드 기능: Bump Chart (순위 변동 차트)
// -------------------------------------------------------------------

/**
 * 인사이트 있는 개발 키워드 순위 변동 데이터입니다.
 * prevRank: 1주 전 순위, currRank: 현재 순위
 *
 * [인사이트 스토리]
 * - AI/LLM이 5위 → 1위로 폭발적 상승 (AI 붐 반영)
 * - TypeScript가 3위 → 2위로 꾸준한 상승 (타입 안전성 트렌드)
 * - Rust가 7위 → 3위로 급상승 (시스템 프로그래밍 관심 증가)
 * - Python이 1위 → 4위로 하락 (AI에 자리를 내줌, 여전히 강세)
 * - React가 2위 → 5위로 하락 (성숙기 진입, 안정세)
 */
const TREND_DATA = [
  { name: 'AI / LLM',    prevRank: 5,  currRank: 1,  color: '#ffd54f' },
  { name: 'TypeScript',  prevRank: 3,  currRank: 2,  color: '#64b5f6' },
  { name: 'Rust',        prevRank: 7,  currRank: 3,  color: '#ff8a65' },
  { name: 'Python',      prevRank: 1,  currRank: 4,  color: '#81c784' },
  { name: 'React',       prevRank: 2,  currRank: 5,  color: '#4fc3f7' },
  { name: 'Next.js',     prevRank: 4,  currRank: 6,  color: '#ce93d8' },
  { name: 'Go (Golang)', prevRank: 6,  currRank: 7,  color: '#80cbc4' },
  { name: 'Kubernetes',  prevRank: 8,  currRank: 8,  color: '#f48fb1' },
  { name: 'Vue.js',      prevRank: 9,  currRank: 9,  color: '#a5d6a7' },
  { name: 'Flutter',     prevRank: 10, currRank: 10, color: '#90caf9' },
];

/**
 * 트렌드 배지 리스트와 Bump Chart를 화면에 렌더링합니다.
 */
function renderTrending() {
  const trendingList = document.getElementById('trendingList');
  trendingList.innerHTML = '';

  const sorted = [...TREND_DATA].sort((a, b) => a.currRank - b.currRank);

  sorted.forEach(item => {
    const diff = item.prevRank - item.currRank;

    let changeHTML = '';
    if (diff > 0) {
      changeHTML = `<span class="change up">▲ ${diff}</span>`;
    } else if (diff < 0) {
      changeHTML = `<span class="change down">▼ ${Math.abs(diff)}</span>`;
    } else {
      changeHTML = `<span class="change same">── </span>`;
    }

    const badge = document.createElement('div');
    badge.className = 'trend-badge';
    badge.style.borderColor = item.color + '66';
    badge.title = `지난주 ${item.prevRank}위 → 현재 ${item.currRank}위`;
    badge.innerHTML = `
      <span class="rank">${item.currRank}위</span>
      <span class="keyword">${item.name}</span>
      ${changeHTML}
    `;
    badge.style.cursor = 'pointer';
    badge.onclick = () => {
      searchInput.value = item.name.split('/')[0].trim();
      handleSearch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    trendingList.appendChild(badge);
  });

  renderBumpChart(sorted);
}

/**
 * Chart.js를 사용하여 Bump Chart(순위 변동 라인 차트)를 그립니다.
 * X축: '1주 전', '현재' / Y축: 1위(상단) ~ 10위(하단) 역순
 */
function renderBumpChart(data) {
  const ctx = document.getElementById('rankChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1주 전', '현재'],
      datasets: data.map(item => ({
        label: item.name,
        data: [item.prevRank, item.currRank],
        borderColor: item.color,
        backgroundColor: item.color + '33',
        borderWidth: item.currRank <= 3 ? 3 : 1.5,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: item.color,
        tension: 0.2,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#ccc',
            font: { size: 11 },
            boxWidth: 14,
            padding: 10,
          }
        },
        tooltip: {
          backgroundColor: '#1e1e1e',
          titleColor: '#ffd54f',
          bodyColor: '#fff',
          borderColor: '#444',
          borderWidth: 1,
          callbacks: {
            label: ctx => {
              const item = data[ctx.datasetIndex];
              return ` ${ctx.dataset.label}: ${ctx.raw}위 (지난주 ${item.prevRank}위 → 현재 ${item.currRank}위)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#2a2a2a' },
          ticks: { color: '#aaa', font: { size: 13, weight: 'bold' } }
        },
        y: {
          reverse: true,
          min: 1,
          max: 10,
          grid: { color: '#2a2a2a' },
          ticks: {
            color: '#aaa',
            stepSize: 1,
            callback: val => `${val}위`
          }
        }
      }
    }
  });
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

// 번역 버튼 클릭 시 번역/원문 토글
translateBtn.addEventListener('click', toggleTranslation);

// -------------------------------------------------------------------
// 페이지 로드 시 초기화
// -------------------------------------------------------------------
// 브라우저가 번역을 지원하면 번역 버튼을 보이게 합니다.
if (isTranslationSupported()) {
  translateBtn.classList.remove('hidden');
}

// 페이지 로드 시 Bump Chart 트렌드를 렌더링합니다.
renderTrending();

