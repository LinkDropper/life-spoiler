import type { StarComboTable } from "./types";

/** 동궁(同宮) 두 주성 조합 노트. 키는 두 별 이름 가나다 정렬 후 "+" 연결 */
export const STAR_COMBOS: StarComboTable = {
  "자미+천부": {
    note: {
      ko: "타고난 무게감에 살림을 잘 챙기는 안정감까지 더해져, 곁에 있으면 든든한 사람이 되지만 가끔은 너무 안전한 길만 고르기도 해요.",
      en: "A natural sense of presence meets a knack for keeping things steady, so they feel dependable to be around—though they can sometimes lean a little too far toward the safe option.",
      ja: "生まれ持った存在感に、暮らしをきちんと守る安定感が加わり、そばにいると頼もしい人になりますが、ときに安全な道ばかりを選びがちです。",
    },
  },
  "자미+탐랑": {
    note: {
      ko: "중심에 서고 싶은 마음과 갖고 싶은 게 많은 마음이 함께 있어 화려하고 매력적이지만, 목표와 욕심 사이에서 흔들릴 때가 있어요.",
      en: "A wish to stand at the center pairs with a heart that wants a lot, making them dazzling and magnetic—though they can waver between their goals and their desires.",
      ja: "中心に立ちたい気持ちと、欲しいものが多い気持ちが同居し、華やかで魅力的ですが、目標と欲の間で揺れることがあります。",
    },
  },
  "자미+칠살": {
    note: {
      ko: "이끌고 싶은 기질에 끝장을 보는 결단력이 붙어 추진력이 대단하지만, 자칫 혼자 밀어붙이는 독단으로 흐를 수 있어요.",
      en: "A leading instinct backed by sharp decisiveness gives tremendous drive, but it can tip into pushing everything through on their own.",
      ja: "導きたい気質に、やり切る決断力が加わって推進力は抜群ですが、ともすれば独断で押し通しがちな面もあります。",
    },
  },
  "자미+천상": {
    note: {
      ko: "품위 있게 중심을 잡으면서 곁에서 살뜰히 챙기는 손길이 더해져, 모두를 부드럽게 조율하는 관리자형이 됩니다.",
      en: "Dignified centering blended with a caring, supportive touch makes them the kind of manager who smooths everyone into harmony.",
      ja: "品よく中心を保ちつつ、こまやかに支える手が加わり、皆をやわらかくまとめる調整役になります。",
    },
  },
  "자미+파군": {
    note: {
      ko: "위엄 있게 이끄는 힘에 판을 갈아엎는 추진력이 더해져 낡은 틀을 새로 세우지만, 너무 자주 뒤집어 주위가 따라오기 벅찰 수 있어요.",
      en: "Commanding leadership joined with a flair for tearing down and rebuilding renews old structures, though flipping things too often can leave others struggling to keep up.",
      ja: "威厳ある統率力に、古い枠組みを作り直す推進力が加わりますが、あまり頻繁に覆すと周囲がついていけなくなることもあります。",
    },
  },
  "천기+태음": {
    note: {
      ko: "꼼꼼히 따져보는 머리에 풍부한 감수성이 어우러져 계획적이면서도 마음이 깊어, 예술이나 학문에서 빛을 발하는 결입니다.",
      en: "A careful, analytical mind woven with rich sensitivity makes them both methodical and deeply feeling—shining in the arts or in study.",
      ja: "細かく考える頭に豊かな感受性が溶け合い、計画的でありながら心が深く、芸術や学問で輝くタイプです。",
    },
  },
  "거문+천기": {
    note: {
      ko: "끝까지 파고드는 분석력에 조리 있는 말솜씨가 더해져 사람을 설득하는 힘이 강하지만, 가끔 너무 깊이 캐묻는다는 인상을 줄 수 있어요.",
      en: "Probing analysis paired with articulate speech gives real persuasive power, though it can occasionally come across as digging a touch too hard.",
      ja: "とことん掘り下げる分析力に、筋道立った話術が加わって説得力は強いものの、ときに問い詰めすぎる印象を与えることもあります。",
    },
  },
  "천기+천량": {
    note: {
      ko: "빈틈없는 분석에 일을 풀어내는 지혜가 더해져 판단력이 뛰어나지만, 앞일을 미리 걱정하느라 마음이 무거워질 때가 있어요.",
      en: "Thorough analysis combined with problem-solving wisdom gives excellent judgment, though worrying about what lies ahead can weigh on them.",
      ja: "抜かりない分析に、物事を解く知恵が加わって判断力は優れていますが、先のことを案じて心が重くなることがあります。",
    },
  },
  "태양+태음": {
    note: {
      ko: "밝게 드러내는 기운과 안으로 깊이 품는 기운을 함께 지녀 마음이 넓고 따뜻하지만, 두 결 사이에서 기분이 오르내릴 때가 있어요.",
      en: "Holding both an outward brightness and an inward depth, they have a wide, warm heart—though their mood can swing between the two sides.",
      ja: "明るく表に出す気と、内に深く抱く気を併せ持ち、心が広く温かい一方で、二つの面の間で気分が揺れることがあります。",
    },
  },
  "거문+태양": {
    note: {
      ko: "당당하게 표현하는 힘에 또렷하게 따지는 말솜씨가 더해져 설득력과 언변이 탁월하니, 가르치거나 논리로 푸는 일에 잘 맞아요.",
      en: "Confident expression joined with sharp, articulate reasoning gives outstanding persuasion and verbal skill—well suited to teaching or making a logical case.",
      ja: "堂々と表現する力に、はっきり筋を通す話術が加わり、説得力と弁舌に優れ、教えたり論理で解く仕事によく向きます。",
    },
  },
  "천량+태양": {
    note: {
      ko: "베풀며 드러내는 따뜻함에 일을 풀어내는 지혜가 더해져, 주변을 어른스럽게 이끌고 보살피는 든든한 사람이 됩니다.",
      en: "A giving, outward warmth combined with problem-solving wisdom makes them a steady presence who guides and looks after those around them with maturity.",
      ja: "与えながら表に出す温かさに、物事を解く知恵が加わり、周囲を大人らしく導き世話する頼れる人になります。",
    },
  },
  "무곡+천부": {
    note: {
      ko: "밀어붙이는 실행력에 차곡차곡 모으는 안정감이 더해져 돈 관리가 탁월하지만, 보수적인 쪽으로 기울어 새 기회를 놓칠 수 있어요.",
      en: "Driving execution paired with a steady, saving instinct makes them excellent with money, though leaning conservative can mean missing new chances.",
      ja: "押し進める実行力に、こつこつ貯める安定感が加わってお金の管理に長けますが、保守的に傾いて新しい機会を逃すこともあります。",
    },
  },
  "무곡+탐랑": {
    note: {
      ko: "곧장 밀고 나가는 실행력에 갖고 싶은 게 많은 욕구가 붙어 목표를 잘 이루지만, 방향을 분명히 정해두지 않으면 힘이 흩어질 수 있어요.",
      en: "Straight-ahead execution fueled by a wide range of wants helps them reach goals, but without a clear direction their energy can scatter.",
      ja: "まっすぐ進む実行力に、欲しいものが多い欲求が加わって目標をよく達成しますが、方向を定めないと力が散ることもあります。",
    },
  },
  "무곡+천상": {
    note: {
      ko: "단단한 실행력에 곁에서 돕는 손길이 더해져 현실적이고 믿음직하니, 무슨 일이든 맡기면 차질 없이 해내는 실무형입니다.",
      en: "Solid execution combined with a supportive touch makes them practical and dependable—the kind who handles whatever is entrusted without a hitch.",
      ja: "堅実な実行力に、そばで支える手が加わって現実的で頼もしく、何を任せても滞りなくこなす実務型です。",
    },
  },
  "무곡+칠살": {
    note: {
      ko: "직진하는 실행력에 끝장 보는 결단이 더해져 과감하게 성과와 권한을 동시에 거머쥐지만, 너무 몰아붙이면 주변과 부딪힐 수 있어요.",
      en: "Direct execution joined with all-or-nothing decisiveness lets them boldly grasp both results and authority, though pushing too hard can clash with others.",
      ja: "直進する実行力に、やり切る決断が加わって果敢に成果と権限を同時に握りますが、押しすぎると周囲とぶつかることもあります。",
    },
  },
  "무곡+파군": {
    note: {
      ko: "거침없는 실행력에 판을 새로 짜는 변화의 기운이 더해져 부딪혀 가며 새 길을 열지만, 기복이 커 안정이 필요할 때가 있어요.",
      en: "Unhesitating execution joined with an appetite for reshaping things lets them carve new paths by pushing through, though the ups and downs can call for grounding.",
      ja: "ためらわない実行力に、盤面を組み直す変化の気が加わり、ぶつかりながら新しい道を開きますが、起伏が大きく安定が必要なときもあります。",
    },
  },
  "천동+태음": {
    note: {
      ko: "편안하고 낙천적인 결에 섬세한 감수성이 더해져 부드럽고 정서적으로 풍요롭지만, 마음이 여려 상처를 오래 품을 수 있어요.",
      en: "An easygoing, optimistic nature blended with delicate sensitivity makes them gentle and emotionally rich, though a tender heart can hold onto hurts for a while.",
      ja: "穏やかで楽天的な質に、繊細な感受性が加わってやわらかく情緒豊かですが、心が傷つきやすく痛みを長く抱えることもあります。",
    },
  },
  "거문+천동": {
    note: {
      ko: "느긋하고 편안해 보이지만 속에는 또렷한 할 말을 품고 있어, 평소엔 무던해도 한번 입을 열면 핵심을 짚는 사람이에요.",
      en: "Relaxed and easygoing on the surface yet holding clear opinions within, they seem mellow most days but cut right to the point once they speak up.",
      ja: "のんびり穏やかに見えても内にはっきり言いたいことを抱え、普段は鷹揚でも口を開けば要点を突く人です。",
    },
  },
  "천동+천량": {
    note: {
      ko: "여유로운 결에 일을 풀어내는 지혜가 더해져 느긋하게 사람을 보살피지만, 마음이 편한 만큼 추진력은 한 박자 늦을 수 있어요.",
      en: "An easy nature combined with problem-solving wisdom lets them care for others at a relaxed pace, though that very ease can make their drive run a beat slow.",
      ja: "ゆとりある質に、物事を解く知恵が加わってのんびり人を世話しますが、心が安らぐぶん推進力は一拍遅れることもあります。",
    },
  },
  "염정+천부": {
    note: {
      ko: "끌어당기는 매력과 열정에 차분히 챙기는 안정감이 더해져, 화려하면서도 절제할 줄 아는 균형 잡힌 사람이 됩니다.",
      en: "Magnetic charm and passion tempered by a steady, careful instinct make them someone glamorous yet self-restrained and well-balanced.",
      ja: "惹きつける魅力と情熱に、落ち着いて整える安定感が加わり、華やかでありながら節度を知る均衡のとれた人になります。",
    },
  },
  "염정+탐랑": {
    note: {
      ko: "타오르는 열정에 갖고 싶은 게 많은 욕구가 겹쳐 매력 넘치고 다재다능하지만, 충동에 휩쓸리지 않게 균형을 잡는 게 중요해요.",
      en: "Burning passion layered with wide-ranging desires makes them charming and versatile, but keeping balance against impulse is key.",
      ja: "燃える情熱に、欲しいものが多い欲求が重なって魅力的で多才ですが、衝動に流されないよう均衡をとることが大切です。",
    },
  },
  "염정+천상": {
    note: {
      ko: "분위기를 살리는 열정에 곁에서 돕는 손길이 더해져 사람을 끌어모으니, 모임의 온도를 자연스럽게 올리는 사람이에요.",
      en: "A mood-lifting passion paired with a supportive touch draws people in, making them the one who naturally warms up any gathering.",
      ja: "場を盛り上げる情熱に、そばで支える手が加わって人を引き寄せ、集まりの温度を自然に上げる人です。",
    },
  },
  "염정+칠살": {
    note: {
      ko: "강렬한 열정에 끝장 보는 결단이 더해져 승부처에서 밀어붙이는 힘이 대단하지만, 한번 불붙으면 멈추기 어려울 수 있어요.",
      en: "Intense passion joined with all-or-nothing decisiveness gives formidable force in a showdown, though once lit they can find it hard to stop.",
      ja: "強烈な情熱に、やり切る決断が加わって勝負どころで押し切る力は抜群ですが、一度火がつくと止まりにくいこともあります。",
    },
  },
  "염정+파군": {
    note: {
      ko: "폭발하는 열정에 판을 새로 짜는 변화의 기운이 더해져 에너지가 엄청나지만, 오르내림이 커 페이스 조절이 필요해요.",
      en: "Explosive passion joined with a drive to reshape things gives enormous energy, though big swings mean they need to pace themselves.",
      ja: "爆発する情熱に、盤面を組み直す変化の気が加わってエネルギーは桁外れですが、起伏が大きくペース配分が必要です。",
    },
  },
};
