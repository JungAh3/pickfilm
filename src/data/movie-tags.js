// 감상 경험은 줄거리 기반 PICKFILM 초기 편집 기준입니다.
// 숫자는 감상 경험의 상대적인 적합도이며 만족 확률이 아닙니다.
//
// reviewed: 추천용 편집 태그 작성 여부
// avoids: 회피 요소별 검토 결과
//
// 회피 요소는 unknown으로 시작하고,
// 외부 관람 안내에서 확인한 항목만 아래에서 갱신합니다.

const unknownAvoids = () => ({
  violence: 'unknown',
  horror: 'unknown',
  slow: 'unknown',
  heavy: 'unknown',
});

export const movieTags = {
  550: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      thrill: 1,
      linger: 0.7,
    },
    avoids: unknownAvoids(),
    reason:
      '일상의 공허함에서 시작해 비밀 모임으로 번지는 이야기가 긴장감과 해석할 거리를 제공합니다.',
  },

  496243: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      thrill: 1,
      linger: 1,
    },
    avoids: unknownAvoids(),
    reason:
      '서로 다른 두 가족의 만남을 통해 긴장감과 계층에 관한 생각할 거리를 제공합니다.',
  },

  27205: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      thrill: 1,
      linger: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '꿈속에 생각을 심는 임무와 겹겹의 꿈이라는 설정에 집중하며 몰입하기 좋은 후보입니다.',
  },

  157336: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      linger: 1,
      thrill: 0.7,
    },
    avoids: unknownAvoids(),
    reason:
      '우주 탐사와 가족의 이별을 함께 다뤄 모험의 긴장감과 감정적인 여운을 기대할 수 있습니다.',
  },

  77338: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      comfort: 1,
      refresh: 0.8,
      laugh: 0.7,
      linger: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '서로 다른 두 사람이 우정을 쌓고 함께 웃는 이야기를 통해 위로와 기분 전환을 기대할 수 있습니다.',
  },

  808: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      laugh: 1,
      refresh: 1,
    },
    avoids: unknownAvoids(),
    reason:
      '혼자 살던 슈렉과 수다스러운 동키가 뜻밖의 모험에 나서는 설정으로 웃음과 기분 전환을 기대할 수 있습니다.',
  },

  425: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      refresh: 1,
      laugh: 0.8,
      comfort: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '성격이 다른 동물들이 아기의 가족을 찾아 함께 여행하는 이야기로 모험의 즐거움과 따뜻함을 기대할 수 있습니다.',
  },

  8392: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      comfort: 1,
      refresh: 0.7,
      linger: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '시골로 이사한 자매가 자연과 신비로운 존재를 만나는 이야기로 포근한 감상 경험을 기대할 수 있습니다.',
  },
};
// 외부 관람 안내를 바탕으로 확인한 항목만 갱신합니다.
// absent는 PICKFILM의 '상세한 유혈·상처·신체 훼손' 기준입니다.
// 모든 폭력이나 불편한 장면이 없다는 뜻은 아닙니다.
//
// 느린 전개·무거운 분위기는 기관의 등급과 직접 대응하지 않아
// 근거가 부족한 경우 unknown을 유지합니다.

const contentReviews = {
  550: {
    avoids: {
      violence: 'present',
      horror: 'present',
    },
    note: '상세한 유혈·상처 묘사와 강한 위협 장면이 안내되어 있습니다.',
    source:
      'https://www.bbfc.co.uk/release/fight-club-q29sbgvjdglvbjpwwc00mdy1mjc',
  },

  496243: {
    avoids: {
      violence: 'present',
    },
    note: '흉기와 둔기에 의한 폭력 및 유혈 묘사가 안내되어 있습니다.',
    source:
      'https://www.bbfc.co.uk/release/parasite-q29sbgvjdglvbjpwwc00otg4ndq',
  },

  27205: {
    avoids: {
      violence: 'present',
      horror: 'present',
    },
    note: '총격·격투 후 피가 보이는 장면과 폭발·충돌 등의 위협이 안내되어 있습니다.',
    source:
      'https://www.bbfc.co.uk/release/inception-q29sbgvjdglvbjpwwc00mjqznzc',
  },

  157336: {
    avoids: {
      violence: 'absent',
      horror: 'present',
    },
    note: '몸싸움은 있지만 상세한 부상 묘사는 없다고 안내됩니다. 우주 탐사의 위협 장면은 있습니다.',
    source:
      'https://www.bbfc.co.uk/release/interstellar-q29sbgvjdglvbjpwwc0zode4nzi',
  },

  808: {
    avoids: {
      violence: 'absent',
      horror: 'present',
    },
    note: '가벼운 희극적 폭력과 용의 추격이 있습니다. 상세한 부상 묘사는 없다고 안내됩니다.',
    source:
      'https://www.bbfc.co.uk/release/shrek-q29sbgvjdglvbjpwwc0zndmxnte',
  },

  425: {
    avoids: {
      violence: 'absent',
      horror: 'present',
    },
    note: '가벼운 타격 장면과 동물·자연재해에 의한 위협이 있습니다. 상세한 상해 묘사는 없는 것으로 분류했습니다.',
    source:
      'https://www.bbfc.co.uk/release/ice-age-q29sbgvjdglvbjpwwc0zmzaymte',
  },

  8392: {
    avoids: {
      horror: 'present',
    },
    note: '큰 생물과 만나는 장면 및 아이가 실종되는 장면에 짧은 위협이 있다고 안내됩니다.',
    source:
      'https://www.bbfc.co.uk/release/my-neighbor-totoro-q29sbgvjdglvbjpwwc0yotgzndc',
  },
};

for (const [id, review] of Object.entries(contentReviews)) {
  const tags = movieTags[id];
  if (!tags) continue;

  Object.assign(tags.avoids, review.avoids);

  tags.contentReview = {
    note: review.note,
    source: review.source,
    checkedAt: '2026-11-11',
    basis: '영국 BBFC 관람 안내 기반 PICKFILM 분류',
  };
}
// 기존 후보 중 감상 태그가 없던 5편을 추가합니다.
// 회피 요소는 별도 검토 전이므로 unknown을 유지합니다.

Object.assign(movieTags, {
  122906: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      comfort: 1,
      linger: 1,
      refresh: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '시간을 되돌리는 능력으로 사랑과 일상의 의미를 배워 가는 이야기로, 따뜻함과 감정적인 여운을 기대할 수 있습니다.',
  },

  313369: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      linger: 1,
      refresh: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '꿈을 좇는 두 사람의 만남을 음악과 함께 따라가며, 사랑과 선택에 관한 여운을 기대할 수 있습니다.',
  },

  194: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      refresh: 1,
      comfort: 0.8,
      linger: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '주변 사람들에게 작은 행복을 선물하는 주인공의 이야기를 통해 일상을 새롭게 바라보는 즐거움을 기대할 수 있습니다.',
  },

  120467: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      refresh: 1,
      laugh: 0.8,
      thrill: 0.5,
    },
    avoids: unknownAvoids(),
    reason:
      '호텔 지배인과 로비보이가 유산과 누명을 둘러싼 사건에 휘말리는 독특한 모험으로 기분 전환을 기대할 수 있습니다.',
  },

  372058: {
    reviewed: true,
    reviewBasis: '줄거리 기반 초기 편집 분류',
    experiences: {
      linger: 1,
      thrill: 0.6,
    },
    avoids: unknownAvoids(),
    reason:
      '몸이 바뀌는 두 사람의 인연과 서로를 찾아가는 과정을 통해 궁금증과 감정적인 여운을 기대할 수 있습니다.',
  },
});
// 자동 검색으로 발견한 영화의 초기 감상 태그입니다.
// 이용자가 보내 준 TMDB 줄거리를 바탕으로 한 편집 판단입니다.
// 감상 경험 점수는 만족 확률이 아닙니다.
// 회피 요소는 외부 관람 안내 확인 전까지 unknown입니다.

function createInitialTags(experiences, reason) {
  return {
    reviewed: true,
    reviewBasis: 'TMDB 줄거리 기반 초기 편집 분류',
    experiences,
    avoids: unknownAvoids(),
    reason,
  };
}

Object.assign(movieTags, {
  755898: createInitialTags(
    { thrill: 1 },
    '외계 침공과 기술·감시를 둘러싼 위협을 다루는 설정으로 긴장감 있는 감상을 기대할 수 있습니다.',
  ),

  1084244: createInitialTags(
    { refresh: 1, laugh: 0.7, comfort: 0.6 },
    '전자기기의 등장으로 달라진 일상에 장난감들이 함께 맞서는 이야기로 모험의 즐거움과 우정의 따뜻함을 기대할 수 있습니다.',
  ),

  1571955: createInitialTags(
    { thrill: 1 },
    '은행 강도 사건이 속임수와 생존을 건 상황으로 번지는 이야기로 사건의 전개를 따라가는 긴장감을 기대할 수 있습니다.',
  ),

  9479: createInitialTags(
    { refresh: 1, laugh: 0.6 },
    '할로윈 마을의 주인공이 크리스마스를 맡으며 벌어지는 소동으로 독특한 분위기의 기분 전환을 기대할 수 있습니다.',
  ),

  1108427: createInitialTags(
    { refresh: 1, thrill: 0.6 },
    '섬을 구하기 위해 전설의 영웅과 바다로 떠나는 이야기로 새로운 세계를 탐험하는 즐거움을 기대할 수 있습니다.',
  ),

  1780005: createInitialTags(
    { thrill: 1, linger: 0.7 },
    '허리케인 속에서 두 형제가 함께 생존을 위해 싸우는 이야기로 긴장감과 관계에 관한 여운을 기대할 수 있습니다.',
  ),

  27: createInitialTags(
    { linger: 0.7 },
    '공연과 연인의 만남·이별을 중심으로 흘러가는 이야기로 관계의 순간들에 관한 여운을 기대할 수 있습니다.',
  ),

  1084242: createInitialTags(
    { refresh: 1, laugh: 0.7, thrill: 0.7 },
    '주디와 닉이 도시의 혼란을 해결하기 위해 잠입 수사에 나서는 이야기로 유쾌한 모험과 추리의 재미를 기대할 수 있습니다.',
  ),

  1236045: createInitialTags(
    { thrill: 1 },
    '납치 사건과 가족의 비밀이 얽히며 선택을 압박하는 이야기로 긴장감 있는 감상을 기대할 수 있습니다.',
  ),

  1110034: createInitialTags(
    { thrill: 1 },
    '바다에서 이어지는 실종 사건과 거대한 존재의 비밀을 추적하는 이야기로 공포와 긴장감을 기대할 수 있습니다.',
  ),

  1727734: createInitialTags(
    { laugh: 0.8, refresh: 0.6 },
    '뜻밖의 임신 소식을 접한 주인공이 과거의 영광을 찾아 나서며 갈등에 휘말리는 설정으로 소동극의 웃음을 기대할 수 있습니다.',
  ),

  772: createInitialTags(
    { laugh: 1, refresh: 1 },
    '뉴욕에 홀로 남은 케빈이 기지를 발휘해 위기를 헤쳐 나가는 이야기로 소동과 모험의 재미를 기대할 수 있습니다.',
  ),

  1366: createInitialTags(
    { linger: 1, thrill: 0.7 },
    '무명 복서가 뜻밖의 도전 기회를 붙잡는 이야기로 도전 과정의 긴장감과 삶에 관한 여운을 기대할 수 있습니다.',
  ),

  862: createInitialTags(
    { refresh: 1, laugh: 0.8, comfort: 0.7 },
    '서로 다른 장난감들이 갈등을 겪고 친구를 구하기 위해 힘을 모으는 이야기로 모험의 즐거움과 우정의 따뜻함을 기대할 수 있습니다.',
  ),

  1327819: createInitialTags(
    { refresh: 1, laugh: 0.7 },
    '동물의 세계에 들어간 주인공이 그들만의 질서와 마주하는 설정으로 낯선 세계를 탐험하는 즐거움을 기대할 수 있습니다.',
  ),

  244786: createInitialTags(
    { thrill: 1, linger: 0.8 },
    '최고를 꿈꾸는 드러머와 강압적인 교수의 충돌을 통해 심리적 긴장감과 성취의 대가에 관한 여운을 기대할 수 있습니다.',
  ),

  105: createInitialTags(
    { refresh: 1, laugh: 0.7, thrill: 0.7 },
    '과거에 도착한 소년이 부모의 만남과 자신의 귀환을 성사시키려는 이야기로 시간여행 모험의 재미를 기대할 수 있습니다.',
  ),
});