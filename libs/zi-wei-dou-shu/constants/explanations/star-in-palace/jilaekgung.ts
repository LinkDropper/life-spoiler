import type { PalaceStarMap } from "../types";

/** 질액궁(疾厄宮) — 건강·체질·컨디션 */
export const JILAEKGUNG_STARS: PalaceStarMap = {
  자미: {
    energy: {
      ko: "기본 체력의 그릇이 큰 편이라 어지간한 무리에도 쉽게 무너지지 않고, 컨디션을 스스로 챙기려는 의지가 강해서 한번 마음먹으면 생활 리듬을 잘 잡아가요.",
      en: "Your baseline stamina runs deep, so you don't crumble easily under a fair bit of strain, and your strong will to manage your own condition helps you settle into a healthy rhythm once you commit.",
      ja: "基礎体力の器が大きめで、多少の無理ではなかなか崩れません。自分でコンディションを整えようとする意志が強く、一度決めると生活リズムをしっかり取り戻せます。",
    },
    caution: {
      ko: "다만 책임감에 끝까지 버티려다 어깨와 목에 긴장이 쌓이기 쉬우니, 힘들 땐 일찍 내려놓고 쉬어 주면 좋아요.",
      en: "That said, pushing through out of duty tends to pile tension into your neck and shoulders, so put things down and rest early when it gets heavy.",
      ja: "ただ、責任感で最後まで踏ん張ろうとすると首や肩に緊張がたまりやすいので、つらいときは早めに手放して休むと良いです。",
    },
  },
  천기: {
    energy: {
      ko: "머리가 늘 빠르게 돌아가는 만큼 몸의 작은 변화도 일찍 알아차리는 편이라, 컨디션이 흔들릴 조짐을 먼저 감지하고 미리 대처하는 감각이 있어요.",
      en: "Because your mind is always running fast, you tend to notice small shifts in your body early, sensing the first signs of a dip in condition and adjusting before it spreads.",
      ja: "頭が常に速く回る分、体の小さな変化にも早く気づくタイプで、コンディションが揺らぐ兆しを先に察して前もって対処する感覚があります。",
    },
    caution: {
      ko: "다만 생각이 많아 신경이 쉬지 못하고 밤에 잠이 얕아지기 쉬우니, 자기 전 머리를 비우는 시간을 정해두면 좋아요.",
      en: "That said, an overactive mind keeps your nerves from resting and can make your sleep shallow at night, so set aside time to quiet your head before bed.",
      ja: "ただ、考えが多くて神経が休まらず、夜の眠りが浅くなりやすいので、寝る前に頭を空にする時間を決めておくと良いです。",
    },
  },
  태양: {
    energy: {
      ko: "에너지가 밖으로 활발하게 도는 편이라 낮 동안 활동량이 많아도 잘 버텨내고, 햇빛을 쬐며 몸을 움직이면 기운이 금세 살아나는 활기형 체질이에요.",
      en: "Your energy circulates outward and lively, so you hold up well through busy daytime activity, and you bounce back quickly when you get sunlight and keep your body moving.",
      ja: "エネルギーが外へ活発に巡るタイプで、日中の活動量が多くてもよく持ちこたえ、日差しを浴びて体を動かすと元気がすぐに戻る活力型の体質です。",
    },
    caution: {
      ko: "다만 쉴 새 없이 달리다 보면 눈이 쉽게 피로해지고 열이 위로 올라 머리가 무거워지기 쉬우니, 중간중간 열을 식히는 짧은 휴식을 챙기세요.",
      en: "That said, running nonstop can tire your eyes easily and send heat upward, leaving your head heavy, so take short breaks here and there to cool down.",
      ja: "ただ、休みなく走り続けると目が疲れやすく、熱が上に上がって頭が重くなりやすいので、合間に熱を冷ます短い休憩を取りましょう。",
    },
  },
  무곡: {
    energy: {
      ko: "타고난 골격과 근력이 단단해서 한번 자리 잡은 컨디션이 잘 무너지지 않고, 운동이든 일이든 꾸준히 밀어붙이는 지구력이 몸에 배어 있어요.",
      en: "With a sturdy frame and solid muscle, your condition holds firm once it's settled, and a steady endurance for both exercise and work is built into your body.",
      ja: "生まれつき骨格や筋力がしっかりしていて、一度整ったコンディションが崩れにくく、運動でも仕事でもこつこつ押し進める持久力が体に染みついています。",
    },
    caution: {
      ko: "다만 강하게 밀어붙이다 보면 호흡기나 치아처럼 단단한 부위에 무리가 가거나 갑작스러운 부상으로 이어지기 쉬우니, 몸이 보내는 신호를 무시하지 않는 게 좋아요.",
      en: "That said, pushing hard can strain firm areas like your airways or teeth, or lead to a sudden injury, so don't ignore the signals your body sends.",
      ja: "ただ、強く押し切ると気道や歯のような硬い部位に無理がかかったり、突然のけがにつながりやすいので、体が送るサインを無視しないのが良いです。",
    },
  },
  천동: {
    energy: {
      ko: "마음이 둥글둥글하고 잘 흘려보내는 편이라 스트레스가 몸에 오래 쌓이지 않고, 잘 먹고 잘 쉬는 회복력이 좋아서 컨디션이 떨어져도 금세 돌아오는 편이에요.",
      en: "You're easygoing and let things slide, so stress doesn't linger in your body for long, and your knack for eating and resting well gives you a recovery that bounces back fast when your condition dips.",
      ja: "気持ちが穏やかでうまく受け流すタイプなので、ストレスが体に長くたまらず、よく食べてよく休む回復力が高く、コンディションが落ちてもすぐに戻りやすいです。",
    },
    caution: {
      ko: "다만 편한 쪽으로만 지내다 활동량이 줄고 군살이 붙기 쉬우니, 가볍게라도 몸을 움직이는 습관을 들이세요.",
      en: "That said, always taking it easy can cut your activity and add some extra weight, so build a habit of moving your body even lightly.",
      ja: "ただ、楽な方ばかりで過ごすと活動量が減って余分な肉がつきやすいので、軽くでも体を動かす習慣をつけましょう。",
    },
  },
  염정: {
    energy: {
      ko: "한번 빠지면 푹 몰입하는 열정만큼 몸에도 강한 에너지가 흐르는 편이라, 좋아하는 일에 집중할 때 평소보다 훨씬 큰 활력을 끌어내는 힘이 있어요.",
      en: "As intensely as you throw yourself into things, a strong energy runs through your body too, and when you focus on what you love you can draw out far more vitality than usual.",
      ja: "一度のめり込むと深く没頭する情熱の分だけ、体にも強いエネルギーが流れるタイプで、好きなことに集中するとき普段よりずっと大きな活力を引き出す力があります。",
    },
    caution: {
      ko: "다만 컨디션이 기분에 따라 크게 오르내릴 수 있으니, 들뜬 날에도 일정한 수면 시간은 지키는 게 좋아요.",
      en: "That said, your condition can swing a lot with your mood, so keep a steady sleep schedule even on the days you feel wired.",
      ja: "ただ、コンディションが気分によって大きく上下しやすいので、高揚した日でも一定の睡眠時間は守るのが良いです。",
    },
  },
  천부: {
    energy: {
      ko: "몸의 기초가 안정적이고 무리하지 않으면서 자기 페이스를 지키는 편이라, 규칙적인 생활만 갖춰지면 큰 굴곡 없이 꾸준한 컨디션을 오래 유지해요.",
      en: "Your body's foundation is stable and you keep your own pace without overdoing it, so once a regular routine is in place you sustain a steady condition for a long time without big ups and downs.",
      ja: "体の基礎が安定していて、無理せず自分のペースを守るタイプなので、規則正しい生活さえ整えば大きな波もなく安定したコンディションを長く保てます。",
    },
    caution: {
      ko: "다만 잘 챙겨 먹는 만큼 소화기에 부담이 쌓이기 쉬우니, 과식보다 천천히 적당히 먹는 습관이 좋아요.",
      en: "That said, eating well can quietly burden your digestion, so a habit of eating slowly and in moderation beats overeating.",
      ja: "ただ、しっかり食べる分だけ消化器に負担がたまりやすいので、食べすぎより、ゆっくり適量を食べる習慣が良いです。",
    },
  },
  태음: {
    energy: {
      ko: "몸과 마음의 미세한 변화를 섬세하게 알아차리는 편이라 자기 컨디션을 세심하게 돌볼 줄 알고, 조용히 쉬는 시간 속에서 깊이 충전해 기운을 되찾는 회복형이에요.",
      en: "You sense subtle shifts in body and mind with great delicacy, so you know how to care for your own condition closely, and you're a recovery type who refuels deeply in quiet, restful moments.",
      ja: "体と心の細かな変化を繊細に感じ取るタイプで、自分のコンディションをきめ細かく気遣うことができ、静かに休む時間の中で深く充電して元気を取り戻す回復型です。",
    },
    caution: {
      ko: "다만 마음이 가라앉으면 몸도 함께 무거워지고 붓거나 수분 순환이 처지기 쉬우니, 밤보다 낮의 빛과 산책으로 기분과 순환을 다독여 보세요.",
      en: "That said, when your spirits sink your body can feel heavy and puffy as fluid circulation slows, so soothe both your mood and circulation with daytime light and walks rather than late nights.",
      ja: "ただ、気持ちが沈むと体も重くなり、むくんだり水分の巡りが滞りやすいので、夜より昼の光や散歩で気分と巡りをなだめてみましょう。",
    },
  },
  탐랑: {
    energy: {
      ko: "하고 싶은 것이 많은 만큼 몸도 활동적으로 잘 움직이고, 새로운 운동이나 취미에 금세 재미를 붙여 다양한 방식으로 활력을 채워가는 에너지 넘치는 체질이에요.",
      en: "With so much you want to do, your body moves actively too, and you quickly take to new sports or hobbies, topping up your vitality in all sorts of ways with energy to spare.",
      ja: "やりたいことが多い分、体も活動的によく動き、新しい運動や趣味にすぐ夢中になって、さまざまな形で活力を満たしていくエネルギーあふれる体質です。",
    },
    caution: {
      ko: "다만 자극을 즐기다 야식이나 늦은 모임으로 리듬이 흐트러지기 쉬우니, 즐길 땐 즐기되 회복할 날을 따로 두세요.",
      en: "That said, chasing stimulation can throw off your rhythm with late-night snacks and gatherings, so enjoy when you enjoy but set aside days to recover.",
      ja: "ただ、刺激を楽しむうちに夜食や遅い集まりでリズムが乱れやすいので、楽しむときは楽しみつつ、回復する日を別に設けましょう。",
    },
  },
  거문: {
    energy: {
      ko: "몸 상태를 꼼꼼히 따지고 파고드는 편이라 무엇을 먹고 어떻게 쉬어야 좋은지 잘 챙기고, 정보를 찾아 자기에게 맞는 관리법을 똑똑하게 만들어가는 힘이 있어요.",
      en: "You scrutinize and dig into how your body feels, so you stay on top of what to eat and how to rest, and you have a knack for researching and building a care routine that fits you well.",
      ja: "体の状態を細かく問い詰めて掘り下げるタイプで、何を食べてどう休めば良いかをよく気遣い、情報を調べて自分に合った管理法を賢く作り上げる力があります。",
    },
    caution: {
      ko: "다만 작은 증상까지 신경 쓰다 속이 먼저 더부룩해지거나 소화가 가라앉을 수 있으니, 정보는 적당히 거르고 편하게 받아들이는 게 좋아요.",
      en: "That said, fretting over every little symptom can leave your stomach bloated or your digestion sluggish first, so filter the information in moderation and take it in with ease.",
      ja: "ただ、小さな症状まで気にすると胃がもたれたり消化が落ちたりしやすいので、情報はほどほどに取捨し、気楽に受け止めるのが良いです。",
    },
  },
  천상: {
    energy: {
      ko: "주변을 챙기며 일이 매끄럽게 돌아가게 하는 감각이 몸 관리에도 그대로 이어져, 규칙적이고 균형 잡힌 생활을 자연스럽게 꾸려 안정된 컨디션을 잘 지켜내요.",
      en: "Your feel for looking after others and keeping things running smoothly carries straight into self-care, so you naturally maintain a regular, balanced lifestyle and hold a steady condition.",
      ja: "周りを気遣い物事を滑らかに回す感覚が体の管理にもそのまま生き、規則正しくバランスの取れた生活を自然に整え、安定したコンディションをよく保ちます。",
    },
    caution: {
      ko: "다만 남을 챙기다 정작 자기 몸은 뒤로 미루기 쉬우니, 자신의 휴식도 일정표에 미리 넣어 두세요.",
      en: "That said, looking after others can push your own body to the back burner, so pencil your own rest into the schedule in advance.",
      ja: "ただ、人の世話をして自分の体は後回しにしがちなので、自分の休息も予定にあらかじめ入れておきましょう。",
    },
  },
  천량: {
    energy: {
      ko: "어른스럽게 한 발 앞서 대비하는 성향이 건강에도 작용해, 무리할 상황을 미리 알아보고 조절할 줄 알며 큰 흐름에서 몸을 길게 보고 관리하는 지혜가 있어요.",
      en: "Your grown-up habit of preparing a step ahead works for your health too, letting you spot strain in advance and pace yourself, with the wisdom to manage your body over the long run.",
      ja: "大人びて一歩先に備える性向が健康にも働き、無理する状況を前もって見抜いて調節でき、大きな流れの中で体を長い目で管理する知恵があります。",
    },
    caution: {
      ko: "다만 이런저런 걱정을 미리 안고 있으면 몸이 함께 긴장하기 쉬우니, 지금 할 수 있는 한 가지에만 마음을 두세요.",
      en: "That said, carrying worries in advance can keep your body tense along with you, so place your mind only on the one thing you can do right now.",
      ja: "ただ、あれこれ心配を先に抱えると体も一緒に緊張しやすいので、今できる一つのことだけに心を置きましょう。",
    },
  },
  칠살: {
    energy: {
      ko: "한번 마음먹으면 강하게 밀어붙이는 만큼 폭발적인 체력을 끌어내는 힘이 있어, 운동이든 일이든 단기간에 집중해 몸을 강하게 단련해 나가는 추진력이 돋보여요.",
      en: "As hard as you push once you commit, you can summon explosive stamina, and a drive for focusing intensely over a short span to forge your body strong really stands out.",
      ja: "一度決めたら強く押し進める分、爆発的な体力を引き出す力があり、運動でも仕事でも短期間に集中して体を強く鍛え上げる推進力が際立ちます。",
    },
    caution: {
      ko: "다만 끝까지 몰아붙이다 갑자기 방전될 수 있으니, 강하게 쓴 만큼 푹 쉬는 시간을 꼭 짝지어 두세요.",
      en: "That said, driving yourself to the end can leave you suddenly drained, so always pair hard exertion with solid rest.",
      ja: "ただ、最後まで追い込むと急にエネルギー切れになることがあるので、強く使った分だけしっかり休む時間を必ずセットにしましょう。",
    },
  },
  파군: {
    energy: {
      ko: "익숙한 틀을 깨고 새 환경에 뛰어드는 모험심만큼 몸도 변화에 빠르게 적응하는 편이라, 낯선 운동이나 새로운 생활 방식을 시도하며 활력을 새롭게 채워가요.",
      en: "As adventurous as you are in breaking molds and diving into new settings, your body adapts to change quickly too, so you refresh your vitality by trying unfamiliar workouts and new ways of living.",
      ja: "慣れた枠を壊して新しい環境に飛び込む冒険心の分だけ、体も変化に素早く順応するタイプで、見慣れない運動や新しい生活様式を試しながら活力を新たに満たしていきます。",
    },
    caution: {
      ko: "다만 생활 리듬이 자주 바뀌면 컨디션의 기복이 커질 수 있으니, 수면과 식사 시간만큼은 일정하게 잡아 두세요.",
      en: "That said, a frequently shifting routine can widen the swings in your condition, so keep at least your sleep and meal times consistent.",
      ja: "ただ、生活リズムが頻繁に変わるとコンディションの起伏が大きくなりやすいので、睡眠と食事の時間だけは一定に保っておきましょう。",
    },
  },
};
