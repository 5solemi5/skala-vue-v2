<script setup>
import { useId } from 'vue'

/*
 * 무대 한 장.
 *
 * 800×260 화폭에 하늘·지면·모티프를 그린다.
 * 접혀 있을 때는 이 그림의 아래쪽만 잘라 보여주고, 펼치면 전부 드러난다.
 * 늘려서 채우지 않기 때문에 어느 쪽에서도 비율이 찌그러지지 않는다.
 *
 * 모티프는 무대마다 하나뿐이고 중앙에서 오른쪽으로 치우쳐 앉는다.
 * 참고한 표지 열세 장 모두 정중앙 배치가 없었다.
 *
 * 각인형 무대에서는 모티프가 얇은 금선이고,
 * 일러스트형에서는 면으로 칠하고 흰 테두리를 두른다.
 */
defineProps({
  stage: { type: Object, required: true },
  /*
   * 판이 펼쳐졌는지.
   *
   * 처음에는 부모의 .stage.open 을 :global() 로 참조해서 모티프를 띄웠다.
   * 컴포넌트 경계를 넘는 선택자라 scoped 규칙과 어긋나 아무것도 안 보였다.
   * 상태를 넘겨받으면 이 파일 안에서만 따지면 된다.
   */
  open: { type: Boolean, default: false },
})

const uid = useId()
</script>

<template>
  <svg
    class="scene"
    viewBox="0 0 800 260"
    :class="[stage.lang, { open }]"
    aria-hidden="true"
  >
    <defs>
      <!--
        결.
        이 브랜드의 표지는 색을 여러 개 쓰는 게 아니라 한 색을 질감으로 흔든다.
        그래서 그라디언트가 아니라 아주 고운 잡음을 얹는다.
      -->
      <filter :id="`grain-${uid}`" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <linearGradient :id="`sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="stage.sky" />
        <stop offset="100%" :stop-color="stage.mid" />
      </linearGradient>
      <!-- 스티커 컷아웃용 흰 테두리 -->
      <filter :id="`cut-${uid}`">
        <feMorphology operator="dilate" radius="2.6" />
        <feFlood flood-color="#fff" result="w" />
        <feComposite in="w" in2="SourceAlpha" operator="in" />
        <feComposite in="SourceGraphic" />
      </filter>
    </defs>

    <rect x="0" y="0" width="800" height="260" :fill="`url(#sky-${uid})`" />

    <!-- ── 모티프 ───────────────────────────────── -->
    <g
      class="motif"
      :stroke="stage.accent"
      :fill="stage.lang === 'illustrated' ? stage.accent : 'none'"
      :filter="stage.lang === 'illustrated' ? `url(#cut-${uid})` : undefined"
    >
      <!-- 들판 — 나무 한 그루 -->
      <g v-if="stage.motif === 'tree'">
        <path d="M596 200V96" />
        <path d="M596 132l-28-22M596 150l30-24M596 114l-20-18" />
        <path d="M548 96a48 36 0 0 1 96 0a48 32 0 0 1-96 0z" />
      </g>

      <!-- 바닷가 — 갈매기 하나 -->
      <g v-else-if="stage.motif === 'gull'">
        <path d="M520 96c22-30 44-34 62-12c18-22 40-18 62 12c-24-10-44-4-62 12c-18-16-38-22-62-12z" />
      </g>

      <!-- 밤하늘 — 초승달 -->
      <g v-else-if="stage.motif === 'moon'">
        <path d="M628 62a38 38 0 1 0 30 60a30 30 0 1 1-30-60z" />
        <path d="M556 128l4-11 4 11 11 4-11 4-4 11-4-11-11-4z" />
      </g>

      <!-- 눈밭 — 앙상한 나무 -->
      <g v-else-if="stage.motif === 'bareTree'">
        <path d="M600 202V74" />
        <path d="M600 116l-32-28M600 140l34-30M600 94l-24-24M600 160l-28-22M600 106l28-26" />
      </g>

      <!-- 골목 — 가로등 -->
      <g v-else-if="stage.motif === 'lamp'">
        <path d="M616 204V76" />
        <path d="M616 76h-36" />
        <path d="M566 76a13 10 0 0 0 26 0z" />
        <path d="M579 96l-9 18M579 96l9 18M579 96v22" class="dim" />
      </g>

      <!-- #001 보이저 — 먹 붓으로 그린 탐사선. 접시만 금박 -->
      <g v-else-if="stage.motif === 'voyagerInk'">
        <g :stroke="stage.ink" stroke-width="2.4">
          <path d="M600 118v34M566 96L486 40M636 100l84-52M600 84V40" />
          <path d="M584 118h32l4 14h-40z" />
        </g>
        <ellipse cx="600" cy="88" rx="40" ry="34" :stroke="stage.accent" stroke-width="2.6" />
        <ellipse cx="600" cy="88" rx="19" ry="16" :stroke="stage.accent" stroke-width="1.6" />
      </g>

      <!-- #002 공룡 -->
      <g v-else-if="stage.motif === 'dino'">
        <path
          d="M540 168c-4-30 10-52 34-60c6-22 26-32 46-24c18 7 24 26 18 42c14 8 20 22 16 36c-4 10-14 8-18 0c-4 12-16 14-22 4c-8 10-22 8-26-2c-10 12-26 12-30 4c-8 6-16 4-18 0z"
        />
        <circle cx="616" cy="96" r="3.2" fill="#1c1c20" stroke="none" />
      </g>

      <!-- #005 사랑 — 광택 차이로만 드러나는 덩굴 -->
      <g v-else-if="stage.motif === 'vine'">
        <g class="gloss">
          <path d="M470 176c40-6 60-28 66-58c4-22 20-34 40-30" />
          <path d="M536 118a13 13 0 1 0 0-26a13 13 0 0 0 0 26z" />
          <path d="M576 88a11 11 0 1 0 0-22a11 11 0 0 0 0 22z" />
          <path d="M614 108c30-4 46-22 48-46" />
          <path d="M662 62a12 12 0 1 0 0-24a12 12 0 0 0 0 24z" />
          <path d="M500 156c-14-10-16-26-6-38" />
        </g>
      </g>

      <!-- #006 대폭발 — 동심원 위에 점 하나와 직선 하나 -->
      <g v-else-if="stage.motif === 'singularity'">
        <g class="groove">
          <circle cx="600" cy="106" r="30" />
          <circle cx="600" cy="106" r="48" />
          <circle cx="600" cy="106" r="66" />
          <circle cx="600" cy="106" r="84" />
        </g>
        <path d="M600 106L742 44" stroke-width="1.2" />
        <circle cx="600" cy="106" r="4.5" :fill="stage.accent" stroke="none" />
      </g>

      <!-- #007 네버랜드 — 네모난 별 둘과 작은 행성 -->
      <g v-else-if="stage.motif === 'stars'">
        <path d="M576 56c4 22 10 28 32 32c-22 4-28 10-32 32c-4-22-10-28-32-32c22-4 28-10 32-32z" />
        <path d="M648 108c2.6 14 6.4 18 20 20c-13.6 2-17.4 6-20 20c-2.6-14-6.4-18-20-20c13.6-2 17.4-6 20-20z" />
        <circle cx="690" cy="62" r="9" />
        <ellipse cx="690" cy="62" rx="17" ry="5" fill="none" :stroke="stage.accent" stroke-width="1.8" />
      </g>

      <!-- #008 칵테일 — 마티니 잔 셋. 아래 왁스 실 -->
      <g v-else-if="stage.motif === 'glasses'">
        <g v-for="(x, i) in [536, 600, 664]" :key="i">
          <path :d="`M${x - 22} 62h44l-22 26z`" />
          <path :d="`M${x} 88v30`" />
          <path :d="`M${x - 13} 120h26`" />
        </g>
        <circle cx="600" cy="164" r="11" :fill="stage.seal" :stroke="stage.seal" />
      </g>

      <!-- #009 고래 — 위에서 내려다본 각도 -->
      <g v-else-if="stage.motif === 'whale'">
        <path
          d="M512 112c40-32 110-30 142 2c16 16 8 36-14 40c-46 8-104 0-134-18c-10-6-8-18 6-24z"
        />
        <path d="M672 116l30-22-8 32z" />
        <path d="M556 88c8-16 18-26 28-28" fill="none" :stroke="stage.accent" stroke-width="2" />
        <circle cx="538" cy="122" r="3" fill="#f4efe5" stroke="none" />
      </g>

      <!-- #010 베토벤 — 그랜드 피아노와 좌우로 뻗은 금선 -->
      <g v-else-if="stage.motif === 'piano'">
        <path d="M556 130c0-30 26-52 58-52c30 0 50 18 50 40c0 10-8 16-18 16h-90z" />
        <path d="M556 130h90v10h-90z" />
        <path d="M566 140v14M582 140v14M598 140v14M614 140v14M630 140v14" stroke-width="1.2" />
        <path d="M470 96h74M676 96h74M470 112h74M676 112h74" stroke-width="0.9" class="dim" />
      </g>

      <!-- #011 악의 꽃 — 잎이 거의 없는 마른 가지 -->
      <g v-else-if="stage.motif === 'deadBranch'">
        <path d="M598 200c0-46 6-80 18-106" />
        <path d="M608 152c-22-6-34-20-38-38M612 126c20-8 30-22 32-42M618 100c-16-10-22-24-20-40" />
        <path d="M574 112a7 5 0 1 0 0-10a7 5 0 0 0 0 10z" />
        <path d="M646 82a6 4 0 1 0 0-8a6 4 0 0 0 0 8z" />
        <path d="M600 58a6 5 0 1 0 0-10a6 5 0 0 0 0 10z" />
      </g>

      <!-- #012 골든 레코드 — 금박 선으로 그린 탐사선 -->
      <g v-else-if="stage.motif === 'voyagerFoil'">
        <ellipse cx="600" cy="96" rx="38" ry="33" />
        <ellipse cx="600" cy="96" rx="18" ry="16" />
        <path d="M600 129v28M562 76L508 38M638 76l56-40M600 63V30M570 122l-40 32M630 122l42 30" />
        <circle cx="600" cy="96" r="4.5" :fill="stage.accent" stroke="none" />
      </g>

      <!-- 아베베 — 맨발로 달리는 사람. 발밑에 잎사귀 하나 -->
      <g v-else-if="stage.motif === 'runner'">
        <circle cx="628" cy="56" r="11" />
        <path d="M622 70l-14 34 16 12-6 34" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M608 104l-26 6M624 116l26 14" stroke-width="8" stroke-linecap="round" fill="none" />
        <path d="M618 150l-24 22M618 150l16 26" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M580 186c8-10 20-10 24 0c-10 8-18 6-24 0z" :fill="stage.accent" stroke="none" />
      </g>

      <!-- 뒤샹 — 콜라주 고릴라. 얼굴 위에 줄무늬가 덧입혀져 있다 -->
      <g v-else-if="stage.motif === 'gorilla'">
        <path d="M560 128c0-34 22-58 44-58s44 24 44 58c0 26-20 44-44 44s-44-18-44-44z" />
        <path d="M580 122c0-16 10-26 24-26s24 10 24 26c0 14-10 24-24 24s-24-10-24-24z" fill="#3a2a30" stroke="none" />
        <path d="M566 96h76M566 110h76M566 124h76" stroke="#f0d8c4" stroke-width="2.4" class="collage" />
        <circle cx="592" cy="112" r="3" fill="#1c1418" stroke="none" />
        <circle cx="616" cy="112" r="3" fill="#1c1418" stroke="none" />
      </g>

      <!-- 플로렌스 — 금박 나비 날개 인물 -->
      <g v-else-if="stage.motif === 'wings'">
        <path d="M600 74c-4 26-4 56 0 84" stroke-width="2" />
        <circle cx="600" cy="62" r="9" />
        <path d="M596 88c-30-30-58-34-66-14c-6 18 18 36 62 30z" />
        <path d="M604 88c30-30 58-34 66-14c6 18-18 36-62 30z" />
        <path d="M596 118c-20-10-38-8-42 6c-4 12 14 20 42 6z" />
        <path d="M604 118c20-10 38-8 42 6c4 12-14 20-42 6z" />
      </g>
    </g>

    <!-- ── 지면. 한 색의 명도 단계로만 내려온다 ────── -->
    <path :fill="stage.far" d="M0 168c118-26 196-22 296 4s176 20 270-10 158-18 234 12v86H0z" />
    <path :fill="stage.near" d="M0 196c140-20 214-12 320 10s186 12 316-14 132-10 164 6v62H0z" />
    <rect x="0" y="228" width="800" height="32" :fill="stage.ground" />

    <!-- 결을 맨 위에 아주 옅게 -->
    <rect
      class="grain"
      x="0"
      y="0"
      width="800"
      height="260"
      :filter="`url(#grain-${uid})`"
    />
  </svg>
</template>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/*
 * 각인형 — 얇은 금선.
 * 면을 칠하지 않는다. 금박은 표지 면적의 1% 를 넘지 않았다.
 */
.scene.engraved .motif {
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/*
 * 일러스트형 — 면으로 칠하고 흰 테두리를 두른다.
 * 표지에 스티커를 붙인 것처럼 보이는 게 이 라인의 장치다.
 */
.scene.illustrated .motif {
  stroke-width: 0;
}

/* 접혀 있을 때는 하늘 쪽이 화면 밖이라 안 보인다. 펼칠 때 배어 나오게 한다 */
.motif {
  opacity: 0;
  transition: opacity var(--dur-enter) var(--ease-out);
}
.scene.open .motif {
  opacity: 0.9;
  transition-delay: 90ms;
}

/* 가로등 불빛처럼 한 단 옅게 두는 선들 */
.dim {
  opacity: 0.5;
}

/*
 * 사랑 — 무광 바탕에 유광 인쇄.
 * 각도를 틀어야 무늬가 보이는 표지라 아주 옅게만 얹는다.
 */
.gloss {
  opacity: 0.3;
  stroke-width: 2.2;
}

/* 대폭발 — 레코드판 홈처럼 눌린 동심원 */
.groove {
  opacity: 0.22;
  stroke-width: 1;
  fill: none;
}

/* 뒤샹 — 잘라 붙인 줄무늬 */
.collage {
  opacity: 0.55;
}

/* 결. 아주 옅게만 얹는다. 진하면 그림이 지저분해진다 */
.grain {
  opacity: 0.055;
  mix-blend-mode: multiply;
  pointer-events: none;
}
</style>
