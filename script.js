(() => {
  // ---------- helpers ----------
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

  const toastEl = $("#toast");
  let toastTimer = null;

  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  // ---------- state ----------
  const state = {
    filter: "all",
    saved: new Set(JSON.parse(localStorage.getItem("jappaleh_saved") || "[]")),
    premium: localStorage.getItem("jappaleh_premium") === "true",
    bigText: localStorage.getItem("jappaleh_bigtext") === "true",
    listings: []
  };

  // ---------- demo listings ----------
  const demo = [
    {
      id: "a1",
      kind: "service",
      mode: "OFFER",
      title: "Plumbing help (leaks + sink repair)",
      by: "James",
      dist: "2.1 mi",
      rating: "4.8",
      tags: ["sink", "leak", "repair"],
      desc: "I can fix small leaks, replace faucets, and stop that annoying drip. Trade welcome: small items, food, or a quick favor."
    },
    {
      id: "a2",
      kind: "service",
      mode: "NEED",
      title: "Need help mounting a TV + shelves",
      by: "Sabrina",
      dist: "7.8 mi",
      rating: "4.6",
      tags: ["mounting", "shelves"],
      desc: "I have the TV + brackets. Just need someone with tools/experience. I can trade baking or tutoring."
    },
    {
      id: "a3",
      kind: "item",
      mode: "LISTING",
      title: "Garage sale bundle (photo listing)",
      by: "Andre",
      dist: "1.4 mi",
      rating: "4.9",
      tags: ["sofa", "lamp", "microwave"],
      desc: "Bundle deal. Swap items or trade services. Fast pickup only."
    },
    {
      id: "a4",
      kind: "service",
      mode: "OFFER",
      title: "Childcare weekends (barter OK)",
      by: "Nia",
      dist: "9.6 mi",
      rating: "4.7",
      tags: ["weekend", "babysitting"],
      desc: "Weekend childcare support. Trade: groceries, hair help, or yard work."
    },
    {
      id: "a5",
      kind: "service",
      mode: "OFFER",
      title: "Cupcakes & cakes (trade welcome)",
      by: "Tasha",
      dist: "3.2 mi",
      rating: "4.5",
      tags: ["cupcakes", "cakes"],
      desc: "I do cupcakes, birthday cakes, and small events. Trade: handyman help, shelves, or a stroller."
    }
  ];

  // ---------- render cards ----------
  const cardsEl = $("#cards");
  const savedCountEl = $("#savedCount");

  function renderCards(){
    const list = state.listings.length ? state.listings : demo;
    const filtered = list.filter(item => {
      if(state.filter === "all") return true;
      if(state.filter === "services") return item.kind === "service";
      if(state.filter === "items") return item.kind === "item";
      return true;
    });

    $("#nearbyCount").textContent = filtered.length;

    cardsEl.innerHTML = filtered.map(item => {
      const isSaved = state.saved.has(item.id);
      return `
        <article class="card cardItem" data-id="${item.id}">
          <div class="cardTop">
            <div>
              <div class="cardTitle">${item.title}</div>
              <div class="cardMeta">By ${item.by} · ${item.dist} · ★ ${item.rating} · <span class="pill">${item.mode}</span> <span class="pill">${item.kind.toUpperCase()}</span></div>
            </div>

            <button class="smallBtn starBtn ${isSaved ? "saved" : ""}" data-action="save" title="Save">
              ${isSaved ? "★" : "☆"}
            </button>
          </div>

          <div class="tags">
            ${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}
          </div>

          <div class="cardDesc">${item.desc}</div>

          <div class="actions">
            <button class="smallBtn primary" data-action="view">View</button>
            <button class="smallBtn" data-action="message">Message</button>
          </div>
        </article>
      `;
    }).join("");

    savedCountEl.textContent = state.saved.size;
    wireCardEvents();
  }

  function wireCardEvents(){
    $$(".cardItem").forEach(card => {
      card.addEventListener("click", (e) => {
        const action = e.target?.dataset?.action;
        if(action) return; // handled below
        card.classList.toggle("expanded");
        toast(card.classList.contains("expanded") ? "Expanded" : "Collapsed");
      });

      // long-press save (WOW behavior)
      let pressTimer = null;
      card.addEventListener("mousedown", () => {
        pressTimer = setTimeout(() => {
          toggleSave(card.dataset.id);
        }, 520);
      });
      card.addEventListener("mouseup", () => clearTimeout(pressTimer));
      card.addEventListener("mouseleave", () => clearTimeout(pressTimer));
    });

    // action buttons
    $$(".cardItem [data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = e.target.closest(".cardItem");
        const id = card.dataset.id;
        const action = e.target.dataset.action;

        if(action === "save") toggleSave(id);
        if(action === "view") toast("Viewing details (demo)");
        if(action === "message") {
          if(!state.premium){
            openPremium();
            toast("Premium unlocks unlimited messages.");
          }else{
            toast("Message sent (demo).");
          }
        }
      });
    });
  }

  function toggleSave(id){
    if(state.saved.has(id)){
      state.saved.delete(id);
      toast("Removed from Saved");
    }else{
      state.saved.add(id);
      toast("Saved ★");
    }
    localStorage.setItem("jappaleh_saved", JSON.stringify([...state.saved]));
    renderCards();
  }

  // ---------- views / navigation ----------
  const views = {
    home: $("#view-home"),
    create: $("#view-create"),
    matches: $("#view-matches"),
    messages: $("#view-messages"),
    profile: $("#view-profile")
  };

  $$(".tab").forEach(t => {
    t.addEventListener("click", () => {
      $$(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const v = t.dataset.view;
      Object.values(views).forEach(sec => sec.classList.remove("active"));
      views[v].classList.add("active");
      toast(v[0].toUpperCase() + v.slice(1));
    });
  });

  // ---------- segment filter ----------
  $$(".segBtn").forEach(b => {
    b.addEventListener("click", () => {
      $$(".segBtn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      state.filter = b.dataset.filter;
      renderCards();
    });
  });

  // ---------- create listing ----------
  $("#postBtn").addEventListener("click", () => {
    const title = $("#title").value.trim();
    const tags = $("#tags").value.trim();
    const desc = $("#desc").value.trim();
    const kind = $("#type").value;
    const mode = $("#mode").value.toUpperCase();

    if(!title){
      toast("Add a title first.");
      return;
    }

    const item = {
      id: "u" + Date.now(),
      kind,
      mode,
      title,
      by: "You",
      dist: "0.4 mi",
      rating: "5.0",
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean).slice(0,6) : ["new"],
      desc: desc || "No description yet."
    };

    state.listings.unshift(item);
    toast("Posted ✅");
    $("#title").value = "";
    $("#tags").value = "";
    $("#desc").value = "";

    // Jump to Home
    $('[data-view="home"]').click();
  });

  $("#resetBtn").addEventListener("click", () => {
    $("#title").value = "";
    $("#tags").value = "";
    $("#desc").value = "";
    toast("Cleared");
  });

  $("#quickPostBtn").addEventListener("click", () => {
    $('[data-view="create"]').click();
    toast("Quick Post ready");
  });

  $("#demoBtn").addEventListener("click", () => {
    toast("Demo listings loaded");
    renderCards();
  });

  // ---------- matches ----------
  const matchCardsEl = $("#matchCards");
  const inboxEl = $("#inbox");

  function renderMatches(items){
    matchCardsEl.innerHTML = items.map(it => `
      <div class="card cardItem">
        <div class="cardTitle">${it.title}</div>
        <div class="cardMeta">${it.reason}</div>
        <div class="actions">
          <button class="smallBtn primary">View</button>
          <button class="smallBtn">Message</button>
        </div>
      </div>
    `).join("");
  }

  $("#findMatchesBtn").addEventListener("click", () => {
    const offer = $("#matchOffer").value.toLowerCase();
    const need = $("#matchNeed").value.toLowerCase();

    const list = (state.listings.length ? state.listings : demo);
    const picks = list
      .map(it => {
        const hay = (it.title + " " + it.tags.join(" ") + " " + it.desc).toLowerCase();
        let score = 0;
        if(offer && hay.includes(offer.split(" ")[0])) score += 2;
        if(need && hay.includes(need.split(" ")[0])) score += 2;
        if(it.kind === "service") score += 1;
        return {it, score};
      })
      .sort((a,b) => b.score - a.score)
      .slice(0,4)
      .map(x => ({
        title: x.it.title,
        reason: x.score ? "High relevance match + nearby" : "Suggested nearby listing"
      }));

    renderMatches(picks);
    toast("Matches updated");
  });

  $("#useProfileBtn").addEventListener("click", () => {
    $("#matchOffer").value = "handyman, shelves, painting";
    $("#matchNeed").value = "plumbing, sink, leak";
    toast("Profile loaded");
  });

  // ---------- messages demo ----------
  function renderInbox(){
    const msgs = [
      "James: I can come by today after 4pm. What trade are you thinking?",
      "Sabrina: Do you have a drill or should I provide one?",
      "Andre: If you can help move the sofa, you can have the microwave free."
    ];
    inboxEl.innerHTML = msgs.map(m => `<div class="msg">${m}</div>`).join("");
  }

  // ---------- premium modal ----------
  const modal = $("#premiumModal");
  function openPremium(){
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
  }
  function closePremium(){
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
  }

  $("#premiumBtn").addEventListener("click", openPremium);
  $("#goPremiumBtn").addEventListener("click", openPremium);
  $("#closePremium").addEventListener("click", closePremium);
  $("#notNow").addEventListener("click", closePremium);

  $("#startPremium").addEventListener("click", () => {
    state.premium = true;
    localStorage.setItem("jappaleh_premium", "true");
    $("#premiumState").textContent = "✦ Premium Active";
    $("#premiumState").classList.add("premiumActive");
    closePremium();
    toast("Premium activated ✦");
    confettiBurst();
  });

  // ---------- bigger text toggle ----------
  function applyTextSize(){
    document.body.style.fontSize = state.bigText ? "17px" : "16px";
  }
  $("#aaBtn").addEventListener("click", () => {
    state.bigText = !state.bigText;
    localStorage.setItem("jappaleh_bigtext", state.bigText ? "true" : "false");
    applyTextSize();
    toast(state.bigText ? "Bigger text ON" : "Bigger text OFF");
  });

  // ---------- bottom buttons ----------
  $("#postFromBottom").addEventListener("click", () => $('[data-view="create"]').click());
  $("#savedBtn").addEventListener("click", () => toast(`Saved: ${state.saved.size}`));

  // ---------- confetti (wow factor) ----------
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let confetti = [];
  let raf = null;

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function confettiBurst(){
    canvas.classList.add("show");
    confetti = Array.from({length: 140}, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: 3 + Math.random()*5,
      vx: -2 + Math.random()*4,
      vy: 2 + Math.random()*6,
      rot: Math.random()*Math.PI,
      vr: -0.2 + Math.random()*0.4,
      a: 1,
      // Kente palette
      c: [ "#0b5b3b", "#f2c94c", "#b11226", "#111111" ][Math.floor(Math.random()*4)]
    }));

    const start = performance.now();
    cancelAnimationFrame(raf);

    const loop = (t) => {
      const dt = (t - start) / 1000;
      ctx.clearRect(0,0,canvas.width,canvas.height);

      confetti.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vy += 0.03;
        p.a = clamp(1 - (dt/2.2), 0, 1);

        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r, p.r*2.2, p.r*1.6);
        ctx.restore();
      });

      if(dt < 2.2){
        raf = requestAnimationFrame(loop);
      }else{
        ctx.clearRect(0,0,canvas.width,canvas.height);
        canvas.classList.remove("show");
      }
    };
    raf = requestAnimationFrame(loop);
  }

  // ---------- first load ----------
  applyTextSize();
  renderCards();
  renderInbox();

  // premium state
  if(state.premium){
    $("#premiumState").textContent = "✦ Premium Active";
  }else{
    $("#premiumState").textContent = "✦ Premium (Try it)";
    $("#premiumState").addEventListener("click", openPremium);
  }

  // trust meter slight pulse (subtle wow)
  const trust = 92;
  $("#trustPct").textContent = trust + "%";
  $("#barFill").style.width = trust + "%";

  // welcome tip only once
  if(!localStorage.getItem("jappaleh_seenTour")){
    setTimeout(() => toast("WOW Tip: Click a card to expand. Long-press ★ to save."), 800);
    localStorage.setItem("jappaleh_seenTour","true");
  }
})();
// ===== PROFILE EDIT (fix) =====
(() => {
  const $ = (s, el=document) => el.querySelector(s);

  // 1) Add the modal once
  const modalHTML = `
    <div class="modal hidden" id="editModal" aria-hidden="true">
      <div class="modalCard card">
        <div class="modalTop">
          <div>
            <div class="modalTitle">Edit Profile</div>
            <div class="muted small">Update your name, location, and bio.</div>
          </div>
          <button class="x" id="closeEdit" aria-label="Close">✕</button>
        </div>

        <div class="form" style="margin-top:12px">
          <div class="field">
            <label>Name</label>
            <input id="editName" placeholder="Your name" />
          </div>

          <div class="field">
            <label>Location</label>
            <input id="editLocation" placeholder="City, State" />
          </div>

          <div class="field">
            <label>Bio</label>
            <textarea id="editBio" placeholder="Quick vibe (what you offer / what you’re looking for)…"></textarea>
          </div>

          <div class="btnRow" style="justify-content:flex-end">
            <button class="btn" id="cancelEdit">Cancel</button>
            <button class="btn primary" id="saveEdit">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // 2) Helpers
  const editModal = $("#editModal");
  const openEdit = () => {
    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden", "false");
  };
  const closeEdit = () => {
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
  };

  // 3) Load + Save
  const saved = JSON.parse(localStorage.getItem("jappaleh_profile") || "{}");
  const defaults = {
    name: saved.name || "Muhammed",
    location: saved.location || "Everett",
    bio: saved.bio || "Building community"
  };

  $("#editName").value = defaults.name;
  $("#editLocation").value = defaults.location;
  $("#editBio").value = defaults.bio;

  // 4) Wire the button you already have
  const editBtn = $("#editProfileBtn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      // refresh fields when opening
      const cur = JSON.parse(localStorage.getItem("jappaleh_profile") || "{}");
      $("#editName").value = cur.name || defaults.name;
      $("#editLocation").value = cur.location || defaults.location;
      $("#editBio").value = cur.bio || defaults.bio;
      openEdit();
    });
  }

  // 5) Close buttons
  $("#closeEdit").addEventListener("click", closeEdit);
  $("#cancelEdit").addEventListener("click", closeEdit);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEdit();
  });

  // 6) Save action: updates Profile UI
  $("#saveEdit").addEventListener("click", () => {
    const profile = {
      name: $("#editName").value.trim() || defaults.name,
      location: $("#editLocation").value.trim() || defaults.location,
      bio: $("#editBio").value.trim() || defaults.bio
    };

    localStorage.setItem("jappaleh_profile", JSON.stringify(profile));

    // Update the profile card text (simple + safe selectors)
    const nameEl = document.querySelector("#view-profile .bold");
    const subEl = document.querySelector("#view-profile .muted.small");

    if (nameEl) nameEl.textContent = profile.name;
    if (subEl) subEl.textContent = `${profile.location} • ${profile.bio}`;

    // Also update Location input on Home for nice continuity
    const locInput = $("#location");
    if (locInput) locInput.value = `${profile.location}`;

    // Use your existing toast if it exists
    try { window.toast ? window.toast("Profile updated ✅") : null; } catch(e) {}
    closeEdit();
  });
})();