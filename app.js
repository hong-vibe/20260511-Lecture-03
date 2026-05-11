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
 * 5주간 개발 키워드 순위 변동 데이터입니다.
 * ranks: [4주 전, 3주 전, 2주 전, 1주 전, 현재] 순위
 *
 * [인사이트 스토리]
 * - AI/LLM: 꾸준히 8위 → 1위로 폭발적 상승 (AI 붐)
 * - TypeScript: 4위 → 2위로 점진적 상승 (타입 안전성 트렌드)
 * - Rust: 9위 → 3위로 급상승 (시스템 프로그래밍 재조명)
 * - Python: 1위 → 4위로 하락 (AI에 자리를 내줬으나 여전히 강세)
 * - React: 2위 → 5위로 하락 (성숙기 진입)
 */
const TREND_DATA = [
  { name: 'AI / LLM',    ranks: [8, 6, 4, 2, 1],  color: '#2D5A8E' }, // 딥 블루
  { name: 'TypeScript',  ranks: [4, 4, 3, 3, 2],  color: '#1A6B8A' }, // 오션
  { name: 'Rust',        ranks: [9, 8, 7, 5, 3],  color: '#B85C38' }, // 러스트 테라코타
  { name: 'Python',      ranks: [1, 1, 2, 3, 4],  color: '#3A7D44' }, // 포레스트 그린
  { name: 'React',       ranks: [2, 2, 2, 4, 5],  color: '#6B4FA0' }, // 뮤트 퍼플
  { name: 'Next.js',     ranks: [3, 3, 4, 4, 6],  color: '#B8860B' }, // 다크 골드
  { name: 'Go (Golang)', ranks: [5, 5, 6, 6, 7],  color: '#2E8B8B' }, // 틸
  { name: 'Kubernetes',  ranks: [6, 7, 8, 8, 8],  color: '#B24D7A' }, // 뮤트 핑크
  { name: 'Vue.js',      ranks: [7, 9, 9, 9, 9],  color: '#4A7C59' }, // 세이지 그린
  { name: 'Flutter',     ranks: [10, 10, 10, 10, 10], color: '#4A6FA0' }, // 스틸 블루
];

// X축 레이블 (5개 시점)
const TREND_LABELS = ['4주 전', '3주 전', '2주 전', '1주 전', '현재'];

/**
 * Bump Chart를 화면에 렌더링합니다.
 */
function renderTrending() {
  // 현재 순위(ranks 마지막 값) 기준으로 정렬
  const sorted = [...TREND_DATA].sort((a, b) => a.ranks.at(-1) - b.ranks.at(-1));
  renderBumpChart(sorted);
}

/**
 * 첫 번째 데이터 포인트(왼쪽) 옆에 키워드 이름을 표시하는 커스텀 플러그인
 */
const startLabelPlugin = {
  id: 'startLabel',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (!meta.hidden && meta.data.length > 0) {
        const firstPoint = meta.data[0];
        ctx.save();
        ctx.fillStyle = dataset.borderColor;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(dataset.label, firstPoint.x - 8, firstPoint.y);
        ctx.restore();
      }
    });
  }
};

/**
 * 마지막 데이터 포인트(오른쪽) 옆에 순위, 이름, 변동을 표시하는 커스텀 플러그인
 */
const endLabelPlugin = {
  id: 'endLabel',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (!meta.hidden && meta.data.length > 0) {
        const lastPoint = meta.data[meta.data.length - 1];
        
        // 원본 데이터 찾기
        const originalItem = TREND_DATA.find(d => d.name === dataset.label);
        const prevRank = originalItem.ranks[0];
        const currRank = originalItem.ranks.at(-1);
        const diff = prevRank - currRank;
        
        let diffStr = '';
        let diffColor = '#8A9BB0'; // 유지
        if (diff > 0) {
          diffStr = `▲ ${diff}`;
          diffColor = '#3A7D44'; // 상승
        } else if (diff < 0) {
          diffStr = `▼ ${Math.abs(diff)}`;
          diffColor = '#C0392B'; // 하락
        } else {
          diffStr = `-`;
        }

        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        
        // 1. 순위 및 이름 쓰기 (선 색상)
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillStyle = dataset.borderColor;
        const mainText = `${currRank}위 ${dataset.label}`;
        ctx.fillText(mainText, lastPoint.x + 8, lastPoint.y);
        
        // 2. 변동 쓰기 (상태에 따른 색상)
        const mainTextWidth = ctx.measureText(mainText + ' ').width;
        ctx.fillStyle = diffColor;
        ctx.fillText(diffStr, lastPoint.x + 8 + mainTextWidth, lastPoint.y);
        
        ctx.restore();
      }
    });
  }
};

/**
 * Chart.js를 사용하여 Bump Chart(5주 순위 변동 라인 차트)를 그립니다.
 * X축: 4주 전 → 현재 (5개 시점)
 * Y축: 1위(상단) ~ 10위(하단) 역순
 */
function renderBumpChart(data) {
  const ctx = document.getElementById('rankChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    plugins: [startLabelPlugin, endLabelPlugin], // 왼쪽, 오른쪽 레이블 플러그인
    data: {
      labels: TREND_LABELS,
      datasets: data.map(item => ({
        label: item.name,
        data: item.ranks,
        borderColor: item.color,
        backgroundColor: 'transparent',
        borderWidth: item.ranks.at(-1) <= 3 ? 2.5 : 1.2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: item.color,
        tension: 0.3,
        // 차트 선에 마우스 오버 시 포인터 변경용 확장 반경
        hitRadius: 10,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 90, right: 120 } // 좌우 레이블 표시 공간 확보
      },
      // 차트의 텍스트 레이블이나 선 근처를 클릭/호버해도 잘 인식되도록 상호작용 설정
      interaction: {
        mode: 'nearest',
        axis: 'y',
        intersect: false
      },
      // 마우스 오버 시 커서 변경
      onHover: (e, elements) => {
        e.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      },
      // 차트 영역 아무 곳이나(레이블 포함) 클릭 시 검색 실행
      onClick: (e, elements, chart) => {
        if (elements.length > 0) {
          const datasetIndex = elements[0].datasetIndex;
          const keyword = chart.data.datasets[datasetIndex].label;
          searchInput.value = keyword.split('/')[0].trim(); // "AI / LLM" -> "AI"
          handleSearch();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFFFFF',
          titleColor: '#1A2332',
          bodyColor: '#4A6A8A',
          borderColor: '#DCE4ED',
          borderWidth: 1,
          callbacks: {
            label: ctx => {
              const item = data[ctx.datasetIndex];
              const week = TREND_LABELS[ctx.dataIndex];
              return ` ${ctx.dataset.label}: ${ctx.raw}위 (${week})`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#EEF2F7' },
          ticks: { color: '#5A6A7E', font: { size: 11 } }
        },
        y: {
          reverse: true,
          min: 1,
          max: 10,
          grid: { color: '#EEF2F7' },
          ticks: { display: false } // y축 숫자(1위~10위) 숨김
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

