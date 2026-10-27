
const WORKER_URL =
  "https://hidden-cherry-e485.ivanbrixxbutac.workers.dev";

const categoryButtons = document.querySelectorAll(".category");
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");
const promptInput = document.getElementById("prompt");
const durationInput = document.getElementById("duration");
const generateBtn = document.getElementById("generateBtn");
const result = document.getElementById("result");
const workspaceStatus = document.getElementById("workspaceStatus");

let selectedCategory = "Cinematic";
let previewUrl = null;
let isGenerating = false;

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedCategory = button.dataset.category || "Cinematic";
  });
});

if (mediaInput) {
  mediaInput.accept = "image/jpeg,image/png,image/webp,image/bmp";

  mediaInput.addEventListener("change", () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    mediaPreview?.replaceChildren();

    const file = mediaInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Pumili ng larawan mula sa gallery.");
      mediaInput.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showMessage("Hanggang 8 MB lang ang larawan.");
      mediaInput.value = "";
      return;
    }

    previewUrl = URL.createObjectURL(file);

    const img = document.createElement("img");
    img.src = previewUrl;
    img.alt = "Selected image";
    img.style.width = "100%";
    img.style.maxHeight = "240px";
    img.style.objectFit = "contain";

    mediaPreview?.append(img);
    setStatus("Image selected");
  });
}

function setStatus(message) {
  if (workspaceStatus) {
    workspaceStatus.textContent = message;
  }
}

function showMessage(message) {
  if (!result) return;

  result.hidden = false;
  result.replaceChildren();
  result.textContent = message;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Hindi mabasa ang larawan."));
    reader.readAsDataURL(file);
  });
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const extra = data.details ? ` ${data.details}` : "";
    throw new Error((data.error || "Request failed.") + extra);
  }

  return data;
}

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    if (isGenerating) return;

    const file = mediaInput?.files?.[0];
    const prompt = promptInput?.value.trim() || "";

    if (!file) {
      showMessage("Pumili muna ng larawan mula sa gallery.");
      return;
    }

    if (!prompt) {
      showMessage("Ilagay muna ang prompt ng video.");
      return;
    }

    if (prompt.length > 1500) {
      showMessage("Hanggang 1500 characters lang ang prompt.");
      return;
    }

    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.textContent = "Submitting...";
    showMessage("Ipinapadala ang request sa AI...");
    setStatus("Submitting request");

    try {
      const image = await fileToDataURL(file);

      const job = await requestJSON(
        `${WORKER_URL}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: `${selectedCategory} style. ${prompt}`,
            image,
            duration: durationInput?.value === "10" ? "10" : "5"
          })
        }
      );

      showMessage("Nasa queue na ang request. Ginagawa ang video...");
      setStatus("Generating video");

      for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const status = await requestJSON(
          `${WORKER_URL}/status?id=${encodeURIComponent(job.requestId)}`
        );

        if (status.status === "FAILED") {
          throw new Error(status.error || "Nabigo ang paggawa ng video.");
        }

        if (status.status === "COMPLETED" && status.videoUrl) {
          const video = document.createElement("video");
          video.src = status.videoUrl;
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          video.style.width = "100%";

          const link = document.createElement("a");
          link.href = status.videoUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Buksan o i-save ang video";
          link.style.display = "block";
          link.style.marginTop = "12px";

          result.replaceChildren(video, link);
          result.hidden = false;
          setStatus("Video generated");
          return;
        }

        showMessage(`Ginagawa pa ang video... ${status.status}`);
      }

      showMessage(
        "Matagal pa ang pagproseso. Maaaring tumatakbo pa ang request. Tingnan muna ang status bago sumubok ulit."
      );
      setStatus("Still processing");

    } catch (error) {
      showMessage(`Error: ${error.message}`);
      setStatus("Generation error");

    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      generateBtn.textContent = "✦ Generate real video";
    }
  });
                            }
