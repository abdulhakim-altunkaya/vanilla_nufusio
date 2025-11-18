document.addEventListener("DOMContentLoaded", async () => {
  const commentList = document.getElementById("comment-list");
  const mainForm = document.getElementById("comment-form");
  if (!commentList) return;

  // --- Determine pageId based on URL ---
  const url = new URL(window.location.href);
  let pageId = 0;

  if (url.pathname.includes("ilce-nufus.html")) {
    pageId = Number(url.searchParams.get("districtId")) || 0;
  } else if (url.pathname.includes("il-nufus.html")) {
    pageId = Number(url.searchParams.get("provinceId")) || 0;
  } else if (url.pathname.includes("turkiye.html")) {
    pageId = 1;
  }

  if (!pageId) {
    commentList.innerHTML = `<p class="no-comments">Sayfa kimliği bulunamadı.</p>`;
    return;
  }

  try {
    const res = await axios.get(`https://www.eumaps.org/api/kac-milyon/get-comments/${pageId}`);

    if (res.data.resStatus && Array.isArray(res.data.resData) && res.data.resData.length > 0) {
      commentList.innerHTML = "";

      const allComments = res.data.resData.reverse();
      const topComments = allComments.filter(c => c.parent_id === null);
      const replies = allComments.filter(c => c.parent_id !== null);

      function getReplies(parentId) {
        return replies.filter(r => r.parent_id === parentId);
      }

      topComments.forEach(comment => {
        const item = document.createElement("div");
        item.classList.add("comment-item");

        const commentReplies = getReplies(comment.id).reverse();

        item.innerHTML = `
          <div class="comment-item-header"> 
            <div class="comment-author">${sanitize(comment.name)}</div>
            <div class="comment-date">${comment.date || ""}</div>
          </div>
          <div class="comment-text">${sanitize(comment.comment)}</div>
          
          <button class="reply-btn" data-id="${comment.id}">Yanıtla</button>
          <div class="reply-section"></div>
          <div class="reply-list">
            ${commentReplies.map(r => {
              const formattedDate = r.date || "";
              return `
                <div class="reply">
                  <div class="reply-header">
                    <span class="reply-author">${sanitize(r.name)}</span>
                    <span class="reply-date">(${formattedDate})</span>:
                  </div>
                  <div class="reply-text">${sanitize(r.comment)}</div>
                </div>
              `;
            }).join("")}
          </div>
        `;

        commentList.appendChild(item);
      });

      document.querySelectorAll(".reply-btn").forEach(btn => {
        btn.addEventListener("click", handleReplyClick);
      });
    } else {
      commentList.innerHTML = `<p class="no-comments">Henüz yorum yok.</p>`;
    }
  } catch (err) {
    console.error("Yorumları çekerken hata:", err);
    commentList.innerHTML = `<p class="no-comments">Yorumlar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>`;
  }

  // --- Handle reply form toggle and submission ---
  function handleReplyClick(e) {
    const btn = e.target;
    const commentId = btn.dataset.id;
    const replySection = btn.nextElementSibling;

    // If this replySection already has a form, user clicked "Vazgeç" (cancel)
    const existingForm = replySection.querySelector("form");
    if (existingForm) {
      existingForm.remove();
      btn.textContent = "Yanıtla";
      enableMainForm();
      return;
    }

    // No form here — remove any other open reply forms first, and reset buttons
    document.querySelectorAll(".reply-form").forEach(f => f.remove());
    document.querySelectorAll(".reply-btn").forEach(b => (b.textContent = "Yanıtla"));
    enableMainForm(); // ensure main form is enabled before disabling for new one

    // Create the form for this comment
    const form = document.createElement("form");
    form.classList.add("reply-form");
    form.innerHTML = `
      <input class="replyFormName" type="text" name="replyName" maxlength="40" placeholder="Ad Soyad" required>
      <textarea class="replyFormText" name="replyText" rows="3" maxlength="150" placeholder="Yanıtınız" required></textarea>
      <button class="replyFormBtn" type="submit">Gönder</button>
    `;

    btn.textContent = "Vazgeç"; // change button text while open
    disableMainForm(); // disable comment area while replying

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const inputName = sanitize(form.replyName.value);
      const inputMessage = sanitize(form.replyText.value);
      if (!inputName || !inputMessage) return;
      if (inputName.length > 40) {
        alert("İsim 40 karakterden uzun olamaz.");
        return;
      }

      if (inputMessage.length > 150) {
        alert("Yanıt 150 karakterden uzun olamaz.");
        return;
      }
      try {
        const res = await axios.post(`https://www.eumaps.org/api/kac-milyon/save-reply`, {
          inputName,
          inputMessage,
          pageId,
          commentId
        });

        if (res.data.resStatus) {
          const replyList = replySection.nextElementSibling;
          const newReply = document.createElement("div");
          newReply.classList.add("reply");
          const formattedDate = new Date().toLocaleDateString('tr-TR');
          newReply.innerHTML = `
            <div class="reply-header">
              <span class="reply-author">${inputName}</span>
              <span class="reply-date">(${formattedDate})</span>:
            </div>
            <div class="reply-text">${inputMessage}</div>
          `;
          replyList.appendChild(newReply);
          form.remove();
          btn.textContent = "Yanıtla";
          enableMainForm();
        } else {
          alert("Yanıt eklenemedi. Lütfen tekrar deneyin.");
        }
      } catch (err) {
        console.error("Yanıt gönderme hatası:", err);
        alert("Sunucu hatası oluştu. Daha sonra tekrar deneyin.");
      }
    });

    replySection.appendChild(form);
  }


  // --- disable/enable main comment form ---
  function disableMainForm() {
    if (!mainForm) return;
    mainForm.querySelectorAll("input, textarea, button").forEach(el => (el.disabled = true));
    mainForm.style.opacity = "0.5";
  }

  function enableMainForm() {
    if (!mainForm) return;
    mainForm.querySelectorAll("input, textarea, button").forEach(el => (el.disabled = false));
    mainForm.style.opacity = "1";
  }

  // --- Simple sanitizer ---
  function sanitize(str) {
    if (typeof str !== "string") return "";
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
  }
});
