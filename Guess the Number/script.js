
  

        const DIFFICULTIES = {
          easy:   { label: "FÁCIL",  min: 1, max: 50,  maxAttempts: 10 },
          medium: { label: "MEDIO",  min: 1, max: 100, maxAttempts: 12 },
          hard:   { label: "DIFÍCIL",min: 1, max: 200, maxAttempts: 15 },
        };

        const STORAGE_KEY = "numguess_scores";
        const MAX_RECORDS = 10;

    
        const state = {
          secret:       null,
          attempts:     0,
          maxAttempts:  12,
          min:          1,
          max:          100,
          rangeLow:     1,
          rangeHigh:    100,
          difficulty:   "medium",
          totalGames:   0,
          gameOver:     false,
          history:      [],
          hintUsed:     false,
        };

        const dom = {
          diffBtns:       document.querySelectorAll(".diff-btn"),
          statAttempt:    document.getElementById("stat-attempt"),
          statMax:        document.getElementById("stat-max"),
          statGames:      document.getElementById("stat-games"),
          attemptsBar:    document.getElementById("attempts-bar"),
          barLabel:       document.getElementById("bar-label"),
          attemptsTrack:  document.querySelector(".attempts-bar-track"),
          rangeLow:       document.getElementById("range-low"),
          rangeHigh:      document.getElementById("range-high"),
          guessInput:     document.getElementById("guess-input"),
          btnGuess:       document.getElementById("btn-guess"),
          feedback:       document.getElementById("feedback"),
          feedbackIcon:   document.getElementById("feedback-icon"),
          feedbackText:   document.getElementById("feedback-text"),
          feedbackSub:    document.getElementById("feedback-sub"),
          historyWrap:    document.getElementById("history-wrap"),
          historyList:    document.getElementById("history-list"),
          btnRestart:     document.getElementById("btn-restart"),
          btnHint:        document.getElementById("btn-hint"),
          scoreSection:   document.getElementById("score-section"),
          scoreGrid:      document.getElementById("score-grid"),
        };

   
        /**
         * Genera un entero aleatorio en [min, max].
         * @param {number} min
         * @param {number} max
         * @returns {number}
         */
        function randomInt(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }

       
        function triggerShake(el) {
          el.classList.remove("shake");
         
          void el.offsetWidth;
          el.classList.add("shake");
          el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
        }

        function saveScores(scores) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
          } catch {
            
          }
        }

       
        function loadScores() {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        }

       
        function recordScore(difficulty, attempts) {
          const scores = loadScores();
          scores.push({ difficulty, attempts, date: Date.now() });
   
          scores.sort((a, b) => a.attempts - b.attempts || b.date - a.date);
          const trimmed = scores.slice(0, MAX_RECORDS);
          saveScores(trimmed);
          return trimmed;
        }

       
        function initGame() {
          const cfg = DIFFICULTIES[state.difficulty];

          state.secret       = randomInt(cfg.min, cfg.max);
          state.attempts     = 0;
          state.maxAttempts  = cfg.maxAttempts;
          state.min          = cfg.min;
          state.max          = cfg.max;
          state.rangeLow     = cfg.min;
          state.rangeHigh    = cfg.max;
          state.gameOver     = false;
          state.history      = [];
          state.hintUsed     = false;

          // Debug (descomentar para trampear)
          // console.log("Número secreto:", state.secret);

          updateUI();
          resetFeedback();
          renderHistory();

          dom.guessInput.value = "";
          dom.guessInput.disabled = false;
          dom.guessInput.min = cfg.min;
          dom.guessInput.max = cfg.max;
          dom.btnGuess.disabled = false;
          dom.btnHint.disabled = false;
          dom.guessInput.focus();
        }

    
        function updateUI() {
          dom.statAttempt.textContent  = state.attempts;
          dom.statMax.textContent      = state.maxAttempts;
          dom.statGames.textContent    = state.totalGames;
          dom.rangeLow.textContent     = state.rangeLow;
          dom.rangeHigh.textContent    = state.rangeHigh;

       
          const pct = state.maxAttempts > 0
            ? (state.attempts / state.maxAttempts) * 100
            : 0;
          dom.attemptsBar.style.width = `${pct}%`;
          dom.barLabel.textContent    = `${state.attempts} / ${state.maxAttempts}`;
          dom.attemptsTrack.setAttribute("aria-valuenow", state.attempts);
          dom.attemptsTrack.setAttribute("aria-valuemax", state.maxAttempts);
        }

        function resetFeedback() {
          dom.feedback.className = "card feedback";
          dom.feedbackIcon.textContent = "🎮";
          dom.feedbackText.textContent = "¡BUENA SUERTE!";
          dom.feedbackSub.textContent  = "Podés pedir una pista ;)";
        }

   
        function renderHistory() {
          if (state.history.length === 0) {
            dom.historyWrap.classList.remove("visible");
            return;
          }

          dom.historyWrap.classList.add("visible");
          dom.historyList.innerHTML = "";

          [...state.history].reverse().forEach((entry) => {
            const li = document.createElement("li");
            li.classList.add("history-item", entry.result);

            const arrows   = { higher: "▲", lower: "▼", correct: "★" };
            const hints    = { higher: "MÁS ALTO", lower: "MÁS BAJO", correct: "¡CORRECTO!" };

            li.innerHTML = `
              <span class="history-num">${entry.guess}</span>
              <span class="history-arrow">${arrows[entry.result]}</span>
              <span class="history-hint">${hints[entry.result]}</span>
            `;
            dom.historyList.appendChild(li);
          });
        }

        function renderScoreboard() {
          const scores = loadScores();

          if (scores.length === 0) {
            dom.scoreSection.classList.remove("has-records");
            return;
          }

          dom.scoreSection.classList.add("has-records");
          dom.scoreGrid.innerHTML = "";

          const medals = ["gold", "silver", "bronze"];
          const labels = { easy: "FÁCIL", medium: "MEDIO", hard: "DIFÍCIL" };

          scores.forEach((entry, i) => {
            const row = document.createElement("div");
            row.classList.add("score-row");

            const rankClass = i < 3 ? medals[i] : "";
            const rankSymbols = ["🥇", "🥈", "🥉"];
            const rankDisplay = i < 3 ? rankSymbols[i] : `#${i + 1}`;

            row.innerHTML = `
              <span class="score-rank ${rankClass}">${rankDisplay}</span>
              <span class="score-diff ${entry.difficulty}">${labels[entry.difficulty] || entry.difficulty}</span>
              <span class="score-attempts">
                ${entry.attempts} <span>intento${entry.attempts !== 1 ? "s" : ""}</span>
              </span>
            `;
            dom.scoreGrid.appendChild(row);
          });
        }

   
        function processGuess() {
          if (state.gameOver) return;

          const raw   = dom.guessInput.value.trim();
          const guess = parseInt(raw, 10);

        
          if (isNaN(guess) || guess < state.min || guess > state.max) {
            triggerShake(dom.guessInput);
            showFeedback(
              "⚠️",
              `NÚMERO INVÁLIDO`,
              `Ingresa un número entre ${state.min} y ${state.max}`,
              ""
            );
            dom.guessInput.focus();
            return;
          }

          state.attempts++;
          updateUI();

          const entry = { guess, result: "" };

          if (guess === state.secret) {
           
            entry.result = "correct";
            state.history.push(entry);
            state.gameOver    = true;
            state.totalGames++;

            dom.guessInput.disabled = true;
            dom.btnGuess.disabled   = true;

            const scores = recordScore(state.difficulty, state.attempts);

            const plural = state.attempts === 1 ? "intento" : "intentos";
            showFeedback(
              "🏆",
              `¡GANASTE! EN ${state.attempts} ${plural.toUpperCase()}`,
              `El número era ${state.secret}`,
              "win"
            );

            renderHistory();
            renderScoreboard();

          } else if (state.attempts >= state.maxAttempts) {
            
            entry.result = guess < state.secret ? "higher" : "lower";
            state.history.push(entry);
            state.gameOver    = true;
            state.totalGames++;

            dom.guessInput.disabled = true;
            dom.btnGuess.disabled   = true;

            showFeedback(
              "💀",
              `GAME OVER`,
              `El número era ${state.secret}`,
              "lose"
            );

            renderHistory();

          } else if (guess < state.secret) {
          
            entry.result = "higher";
            state.history.push(entry);
            state.rangeLow = Math.max(state.rangeLow, guess + 1);
            updateUI();

            const remaining = state.maxAttempts - state.attempts;
            showFeedback(
              "🔺",
              "¡MÁS ALTO!",
              `Te quedan ${remaining} intento${remaining !== 1 ? "s" : ""}`,
              "hint-higher"
            );
            triggerShake(dom.feedback);
            renderHistory();

          } else {
           
            entry.result = "lower";
            state.history.push(entry);
            state.rangeHigh = Math.min(state.rangeHigh, guess - 1);
            updateUI();

            const remaining = state.maxAttempts - state.attempts;
            showFeedback(
              "🔻",
              "¡MÁS BAJO!",
              `Te quedan ${remaining} intento${remaining !== 1 ? "s" : ""}`,
              "hint-lower"
            );
            triggerShake(dom.feedback);
            renderHistory();
          }

          dom.guessInput.value = "";
          if (!state.gameOver) dom.guessInput.focus();
        }

      
        function showFeedback(icon, text, sub, cssClass) {
          dom.feedbackIcon.textContent = icon;
          dom.feedbackText.textContent = text;
          dom.feedbackSub.textContent  = sub;

          dom.feedback.className = `card feedback${cssClass ? " " + cssClass : ""}`;
        }

        function giveHint() {
          if (state.gameOver || state.hintUsed) return;

          state.hintUsed = true;
          dom.btnHint.disabled  = true;
          dom.btnHint.textContent = "💡 PISTA USADA";

          const mid    = Math.floor((state.rangeLow + state.rangeHigh) / 2);
          const isEven = state.secret % 2 === 0;
          const isDivisibleBy5 = state.secret % 5 === 0;

          let hint = `El número es ${isEven ? "par" : "impar"}`;
          if (isDivisibleBy5) hint += " y divisible por 5";
          if (state.secret > mid) hint += `. Está en la mitad superior del rango`;
          else hint += `. Está en la mitad inferior del rango`;

          showFeedback("💡", "PISTA DESBLOQUEADA", hint, "");
        }

        function changeDifficulty(btn) {
          dom.diffBtns.forEach((b) => {
            b.classList.remove("active");
            b.setAttribute("aria-pressed", "false");
          });

          btn.classList.add("active");
          btn.setAttribute("aria-pressed", "true");
          state.difficulty = btn.dataset.difficulty;

          initGame();
        }

        dom.btnGuess.addEventListener("click", processGuess);

        dom.guessInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") processGuess();
        });

        dom.btnRestart.addEventListener("click", initGame);

        dom.btnHint.addEventListener("click", giveHint);

        dom.diffBtns.forEach((btn) => {
          btn.addEventListener("click", () => changeDifficulty(btn));
        });

   
        renderScoreboard();
        initGame();
     