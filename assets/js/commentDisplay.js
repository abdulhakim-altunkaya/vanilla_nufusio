// commentDisplay.js
document.addEventListener("DOMContentLoaded", async () => {
  const commentList = document.getElementById("comment-list");
  if (!commentList) return;

  // --- Determine pageId based on URL ---
  const url = new URL(window.location.href);
  let pageId = 0;

  if (url.pathname.includes("ilce-nufus.html")) {
    pageId = Number(url.searchParams.get("districtId")) || 0;
  } else if (url.pathname.includes("il-nufus.html")) {
    pageId = Number(url.searchParams.get("provinceId")) || 0;
  } else if (url.pathname.includes("turkiye.html")) {
    pageId = 1; // country page
  }

  if (!pageId) {
    commentList.innerHTML = `<p class="no-comments">Sayfa kimliği bulunamadı.</p>`;
    return;
  }

  try {
    const res = await axios.get(`https://www.eumaps.org/api/kac-milyon/get-comments/${pageId}`);

    if (res.data.resStatus && Array.isArray(res.data.resData) && res.data.resData.length > 0) {
      commentList.innerHTML = ""; // clear placeholder

      res.data.resData.forEach(comment => {
        const item = document.createElement("div");
        item.classList.add("comment-item");
        item.innerHTML = `
          <div class="comment-author">${sanitize(comment.name)}</div>
          <div class="comment-text">${sanitize(comment.comment)}</div>
          <div class="comment-date">${comment.date || ""}</div>
        `;
        commentList.appendChild(item);
      });
    } else {
      commentList.innerHTML = `<p class="no-comments">Henüz yorum yok.</p>`;
    }
  } catch (err) {
    console.error("Yorumları çekerken hata:", err);
    commentList.innerHTML = `<p class="no-comments">Yorumlar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>`;
  }

  // --- Simple sanitizer (same approach as your input sanitation policy) ---
  function sanitize(str) {
    if (typeof str !== "string") return "";
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
  }
});
