/* 시안 동작 데모: 확인 컷 응답, 본문 더 읽기. 구현 시 React 상태로 대체. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MSG = {
    yes: "맞아요로 답했어요",
    no: "아니에요로 답했어요",
    skip: "기억 안 나요로 답했어요",
  };

  document.querySelectorAll('[data-cut="live"]').forEach((cut) => {
    const qs = [...cut.querySelectorAll(".q")];
    const msg = cut.querySelector("[data-live-msg]");
    const cnt = cut.querySelector("[data-cnt]");
    const sum = cut.querySelector(".sm");
    const total = qs.length;

    const refresh = () => {
      const answered = qs.filter((q) => q.dataset.answer).length;
      if (cnt) cnt.textContent = `${answered}/${total}`;
      if (!sum) return;
      const all = answered === total;
      sum.hidden = !all;
      if (!all) return;
      const yes = qs.filter((q) => q.dataset.answer === "yes").length;
      const no = qs.filter((q) => q.dataset.answer === "no").length;
      const good = yes >= no && yes > 0;
      sum.querySelectorAll("[data-sum-yes]").forEach((n) => (n.textContent = yes));
      sum.querySelectorAll("[data-sum-total]").forEach((n) => (n.textContent = total));
      sum.querySelector(".sm-good").hidden = !good;
      sum.querySelector(".sm-low").hidden = good;
    };

    const activate = (after) => {
      const open = qs.filter((q) => !q.dataset.answer);
      const next = open.find((q) => qs.indexOf(q) > after) || open[0];
      qs.forEach((q) => {
        if (!q.dataset.answer) q.dataset.state = q === next ? "active" : "next";
      });
      return next;
    };

    cut.addEventListener("click", (e) => {
      const choice = e.target.closest("[data-v]");
      if (choice) {
        const q = choice.closest(".q");
        const v = choice.dataset.v;
        q.dataset.answer = v;
        q.dataset.state = "picked";
        q.querySelectorAll(".ans button").forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.v === v))
        );
        if (msg) msg.textContent = `${qs.indexOf(q) + 1}번 진술, ${MSG[v]}`;
        window.setTimeout(() => {
          q.dataset.state = "done";
          const next = activate(qs.indexOf(q));
          refresh();
          if (next) next.querySelector(".ans button")?.focus();
          else sum?.focus();
        }, reduce ? 0 : 420);
        return;
      }
      const res = e.target.closest(".q-res");
      if (res) {
        const q = res.closest(".q");
        delete q.dataset.answer;
        q.querySelectorAll(".ans button").forEach((b) => b.setAttribute("aria-pressed", "false"));
        q.dataset.state = "active";
        qs.forEach((o) => {
          if (o !== q && !o.dataset.answer) o.dataset.state = "next";
        });
        refresh();
        q.querySelector(".ans button")?.focus();
      }
    });
    refresh();
  });

  document.querySelectorAll("[data-more]").forEach((btn) => {
    const target = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      target.classList.toggle("clamp", open);
      btn.setAttribute("aria-expanded", String(!open));
      btn.textContent = open ? btn.dataset.open : btn.dataset.close;
    });
  });
})();
