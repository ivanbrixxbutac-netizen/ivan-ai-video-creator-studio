
const categoryButtons = document.querySelectorAll(".category");
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");
const promptInput = document.getElementById("prompt");
const ratioInput = document.getElementById("ratio");
const durationInput = document.getElementById("duration");
const generateBtn = document.getElementById("generateBtn");
const result = document.getElementById("result");
const workspaceStatus = document.getElementById("workspaceStatus");

let selectedCategory = "Cinematic";
let selectedFiles = [];
let previewUrls = [];

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedCategory = button.dataset.category;
    result.hidden = true;
  });
});

mediaInput.addEventListener("change", () => {
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls = [];
  selectedFiles = Array.from(mediaInput.files || []);
  mediaPreview.replaceChildren();

  selectedFiles.forEach((file) => {
    const card = document.createElement("div");
    card.className = "media-card";

    const url = URL.createObjectURL(file);
    previewUrls.push(url);

    let preview;
    if (file.type.startsWith("video/")) {
      preview = document.createElement("video");
      preview.controls = true;
      preview.preload = "metadata";
    } else if (file.type.startsWith("image/")) {
      preview = document.createElement("img");
      preview.alt = file.name;
    } else {
      return;
    }

    preview.src = url;

    const name = document.createElement("div");
    name.className = "media-name";
    name.textContent = file.name;

    card.append(preview, name);
    mediaPreview.append(card);
  });

  workspaceStatus.textContent = selectedFiles.length
    ? `${selectedFiles.length} file(s) selected`
    : "Ready to create";
});

generateBtn.addEventListener("click", () => {
  const prompt = promptInput.value.trim();

  if (!prompt && selectedFiles.length === 0) {
    result.textContent =
      "Add a video idea or select media from your phone first.";
    result.hidden = false;
    return;
  }

  const summary = {
    category: selectedCategory,
    prompt: prompt || "Create a video using the selected media.",
    aspectRatio: ratioInput.value,
    durationSeconds: Number(durationInput.value),
    files: selectedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      sizeBytes: file.size
    }))
  };

  result.replaceChildren();

  const heading = document.createElement("strong");
  heading.textContent = "Your video project is ready to prepare";

  const details = document.createElement("pre");
  details.style.whiteSpace = "pre-wrap";
  details.style.fontFamily = "inherit";
  details.textContent = JSON.stringify(summary, null, 2);

  const explanation = document.createElement("p");
  explanation.textContent =
    "Demo only: no AI video has been generated. Connect a supported AI video API through a secure backend to generate a real video.";

  result.append(heading, details, explanation);
  result.hidden = false;
  workspaceStatus.textContent = "Project prepared in demo mode";
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

window.addEventListener("beforeunload", () => {
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
});
                        
