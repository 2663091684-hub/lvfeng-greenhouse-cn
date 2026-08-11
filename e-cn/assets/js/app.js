(function () {
  "use strict";

  var INQUIRY_ENDPOINT = (window.INQUIRY_ENDPOINT || "/inquiry").replace(/\/+$/, "");

  document.addEventListener("DOMContentLoaded", function () {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    var header = document.getElementById("siteHeader");
    var nav = document.getElementById("mainNav");
    var navToggle = document.getElementById("navToggle");

    function onScroll() {
      if (window.scrollY > 24) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    var cropData = {
      tomato: { label: "番茄", low: 1.5, high: 3.5 },
      leaf: { label: "叶菜", low: 1.2, high: 2.8 },
      strawberry: { label: "草莓", low: 2.0, high: 4.0 },
      flower: { label: "花卉", low: 1.8, high: 3.6 },
      seedling: { label: "育苗", low: 1.4, high: 3.2 },
      other: { label: "其他", low: 1.0, high: 2.5 }
    };

    var typeData = {
      film: { label: "连栋薄膜温室", low: 4.5, high: 8.0 },
      glass: { label: "玻璃温室", low: 12.0, high: 20.0 }
    };

    var calcForm = document.getElementById("calcForm");
    var calcResult = document.getElementById("calcResult");
    var resultInvestment = document.getElementById("resultInvestment");
    var resultRevenue = document.getElementById("resultRevenue");
    var resultPayback = document.getElementById("resultPayback");

    function formatWan(value) {
      if (value >= 10000) {
        return (value / 10000).toFixed(1) + "亿";
      }
      return value.toFixed(1) + "万";
    }

    function parseNumber(input) {
      var value = parseFloat(input.value);
      if (isNaN(value) || value <= 0) return null;
      return value;
    }

    function runCalculation(area, cropKey, typeKey) {
      var crop = cropData[cropKey] || cropData.other;
      var type = typeData[typeKey] || typeData.film;

      var investLow = area * type.low;
      var investHigh = area * type.high;
      var revenueLow = area * crop.low;
      var revenueHigh = area * crop.high;
      var paybackLow = investLow / revenueHigh;
      var paybackHigh = investHigh / revenueLow;

      return {
        investment: "约" + formatWan(investLow) + " - " + formatWan(investHigh),
        revenue: "约" + formatWan(revenueLow) + " - " + formatWan(revenueHigh) + "/年",
        payback: "约" + paybackLow.toFixed(1) + " - " + paybackHigh.toFixed(1) + "年"
      };
    }

    calcForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var area = parseNumber(document.getElementById("areaInput"));
      if (!area) {
        document.getElementById("areaInput").focus();
        return;
      }

      var result = runCalculation(
        area,
        document.getElementById("cropSelect").value,
        document.getElementById("typeSelect").value
      );

      resultInvestment.textContent = result.investment;
      resultRevenue.textContent = result.revenue;
      resultPayback.textContent = result.payback;
      calcResult.hidden = false;
      calcResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.getElementById("toReportBtn").addEventListener("click", function () {
      var area = parseNumber(document.getElementById("areaInput"));
      var crop = document.getElementById("cropSelect").value;
      var reportArea = document.getElementById("reportArea");
      var reportCrop = document.getElementById("reportCrop");
      if (area) {
        reportArea.value = area;
      }
      reportCrop.value = crop;
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
      setTimeout(function () {
        document.getElementById("reportName").focus();
      }, 700);
    });

    var reportForm = document.getElementById("reportForm");
    var formSuccess = document.getElementById("formSuccess");
    var formError = document.getElementById("formError");
    var resetFormBtn = document.getElementById("resetFormBtn");
    var submitBtn = document.getElementById("submitBtn");

    function showError(message) {
      formError.textContent = message;
      formError.classList.add("visible");
    }

    function hideError() {
      formError.textContent = "";
      formError.classList.remove("visible");
    }

    function setSubmitting(submitting) {
      submitBtn.disabled = submitting;
      submitBtn.querySelector("span").textContent = submitting ? "正在提交..." : "提交项目咨询";
    }

    reportForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError();

      var name = document.getElementById("reportName").value.trim();
      var area = parseNumber(document.getElementById("reportArea"));
      var phone = document.getElementById("reportPhone").value.trim();
      var crop = document.getElementById("reportCrop").value;
      var message = document.getElementById("reportMessage").value.trim();
      var hp = document.getElementById("hpInput").value.trim();

      if (hp) {
        showReportSuccess();
        return;
      }
      if (!name) {
        showError("请填写您的称呼");
        document.getElementById("reportName").focus();
        return;
      }
      if (!area) {
        showError("请填写种植面积");
        document.getElementById("reportArea").focus();
        return;
      }
      if (!/^[0-9+\-\s()]{6,24}$/.test(phone)) {
        showError("请填写有效的联系电话");
        document.getElementById("reportPhone").focus();
        return;
      }

      var payload = {
        source: "cn-site",
        name: name,
        area: area,
        unit: "亩",
        crop: crop,
        phone: phone,
        message: message,
        page: location.pathname,
        submitted_at: new Date().toISOString()
      };

      setSubmitting(true);
      fetch(INQUIRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (resp) {
          if (!resp.ok) {
            throw new Error("HTTP " + resp.status);
          }
          return resp.json().catch(function () {
            return {};
          });
        })
        .then(function () {
          showReportSuccess(name, area, crop);
        })
        .catch(function () {
          setSubmitting(false);
          showError("提交失败，请稍后重试，或直接通过其他方式联系我们");
        });
    });

    function showReportSuccess(name, area, cropKey) {
      reportForm.hidden = true;
      formSuccess.hidden = false;
      var message = "您的项目咨询已提交成功，专属顾问将尽快与您联系并出具方案解读。";
      if (area && cropData[cropKey]) {
        message = "已记录" + area + "亩" + cropData[cropKey].label + "种植项目，专属顾问将尽快与您联系并出具方案解读。";
      }
      formSuccess.querySelector("p").textContent = message;
    }

    resetFormBtn.addEventListener("click", function () {
      reportForm.reset();
      formSuccess.hidden = true;
      reportForm.hidden = false;
    });
  });

  function fixCrossSiteLinks() {
    var isLocal = /^(127\.0\.0\.1|localhost)$/i.test(location.hostname);
    document.querySelectorAll("a[data-local][data-public]").forEach(function (link) {
      link.href = isLocal ? link.getAttribute("data-local") : link.getAttribute("data-public");
    });
  }
  fixCrossSiteLinks();
})();
