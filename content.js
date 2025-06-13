// 마지막으로 가져온 searchAfter 값을 저장하는 변수 (실시간 업데이트용)
let lastSearchAfter = null;

// div.css-1ve7v1a.eq36rvw5 위에 글자를 띄우는 함수
function addTextAboveTargetDiv() {
  // 대상 요소 찾기
  const targetDiv = document.querySelector('div.css-1ve7v1a.eq36rvw5');
  
  if (targetDiv) {
    // 이미 텍스트가 추가되었는지 확인 (중복 방지)
    const existingText = document.querySelector('#custom-text-above-target');
    if (existingText) {
      console.log('이미 텍스트가 추가되어 있습니다.');
      return;
    }
    
    // 텍스트 요소 생성
    const textElement = document.createElement('div');
    textElement.id = 'custom-text-above-target';
    
    // HTML 내용 설정 (링크 포함)
    textElement.innerHTML = `이 확장 프로그램은 폐쇄되었습니다! 대신 <a href="https://chromewebstore.google.com/detail/%EC%97%94%ED%8A%B8%EB%A6%AC-intydse-tyd/efbcdeckfdnjighafklmplnlkjhdggna" target="_blank" rel="noopener noreferrer" style="color: #FFD700; text-decoration: underline; font-weight: bold;">실시간 엔이 V1</a>을 이용해 주세요!`;
    
    // 스타일 적용
    textElement.style.cssText = `
      background-color: #f44336;
      color: white;
      padding: 15px 20px;
      margin: 10px 0;
      border-radius: 5px;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
      position: relative;
      border: 2px solid #d32f2f;
    `;
    
    // 대상 div 바로 위에 텍스트 삽입
    targetDiv.parentNode.insertBefore(textElement, targetDiv);
    
    console.log('div.css-1ve7v1a.eq36rvw5 위에 폐쇄 안내 텍스트가 추가되었습니다.');
  } else {
    console.log('div.css-1ve7v1a.eq36rvw5 요소를 찾을 수 없습니다. 나중에 다시 시도합니다.');
    
    // 요소가 없으면 3초 후에 다시 시도
    setTimeout(addTextAboveTargetDiv, 3000);
  }
}

// 현재 정렬 순서 설명 출력 함수
function logCurrentSortOrder() {
  const sortValue = getSortParameter();
  if (sortValue === "created") {
    console.log("현재 정렬: 생성 순서 - 최신 글이 맨 아래에 표시됩니다.");
  } else {
    console.log(`현재 정렬: ${sortValue} - 최신 글이 맨 아래에 표시됩니다.`);
  }
  
  // 현재 검색어 로그
  const queryValue = getQueryParameter();
  if (queryValue) {
    console.log(`현재 검색어: "${queryValue}"`);
  }
}

// 더보기 클릭 횟수를 저장하는 변수
let showMoreClickCount = 0;

// 새로 추가된 글 카운터
let newlyAddedCount = 0;

// 더보기 요청 진행 중 여부를 추적하는 플래그
let isLoadingMore = false;

// searchAfter 값의 히스토리를 저장하는 배열
let searchAfterHistory = [];

// 기존 요소 제거 함수
function removeElements() {
  // 기존 목록 항목은 유지하되 내용만 비움 (ul 구조는 유지)
  const elements = document.querySelectorAll('li.css-1mswyjj, li.css-1kivsx6.eelonj20');
  elements.forEach(element => {
    // 내부 내용만 제거 (ul 구조는 유지)
    while (element.firstChild) {
      element.firstChild.remove();
    }
  });
}

// 요소 제거를 위한 MutationObserver 설정
function setupElementRemover() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        removeElements();
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 기존 요소 제거
  removeElements();
}

// 이미 처리된 ID를 저장할 Set
const processedIds = new Set();

// 현재 표시된 iframe ID를 추적하는 배열 (순서 유지를 위해 배열 사용)
const displayedStoryIds = [];

// 초기 로드 완료 여부를 추적하는 플래그
let initialLoadComplete = false;

// 모든 iframe 제거 함수
function removeAllIframes() {
  // 기존 iframe 요소들 제거
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    iframe.remove();
  });
  
  // 처리된 ID 목록 초기화
  processedIds.clear();
  
  // 표시된 스토리 ID 배열 초기화
  displayedStoryIds.length = 0;
  
  // 초기 로드 완료 플래그 초기화
  initialLoadComplete = false;
  
  // 더보기 관련 상태 초기화
  showMoreClickCount = 0;
  isLoadingMore = false;
  searchAfterHistory = [];
  currentSearchAfterIndex = -1;
  lastSearchAfter = null;
  newlyAddedCount = 0;
  
  console.log("URL 변경 감지: 모든 iframe이 제거되었습니다. 더보기 상태가 초기화되었습니다.");
}

// URL에서 sort 파라미터 추출 함수
function getSortParameter() {
  const url = window.location.href;
  const match = url.match(/sort=([^&]+)/);
  
  // 기본값은 "created"
  let sortValue = "created";
  
  if (match && match[1]) {
    // URL에서 sort 파라미터 값 추출
    sortValue = match[1];
    console.log(`URL에서 sort 파라미터 감지: ${sortValue}`);
  }
  
  return sortValue;
}

// URL에서 query 파라미터 추출 함수
function getQueryParameter() {
  const url = window.location.href;
  const match = url.match(/query=([^&]+)/);
  
  // query 파라미터가 있으면 디코딩하여 반환, 없으면 undefined 반환
  if (match && match[1]) {
    const queryValue = decodeURIComponent(match[1]);
    console.log(`URL에서 query 파라미터 감지: ${queryValue}`);
    return queryValue;
  }
  
  return undefined;
}

// CSRF 토큰 가져오기
function getCsrfToken() {
  try {
    // 쿠키에서 CSRF 토큰 찾기
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      if (!cookie || cookie.trim() === '') continue;
      
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const name = parts[0];
        const value = parts.slice(1).join('='); // = 문자가 값에 포함될 수 있으므로
        
        if (name === 'csrf-token') {
          return value;
        }
      }
    }
    
    // 메타 태그에서 CSRF 토큰 찾기
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // 네트워크 요청에서 가져올 수 없는 경우 하드코딩된 값 반환
    console.warn('CSRF 토큰을 찾을 수 없어 임시 값을 사용합니다.');
    return 'temp-csrf-token';
  } catch (error) {
    console.error('CSRF 토큰 가져오기 오류:', error);
    return 'temp-csrf-token';
  }
}

// 현재 사용해야 할 searchAfter 인덱스 관리
let currentSearchAfterIndex = -1;

// GraphQL API로 스토리 가져오기
async function fetchStories(isShowMore = false) {
  try {
    // 더보기 로딩 중에는 일반 요청 건너뛰기 (충돌 방지)
    if (!isShowMore && isLoadingMore) {
      console.log("더보기 로딩 중 - 일반 요청 건너뜁니다.");
      return null;
    }
    
    // CSRF 토큰 가져오기
    const csrfToken = getCsrfToken();
    
    // URL에서 sort 파라미터 추출
    const sortValue = getSortParameter();
    
    // URL에서 query 파라미터 추출
    const queryValue = getQueryParameter();
    
    // 요청 변수 객체 생성
    const variables = {
      category: "free",
      searchType: "scroll",
      term: "all", 
      discussType: "entrystory",
      pageParam: {
        display: 10,
        sort: sortValue
      }
    };
    
    // query 파라미터가 있으면 추가
    if (queryValue) {
      variables.query = queryValue;
    }
    
    // 더보기 요청인 경우 적절한 searchAfter 값 사용
    if (isShowMore) {
      // 현재 클릭 횟수에 맞는 searchAfter 값을 가져옴
      let searchAfterToUse = null;
      
      // 히스토리에서 적절한 searchAfter 찾기
      if (showMoreClickCount <= searchAfterHistory.length) {
        searchAfterToUse = searchAfterHistory[showMoreClickCount - 1];
        console.log(`더보기 요청 (${showMoreClickCount}번째): 저장된 searchAfter 사용`);
      } else {
        // 마지막으로 저장된 값 사용
        searchAfterToUse = lastSearchAfter;
        console.log(`더보기 요청 (${showMoreClickCount}번째): 마지막 searchAfter 사용`);
      }
      
      if (searchAfterToUse) {
        variables.searchAfter = searchAfterToUse;
        console.log(`더보기 요청: searchAfter=${JSON.stringify(searchAfterToUse)}`);
      } else {
        console.warn("사용 가능한 searchAfter 값이 없습니다.");
      }
    }
    
    // 요청 바디 생성
    const requestBody = {
      query: `
        query SELECT_ENTRYSTORY(
        $pageParam: PageParam
        $query: String
        $user: String
        $category: String
        $term: String
        $prefix: String
        $progress: String
        $discussType: String
        $searchType: String
        $searchAfter: JSON
        $tag: String
      ){
        discussList(
          pageParam: $pageParam
          query: $query
          user: $user
          category: $category
          term: $term
          prefix: $prefix
          progress: $progress
          discussType: $discussType
          searchType: $searchType
          searchAfter: $searchAfter
          tag: $tag
        ) {
          total
          list {
            id
            content
            created
            commentsLength
            likesLength
            user {
              id
              nickname
              profileImage {
                id
                name
                label {
                  ko
                  en
                  ja
                  vn
                }
                filename
                imageType
                dimension {
                  width
                  height
                }
                trimmed {
                  filename
                  width
                  height
                }
              }
              status {
                following
                follower
              }
              description
              role
              mark {
                id
                name
                label {
                  ko
                  en
                  ja
                  vn
                }
                filename
                imageType
                dimension {
                  width
                  height
                }
                trimmed {
                  filename
                  width
                  height
                }
              }
            }
            image {
              id
              name
              label {
                ko
                en
                ja
                vn
              }
              filename
              imageType
              dimension {
                width
                height
              }
              trimmed {
                filename
                width
                height
              }
            }
            sticker {
              id
              name
              label {
                ko
                en
                ja
                vn
              }
              filename
              imageType
              dimension {
                width
                height
              }
              trimmed {
                filename
                width
                height
              }
            }
            isLike
          }
          searchAfter
        }
      }`,
      variables: variables
    };
    
    const response = await fetch("https://playentry.org/graphql/SELECT_ENTRYSTORY", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "ja",
        "content-type": "application/json",
        "csrf-token": csrfToken,
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-client-type": "Client"
      },
      body: JSON.stringify(requestBody),
      credentials: "include"
    });
    
    try {
      const data = await response.json();
      
      // searchAfter 값 처리
      if (data?.data?.discussList?.searchAfter) {
        if (isShowMore) {
          // 더보기 요청인 경우 새 searchAfter 값을 히스토리에 저장
          const newSearchAfter = data.data.discussList.searchAfter;
          
          // 현재 클릭 횟수에 맞는 위치에 저장
          if (showMoreClickCount <= searchAfterHistory.length) {
            // 기존 위치에 덮어쓰기
            searchAfterHistory[showMoreClickCount] = newSearchAfter;
          } else {
            // 새로운 위치에 추가
            searchAfterHistory.push(newSearchAfter);
          }
          
          console.log(`더보기 요청 (${showMoreClickCount}번째)의 새 searchAfter 값이 저장되었습니다.`);
          console.log(`searchAfter 히스토리 길이: ${searchAfterHistory.length}`);
        } else {
          // 일반 요청인 경우 lastSearchAfter 업데이트
          lastSearchAfter = data.data.discussList.searchAfter;
          
          // 초기값으로 히스토리의 첫 번째 위치에도 저장
          if (searchAfterHistory.length === 0) {
            searchAfterHistory.push(lastSearchAfter);
            console.log(`초기 searchAfter 값이 히스토리에 저장되었습니다.`);
          }
        }
      }
      
      return data;
    } catch (jsonError) {
      console.error("응답 JSON 파싱 오류:", jsonError);
      console.log("원본 응답:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("스토리 가져오기 오류:", error);
    return null;
  }
}

// 현재 URL 저장 변수
let currentUrl = window.location.href;

// Intersection Observer 인스턴스
let intersectionObserver = null;

// iframe의 높이를 자동으로 조절하는 함수
function resizeIframe(iframe) {
  try {
    // 이전 높이 저장용 변수
    let previousHeight = 0;
    
    // iframe이 모두 로드된 후 iframe의 contentWindow에 접근
    const resizer = setInterval(() => {
      try {
        // iframe이 일시정지 상태인 경우 리사이징 건너뛰기
        if (iframe.dataset.suspended === 'true') return;
        
        if (!iframe.contentWindow || !iframe.contentWindow.document.body) return;
        
        // 콘텐츠 높이 가져오기
        const newHeight = iframe.contentWindow.document.body.scrollHeight;
        
        // 이전 높이와 다른 경우에만 업데이트 (증가하거나 감소할 때 모두)
        if (newHeight !== previousHeight) {
          // 최소 높이는 10px로 설정
          const heightToApply = Math.max(10, newHeight);
          iframe.style.height = heightToApply + 'px';
          
          // 현재 높이를 이전 높이로 저장
          previousHeight = newHeight;
        }
      } catch (e) {
        // 보안 정책으로 인한 오류 무시 (cross-origin이면 contentWindow 접근 불가)
      }
    }, 200); // 200ms 간격으로 체크
    
    // 페이지를 떠날 때 interval 정리
    window.addEventListener('beforeunload', () => {
      clearInterval(resizer);
    });
  } catch (error) {
    console.error('iframe 높이 조정 오류:', error);
  }
}

// iframe 내의 모든 링크가 부모 창에서 열리도록 하는 함수
function modifyIframeLinks(iframe) {
  try {
    // iframe이 로드된 후에 실행
    const linkModifier = setInterval(() => {
      try {
        if (!iframe.contentWindow || !iframe.contentWindow.document) return;
        
        // iframe 내의 모든 a 태그 선택
        const links = iframe.contentWindow.document.querySelectorAll('a');
        
        if (links.length > 0) {
          console.log(`iframe(${iframe.dataset.storyId})에서 ${links.length}개의 링크 발견. 부모 창에서 열리도록 설정합니다.`);
          
          // 각 링크에 대해 target 속성 추가 및 클릭 이벤트 수정
          links.forEach(link => {
            // target="_parent" 속성 추가하여 부모 창에서 열리도록 설정
            link.setAttribute('target', '_parent');
            
            // 기존 이벤트 제거하고 새 이벤트 추가
            link.addEventListener('click', function(e) {
              // 기본 동작 방지
              e.preventDefault();
              
              // href 속성 가져오기
              const href = this.getAttribute('href');
              
              if (href) {
                // 부모 창에서 링크 열기
                window.parent.location.href = href;
              }
              
              return false;
            });
          });
          
          // 링크를 모두 처리했으면 interval 종료
          clearInterval(linkModifier);
        }
      } catch (e) {
        // 보안 정책으로 인한 오류 무시 (cross-origin이면 contentWindow 접근 불가)
      }
    }, 1000); // 1초 간격으로 체크
    
    // 페이지를 떠날 때 interval 정리
    window.addEventListener('beforeunload', () => {
      clearInterval(linkModifier);
    });
  } catch (error) {
    console.error('iframe 링크 수정 오류:', error);
  }
}

// iframe에 CSS를 적용하는 함수
function injectCSSToIframe(iframe) {
  iframe.onload = function() {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // CSS 스타일 요소 생성
      const styleEl = document.createElement('style');
      styleEl.textContent = `
          html, body, #root {
              background-color: rgb(242, 242, 242);
          }
          .css-1c5lxa3 {
              position: relative;
              z-index: 100;
              min-width: 1200px;
              display: none !important;
              height: 0px !important;
          }
          .css-1eth5pr {
              position: relative;
              width: 1062px;
              margin: 0px auto;
              padding: 85px 0px 30px;
              border-bottom: none;
              display: none !important;
          }
          .css-b58mdo {
              position: relative;
              min-width: 1062px;
              padding: 48px 0;
              display: none !important;
              height: 0px !important;
          }
          .css-1cnivlj {
              margin-bottom: 0px !important;
              padding-bottom: 0px !important;
          }
          .css-3dxzw4 {
              position: relative;
              width: 1062px;
              padding-top: 0px;
              margin: 0px;
              background: url() !important;
          }
          .css-1a12i88 {
              top: 0;
              margin-top: 0;
              border-top: 0;
              position: sticky;
              padding: 0px;
              z-index: 100;
              display: none !important;
          }
          .css-1jalyy1 {
              position: relative;
              padding-bottom: 0 !important;
          }
          .css-1mswyjj {
              margin-top: 0px !important;
              border-radius: 20px;
          }
          .css-1tk7m4k {
              padding-top: 0px !important;
          }
          .css-3dxzw4 {
              position: relative;
              width: 100% !important;
              padding: 0px !important;
              padding-top: 0px;
              margin: 0px;
              background: url() !important;
          }
          .css-puqjcw {
              position: relative;
              padding: 27px 73px 27px 95px !important;
          }
          .css-1t19ptn a {
              font-size: 14px !important;
              line-height: 16px !important;
          }
          .css-6wq60h {
              margin-top: 7px !important;
              font-size: 16px !important;
              line-height: 22px !important;
          }
          .css-1t19ptn em {
              margin-top: 6px !important;
              font-size: 12px !important;
              line-height: 16px !important;
          }
          .css-1psq3e8 {
            margin-top: 0px !important;
          }
          .css-1dcwahm a {
              font-size: 12px !important;
              line-height: 12px !important;
          }
          .css-1cyfuwa {
              position: relative;
              padding: 24px 27px 18px !important;
              border-radius: 10px !important;
          }
          .css-1cyfuwa {
              padding: 24px 27px 18px !important;
              border-radius: 10px !important;
          }
          .css-1cyfuwa textarea {
              line-height: 22px !important;
              font-size: 16px !important;

          }
          .css-1psq3e8 {
              border: 0px solid rgba(0, 0, 0, 0) !important;
          }
          .css-1kivsx6 {
              margin-top: 0px;
              border-radius: 20px;
          }
      `;
      
      iframeDoc.head.appendChild(styleEl);
      
      // iframe 높이 조절 시작
      resizeIframe(iframe);
      
      // iframe 내의 링크 수정 시작
      modifyIframeLinks(iframe);
      
      console.log('iframe에 CSS 적용 완료:', iframe.src);
      
      // Intersection Observer에 iframe 등록
      observeIframe(iframe);
    } catch (error) {
      // 보안 정책으로 인한 오류 무시 (cross-origin이면 contentDocument 접근 불가)
    }
  };
}

// DOM에서 컨테이너 요소를 찾을 때까지 기다리는 함수
async function waitForContainer() {
  return new Promise((resolve) => {
    // 이미 요소가 존재하는지 확인
    const existingContainer = document.querySelector('ul.css-1urx3um.e18x7bg03');
    if (existingContainer) {
      console.log('ul.css-1urx3um.e18x7bg03 요소를 찾았습니다.');
      return resolve(existingContainer);
    }
    
    console.log('ul.css-1urx3um.e18x7bg03 요소를 찾는 중...');
    
    // 요소가 나타날 때까지 MutationObserver로 감시
    const observer = new MutationObserver((mutations, obs) => {
      const container = document.querySelector('ul.css-1urx3um.e18x7bg03');
      if (container) {
        console.log('ul.css-1urx3um.e18x7bg03 요소가 나타났습니다.');
        obs.disconnect(); // 관찰 중단
        resolve(container);
      }
    });
    
    // 문서 전체 변경 관찰 시작
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // 안전장치: 20초 후에도 요소를 찾지 못하면 타임아웃
    setTimeout(() => {
      observer.disconnect();
      console.warn('컨테이너 요소를 찾지 못했습니다. 다시 시도합니다.');
      // 실패 시 계속 찾음
      waitForContainer().then(resolve);
    }, 20000);
  });
}

// 화면 밖 iframe 일시정지를 위한 Intersection Observer 설정
function setupIntersectionObserver() {
  if (intersectionObserver) return; // 이미 설정된 경우
  
  const options = {
    root: null, // viewport를 root로 사용
    rootMargin: '200px', // 화면 위아래로 200px 여유 공간
    threshold: 0 // 조금이라도 보이면 활성화
  };
  
  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const iframe = entry.target;
      
      if (entry.isIntersecting) {
        // 화면에 보이면 iframe 활성화
        resumeIframe(iframe);
      } else {
        // 화면에서 벗어나면 iframe 일시정지
        suspendIframe(iframe);
      }
    });
  }, options);
  
  console.log('Intersection Observer가 설정되었습니다.');
}

// iframe을 Intersection Observer에 등록
function observeIframe(iframe) {
  if (!intersectionObserver) {
    setupIntersectionObserver();
  }
  
  intersectionObserver.observe(iframe);
  console.log(`Iframe 관찰 시작: ${iframe.dataset.storyId}`);
}

// iframe 일시정지 함수
function suspendIframe(iframe) {
  if (iframe.dataset.suspended === 'true') return; // 이미 일시정지됨
  
  // iframe 일시정지 (리소스 사용 최소화하면서 레이아웃은 유지)
  iframe.style.visibility = 'hidden';
  
  // 일시정지 상태 표시
  iframe.dataset.suspended = 'true';
  
  console.log(`Iframe 일시정지: ${iframe.dataset.storyId || 'unknown'}`);
}

// iframe 재개(복원) 함수
function resumeIframe(iframe) {
  if (iframe.dataset.suspended !== 'true') return; // 일시정지 상태가 아님
  
  // iframe 재개
  iframe.style.visibility = 'visible';
  
  // 일시정지 상태 해제
  iframe.dataset.suspended = 'false';
  
  console.log(`Iframe 재개: ${iframe.dataset.storyId || 'unknown'}`);
}

// 순차적으로 스토리 처리 및 iframe 생성
async function processStories(data, isShowMore = false) {
  if (!data || !data.data || !data.data.discussList || !data.data.discussList.list) {
    console.error("유효한 데이터가 없습니다.");
    return;
  }
  
  // ul.css-1urx3um 요소를 찾을 때까지 기다림
  const container = await waitForContainer();
  
  if (isShowMore) {
    console.log(`더보기 요청(${showMoreClickCount}번째)으로 iframe을 컨테이너에 순차적으로 추가합니다.`);
  } else {
    console.log('iframe을 컨테이너에 순차적으로 추가합니다.');
  }
  
  // 스토리 목록 가져오기
  const stories = data.data.discussList.list;
  
  // 더보기 요청일 때만 정렬 적용 (초기 로드 시에는 서버에서 온 순서 그대로 유지)
  if (isShowMore && stories.length > 0) {
    // 더보기 요청인 경우에만 날짜순으로 정렬 (생성일 내림차순)
    stories.sort((a, b) => {
      return new Date(b.created) - new Date(a.created);
    });
    console.log(`더보기 데이터를 날짜순으로 재정렬했습니다 (${stories.length}개 항목).`);
  } else if (!isShowMore) {
    // 초기 로드 시에는 정렬하지 않고 서버에서 받은 순서 그대로 표시
    console.log(`초기 로드: 서버에서 받은 순서 그대로 표시합니다 (${stories.length}개 항목).`);
  }
  
  let hasNewStories = false;
  
  // 현재 정렬 방식 가져오기
  const currentSort = getSortParameter();
  
  // 더보기 요청인 경우 이전에 이미 표시된 아이템이 있는지 확인
  if (isShowMore) {
    console.log(`더보기 요청으로 받은 스토리 수: ${stories.length}`);
    // 이미 처리된 ID 수 로깅
    const alreadyProcessedCount = stories.filter(story => processedIds.has(story.id)).length;
    console.log(`이미 처리된 ID 수: ${alreadyProcessedCount}/${stories.length}`);
  }
  
  // 순차적으로 iframe 추가
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const id = story.id;
    
    // 이미 처리된 ID인지 확인
    if (!processedIds.has(id)) {
      // 새 iframe 생성을 Promise로 래핑하여 순차적으로 처리
      await new Promise(resolve => {
        // 새 iframe 생성
        const iframe = document.createElement('iframe');
        iframe.src = `https://playentry.org/community/entrystory/${id}`;
        iframe.width = '100%';
        iframe.height = '20px';
        iframe.style.border = 'none';
        iframe.style.marginBottom = '10px';
        iframe.style.backgroundColor = '#fff';
        
        // 더보기 구분을 위한 데이터 속성 추가
        iframe.dataset.storyId = id;
        if (isShowMore) {
          iframe.dataset.showMoreIndex = showMoreClickCount;
        }
        
        // CSS 삽입 설정
        injectCSSToIframe(iframe);
        
        if (isShowMore) {
          // 더보기 요청인 경우 맨 아래에 추가
          container.appendChild(iframe);
          displayedStoryIds.push(id);
        } else if (!initialLoadComplete) {
          // 초기 로드 시에는 서버에서 받은 순서 그대로 맨 아래에 추가 (순서 유지)
          container.appendChild(iframe);
          displayedStoryIds.push(id);
          
          // 새로 추가된 글 카운트 증가
          newlyAddedCount++;
        } else {
          // 초기 로드 완료 후 실시간 업데이트에서는 맨 위에 추가 (새 글이 맨 위에 보이게)
          if (container.firstChild) {
            container.insertBefore(iframe, container.firstChild);
          } else {
            container.appendChild(iframe);
          }
          
          // 맨 위에 추가했으므로 배열 맨 앞에 추가
          displayedStoryIds.unshift(id);
          
          // 새로 추가된 글 카운트 증가
          newlyAddedCount++;
          
          // 초기 로드가 완료된 후에만 오래된 글 제거 적용
          if (newlyAddedCount > 0) {
            // Y좌표 기준으로 현재 표시된 모든 iframe을 정렬
            const allIframes = Array.from(container.querySelectorAll('iframe'));
            
            console.log(`현재 표시된 전체 iframe 수: ${allIframes.length}`);
            
            // 제거할 수를 전체 iframe 수의 50%로 제한 (안전장치)
            const maxRemovable = Math.floor(allIframes.length * 0.5);
            const removeCount = Math.min(newlyAddedCount, maxRemovable);
            
            if (removeCount > 0 && removeCount < allIframes.length) {
              console.log(`신규 글 ${newlyAddedCount}개 추가로 인해 ${removeCount}개의 가장 아래 iframe을 제거합니다 (안전장치: 최대 ${maxRemovable}개).`);
              
              // displayedStoryIds 배열 뒷부분(오래된 항목)에서부터 제거할 ID 추출
              const storyIdsToRemove = displayedStoryIds.slice(-removeCount);
              
              if (storyIdsToRemove.length > 0) {
                console.log(`제거할 글 ID: ${storyIdsToRemove.join(', ')}`);
                
                // ID 기준으로 iframe 찾아서 제거
                storyIdsToRemove.forEach(storyId => {
                  const iframeToRemove = Array.from(container.querySelectorAll('iframe'))
                    .find(iframe => iframe.dataset.storyId === storyId);
                  
                  if (iframeToRemove) {
                    // iframe 제거
                    iframeToRemove.remove();
                    console.log(`오래된 글 iframe이 제거되었습니다: ${storyId}`);
                    
                    // displayedStoryIds 배열에서 해당 ID 제거
                    const index = displayedStoryIds.indexOf(storyId);
                    if (index !== -1) {
                      displayedStoryIds.splice(index, 1);
                    }
                  }
                });
                
                // 제거 후 남은 iframe 수 로깅
                console.log(`제거 후 남은 iframe 수: ${container.querySelectorAll('iframe').length}`);
              }
              
              // 제거 카운트 초기화 (제거한 만큼 카운트 감소)
              newlyAddedCount = Math.max(0, newlyAddedCount - removeCount);
            } else {
              console.log(`글 제거 건너뜀: 제거할 수(${removeCount})가 0이거나 전체 iframe 수(${allIframes.length})와 같거나 큽니다.`);
            }
          }
        }
        
        // ID를 처리됨으로 표시 (항상 중복 방지를 위해 기록)
        processedIds.add(id);
        hasNewStories = true;
        
        // 다음 iframe을 추가하기 전에 짧은 지연 (순차 로딩)
        setTimeout(resolve, 150); // 150ms 지연
      });
    }
  }
  
  // 새 스토리가 있으면 콘솔에 알림
  if (hasNewStories) {
    if (isShowMore) {
      console.log(`더보기 요청으로 새 스토리가 추가되었습니다. (클릭 횟수: ${showMoreClickCount})`);
    } else {
      console.log(`새 스토리가 추가되었습니다.`);
    }
  } else {
    if (isShowMore) {
      console.log(`더보기 요청이 처리되었지만 새 스토리가 없습니다. (클릭 횟수: ${showMoreClickCount})`);
    }
  }
  
  // 초기 로드 완료 표시
  initialLoadComplete = true;
}

// 더보기 버튼 감시 및 클릭 이벤트 추가 함수
function setupShowMoreButton() {
  // 더보기 버튼을 찾아 이벤트 추가하는 함수
  const addShowMoreEvent = () => {
    const showMoreButton = document.querySelector('button.css-qtq074.e18x7bg02');
    
    if (showMoreButton && !showMoreButton.dataset.handlerAdded) {
      console.log('더보기 버튼을 찾았습니다. 이벤트를 추가합니다.');
      
      // 기존 이벤트 제거 (preventDefault()와 stopPropagation()으로도 처리 가능하지만 안전을 위해)
      const newButton = showMoreButton.cloneNode(true);
      showMoreButton.parentNode.replaceChild(newButton, showMoreButton);
      
      // 새 이벤트 추가
      newButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 이미 로딩 중이면 중복 요청 방지
        if (isLoadingMore) {
          console.log('이미 더보기 로딩 중입니다. 요청을 무시합니다.');
          return false;
        }
        
        console.log('더보기 버튼이 클릭되었습니다.');
        
        // 더보기 횟수 증가
        showMoreClickCount++;
        console.log(`현재 더보기 클릭 횟수: ${showMoreClickCount}`);
        
        // 로딩 플래그 설정
        isLoadingMore = true;
        
        // 로딩 표시
        newButton.textContent = '로딩 중...';
        newButton.disabled = true;
        
        try {
          // 이전 글 데이터 가져오기 (더보기 요청)
          const data = await fetchStories(true);
          
          if (data && data.data && data.data.discussList && data.data.discussList.list) {
            // 가져온 데이터로 iframe 생성 및 추가
            await processStories(data, true);
            
            // 데이터가 없거나 비어있으면 안내 메시지
            if (!data.data.discussList.list.length) {
              console.log('더 이상 불러올 데이터가 없습니다.');
              newButton.textContent = '더 이상 글이 없습니다';
              
              // 일정 시간 후 버튼 원래대로 복원
              setTimeout(() => {
                newButton.textContent = '더 보기';
                newButton.disabled = false;
              }, 3000);
            } else {
              newButton.textContent = '더 보기';
              newButton.disabled = false;
            }
          } else {
            console.warn('더보기 요청에서 유효한 데이터를 받지 못했습니다.');
            newButton.textContent = '다시 시도';
            newButton.disabled = false;
          }
        } catch (error) {
          console.error('더보기 처리 중 오류 발생:', error);
          // 버튼 텍스트 복원 및 재시도 유도
          newButton.textContent = '다시 시도';
          newButton.disabled = false;
        } finally {
          // 로딩 플래그 해제
          isLoadingMore = false;
        }
        
        return false;
      });
      
      // 이벤트 추가 표시
      newButton.dataset.handlerAdded = 'true';
      
      console.log('더보기 버튼에 이벤트가 추가되었습니다.');
    }
  };
  
  // 초기 호출
  addShowMoreEvent();
  
  // MutationObserver로 DOM 변경 감시 (버튼이 동적으로 추가될 수 있으므로)
  const observer = new MutationObserver(() => {
    // 더보기 버튼이 있는지 확인
    addShowMoreEvent();
  });
  
  // 문서 전체 변경 관찰 시작
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('더보기 버튼 감시가 설정되었습니다.');
}

// URL 변경 감지 및 처리 함수
function setupUrlChangeDetection() {
  // URL 변경 감지를 위한 interval 설정
  setInterval(() => {
    const newUrl = window.location.href;
    
    // URL이 변경되었는지 확인
    if (newUrl !== currentUrl) {
      console.log(`URL 변경 감지: ${currentUrl} -> ${newUrl}`);
      
      // 현재 URL 업데이트
      currentUrl = newUrl;
      
      // 모든 iframe 제거 및 처리된 ID 초기화
      removeAllIframes();
      
      // 페이지 다시 초기화 (새 URL에 맞게)
      initialize();
    }
  }, 500); // 500ms 간격으로 URL 변경 확인
}

// 스토리 가져오기 타이머 설정
function setupStoryFetcher() {
  // 초기 가져오기 - 비동기 함수로 변경
  (async () => {
    try {
      const data = await fetchStories();
      await processStories(data);
      
      // 초기 로드 완료 후 newlyAddedCount 초기화
      newlyAddedCount = 0;
      console.log("초기 로드 완료 후 newlyAddedCount 초기화");
    } catch (error) {
      console.error("초기 스토리 가져오기 오류:", error);
    }
  })();
  
  // 일정 간격으로 가져오기 (더보기 요청 중이 아닐 때만)
  let fetchInterval = 2000; // 2초 간격 (1초보다 좀 더 긴 간격으로 수정)
  
  // 간격 조정 함수
  const adjustFetchInterval = () => {
    // 더보기 요청 진행 중이면 간격 늘림
    if (isLoadingMore) {
      fetchInterval = 3000; // 3초로 변경 (5초에서 축소)
    } else {
      fetchInterval = 2000; // 2초
    }
  };
  
  // 주기적 가져오기 설정
  const periodicFetch = async () => {
    try {
      // 더보기 로딩 중이 아닐 때만 가져오기
      if (!isLoadingMore) {
        const data = await fetchStories();
        if (data) {
          await processStories(data);
        }
      } else {
        console.log("더보기 로딩 중 - 일반 요청 건너뜁니다.");
      }
    } catch (error) {
      console.error("주기적 스토리 가져오기 오류:", error);
    }
    
    // 간격 조정
    adjustFetchInterval();
    
    // 다음 실행 예약
    setTimeout(periodicFetch, fetchInterval);
  };
  
  // 첫 번째 주기적 가져오기 시작
  setTimeout(periodicFetch, fetchInterval);
}

// 메인 초기화 함수
function initialize() {
  console.log("Entry Story Viewer 확장 프로그램이 실행되었습니다.");
  
  // 현재 URL 확인
  const pageUrl = window.location.href;
  
  // 개별 스토리 페이지에서는 작동하지 않도록 확인
  if (pageUrl.match(/https:\/\/playentry\.org\/community\/entrystory\/[^\/]+$/) && 
      !pageUrl.includes('/list')) {
    console.log("개별 스토리 페이지에서는 작동하지 않습니다.");
    return;
  }
  
  // 리스트 페이지에서만 작동
  if (pageUrl.includes('/list') || pageUrl.endsWith('/entrystory/')) {
    // div.css-1ve7v1a.eq36rvw5 위에 텍스트 추가
    addTextAboveTargetDiv();
    
    // 현재 정렬 순서 로그 출력
    logCurrentSortOrder();
    
    // 더보기 클릭 횟수 초기화
    showMoreClickCount = 0;
    
    // 기존 요소 제거
    setupElementRemover();
    
    // 더보기 버튼 설정
    setupShowMoreButton();
    
    // Intersection Observer 설정 (화면 밖 iframe 일시정지용)
    setupIntersectionObserver();
    
    // 스토리 가져오기 설정
    setupStoryFetcher();
  }
}

// 페이지 로드 완료 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    // URL 변경 감지 설정
    setupUrlChangeDetection();
  });
} else {
  initialize();
  // URL 변경 감지 설정
  setupUrlChangeDetection();
}