//ProvinceApp here is a namespace which helps us to prevent getProvincesData and renderProvinces
//do not leak into global scope of the app at the same time.
//This file is used only to create population table on homepage
const ProvincesApp = (() => {
  const getProvincesData = async () => {
    try {
      const response = await axios.get("https://www.eumaps.org/api/kac-milyon/get-provinces");
      const { resStatus, resData, resMessage } = response.data;

      if (resStatus && Array.isArray(resData)) {
        console.log("✅ Provinces fetched with Namespace:", resData);
        renderProvinces(resData);
      } else {
        console.warn("⚠️ API returned error:", resMessage);
      }
    } catch (error) {
      console.error("❌ Request failed:", error.message);
    }
  };

  const renderProvinces = (provinces) => {
    console.log("Rendering provinces:", provinces);
    console.log("First item keys:", Object.keys(provinces[0] || {}));

    const tableBody = document.getElementById("provinces-table-body");
    if (!tableBody) {
      console.error("❌ No element with id 'provinces-table-body' found!");
      return;
    }

    tableBody.innerHTML = "";

    provinces.forEach((province, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><a href="il-nufus.html?provinceId=${province.provinceid}">
          ${province.provincename}
        </a>
        </td>
        <td>${formatNumber(province["2024"])}</td>
        <td>${formatNumber(province["2023"])}</td>
        <td>${formatNumber(province["2022"])}</td>
        <td>${formatNumber(province["2015"])}</td>
        <td>${formatNumber(province["2011"])}</td>
        <td>${formatNumber(province["2007"])}</td>
      `;
      tableBody.appendChild(row);
    });
  };
  const formatNumber = (value) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toLocaleString("tr-TR");
  };

  // run on load
  getProvincesData();


    //When a visitor clicks on a province on the map, this map will take him to the province page.
  document.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById("svg-display");
    if (!svg) return;

    svg.addEventListener("load", () => {
      const svgDoc = svg.contentDocument;
      if (!svgDoc) {
        console.error("SVG content not loaded yet");
        return;
      }

      // select paths and circles inside the loaded SVG
      const clickableEls = svgDoc.querySelectorAll("path[id^='TR'], circle[id^='TR']");
      if (clickableEls.length === 0) {
        console.warn('No SVG paths found—likely on province page with <object>'); // Optional
        return; // Skip event setup
      }
      clickableEls.forEach(el => {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          const provinceId = el.id.replace("TR", ""); // TR56 -> 56
          window.location.href = `il-nufus.html?provinceId=${provinceId}`;
        });
      });

      console.log("✅ SVG provinces clickable");
    });
  });



})();
