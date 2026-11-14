export function setupCredits() {
  if (document.querySelector('#pickfilm-credits')) return;

  const section = document.createElement('section');
  section.id = 'pickfilm-credits';
  section.className = 'credits';

  section.innerHTML = `
    <details>
      <summary>서비스 소개 · 데이터 출처</summary>

      <div class="credits-content">
        <h2>PICKFILM 소개</h2>
        <p>
          원하는 감상 경험과 회피 요소, 선호 장르,
          시청 시간 및 이용 OTT를 반영해
          최대 3편의 영화를 추천하고 한 편의 결정을 돕습니다.
        </p>

        <h3>영화 정보</h3>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          class="tmdb-credit-link"
        >
          <img
            src="/tmdb-logo.svg"
            alt="TMDB"
            width="100"
          />
        </a>
        <p>
          제목·줄거리·포스터·장르·상영시간·평점은
          TMDB API를 이용합니다.
        </p>
        <p lang="en">
          This product uses the TMDB API but is not
          endorsed or certified by TMDB.
        </p>

        <h3>OTT 제공 정보</h3>
        <p>
          제공처 정보의 출처는
          <a
            href="https://www.justwatch.com/kr"
            target="_blank"
            rel="noopener noreferrer"
          >JustWatch</a>이며 TMDB API를 통해 조회합니다.
          한국의 구독형 제공 목록을 기준으로 하고,
          대여·구매 상품은 추천 대상에서 제외합니다.
          실제 제공 여부와 이용 조건은 각 서비스에서 확인해 주세요.
        </p>

        <h3>감상 태그와 추천 기준</h3>
        <p>
          감상 경험은 줄거리 기반 PICKFILM의 초기 편집 분류입니다.
          감상 경험·선호 장르·평점을 바탕으로 순서를 정하며,
          개인의 만족을 보장하는 수치는 아닙니다.
        </p>
        <p>
          회피 요소는 외부 관람 안내를 참고해 분류합니다.
          미확인은 해당 장면이 없다는 뜻이 아니며,
          선택한 회피 요소가 미확인인 영화도 추천에서 제외합니다.
          확인한 출처는 영화 상세 화면에서 볼 수 있습니다.
        </p>

        <h3>현재 제공 범위</h3>
        <p>
          현재는 선정된 후보 목록 안에서 추천합니다.
          모든 OTT 영화가 포함된 것은 아니므로,
          조건에 맞는 영화가 3편보다 적거나 없을 수 있습니다.
        </p>
      </div>
    </details>
  `;

  const footer = document.querySelector('footer');

  if (footer) {
    footer.before(section);
  } else {
    document.querySelector('#app').append(section);
  }
}