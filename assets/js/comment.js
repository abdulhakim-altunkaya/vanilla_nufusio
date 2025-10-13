// comment.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("comment-form");
  const responseBox = document.getElementById("comment-response");
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
});
