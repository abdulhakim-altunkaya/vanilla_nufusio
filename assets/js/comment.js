document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("comment-form");
  const responseBox = document.getElementById("comment-response");
  const commentList = document.getElementById("comment-list"); // 👈 add this
  if (!form || !responseBox) return;

  // --- Detect pageId dynamically ---
  const url = new URL(window.location.href);
  let pageId = 0;

  if (url.pathname.includes("ilce-nufus.html")) {
    pageId = Number(url.searchParams.get("districtId")) || 0;
  } else if (url.pathname.includes("il-nufus.html")) {
    pageId = Number(url.searchParams.get("provinceId")) || 0;
  } else if (url.pathname.includes("turkiye.html")) {
    pageId = 1; // country ID
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputName = document.getElementById("name").value.trim();
    const inputMessage = document.getElementById("message").value.trim();

    if (!inputName || !inputMessage) {
      responseBox.textContent = "Lütfen tüm alanları doldurun.";
      responseBox.style.color = "red";
      return;
    }

    if (inputName.length > 40) {
      responseBox.textContent = "İsim 40 karakterden uzun olamaz.";
      responseBox.style.color = "red";
      return;
    }

    if (inputMessage.length > 200) {
      responseBox.textContent = "Mesaj 200 karakterden uzun olamaz.";
      responseBox.style.color = "red";
      return;
    }

    if (!pageId) {
      responseBox.textContent = "Sayfa kimliği bulunamadı.";
      responseBox.style.color = "red";
      return;
    }

    try {
      const res = await axios.post("https://www.eumaps.org/api/kac-milyon/save-comment", {
        inputName,
        inputMessage,
        pageId,
      });

      if (res.data.resStatus) {
        responseBox.textContent = "Yorumunuz kaydedildi, teşekkürler!";
        responseBox.style.color = "green";

        // --- Add comment immediately to the list ---
        if (commentList) {
          const newComment = document.createElement("div");
          newComment.classList.add("comment-item");

          const formattedDate = new Date().toLocaleDateString("tr-TR");
          newComment.innerHTML = `
            <div class="comment-item-header"> 
              <div class="comment-author">${sanitize(inputName)}</div>
              <div class="comment-date">${formattedDate}</div>
            </div>
            <div class="comment-text">${sanitize(inputMessage)}</div>
            <button class="reply-btn" data-id="temp-${Date.now()}">Yanıtla</button>
            <div class="reply-section"></div>
            <div class="reply-list"></div>
          `;
          commentList.prepend(newComment); // 👈 add to top
        }

        form.reset();
      } else {
        responseBox.textContent = res.data.resMessage || "Yorum kaydedilemedi.";
        responseBox.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      responseBox.textContent = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
      responseBox.style.color = "red";
    }
  });

  // --- Simple sanitizer (same as display.js) ---
  function sanitize(str) {
    if (typeof str !== "string") return "";
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
  }
});
