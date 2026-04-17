const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:3000/api";

const listEl = document.getElementById("nakamalList");
const loadingStateEl = document.getElementById("loadingState");
const emptyStateEl = document.getElementById("emptyState");
const alertAreaEl = document.getElementById("alertArea");
const searchInputEl = document.getElementById("searchInput");
const nakamalCountEl = document.getElementById("nakamalCount");
const addModal = new bootstrap.Modal(document.getElementById("addNakamalModal"));
const detailModal = new bootstrap.Modal(document.getElementById("nakamalDetailModal"));
const detailTitleEl = document.getElementById("detailTitle");
const detailBodyEl = document.getElementById("detailBody");

let nakamals = [];

document.getElementById("refreshBtn").addEventListener("click", loadNakamals);
document.getElementById("openAddModalBtn").addEventListener("click", () => addModal.show());
searchInputEl.addEventListener("input", renderNakamalList);

document.getElementById("addNakamalForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  const payload = {
    name: formData.get("name")?.trim(),
    google_maps_link: cleanString(formData.get("google_maps_link")),
    opening_time: cleanString(formData.get("opening_time")),
    closing_time: cleanString(formData.get("closing_time")),
    alcohol_available: parseBoolean(formData.get("alcohol_available")),
    kakai_available: parseBoolean(formData.get("kakai_available")),
    kava_windows_count: parseNullableInt(formData.get("kava_windows_count")),
    rate: parseNullableFloat(formData.get("rate")),
    photo_urls: String(formData.get("photo_urls") || "")
      .split("\n")
      .map(v => v.trim())
      .filter(Boolean)
  };

  try {
    await apiFetch("/nakamals", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showAlert("Nakamal added successfully.", "success");
    form.reset();
    addModal.hide();
    await loadNakamals();
  } catch (error) {
    showAlert(error.message || "Could not add the nakamal.", "danger");
  }
});

async function loadNakamals() {
  loadingStateEl.classList.remove("d-none");
  emptyStateEl.classList.add("d-none");
  listEl.innerHTML = "";

  try {
    const data = await apiFetch("/nakamals");
    nakamals = data.nakamals || [];
    renderNakamalList();
  } catch (error) {
    showAlert(error.message || "Could not load the nakamals.", "danger");
  } finally {
    loadingStateEl.classList.add("d-none");
  }
}

function renderNakamalList() {
  const searchValue = searchInputEl.value.trim().toLowerCase();
  const filtered = nakamals.filter(n => n.name.toLowerCase().includes(searchValue));

  listEl.innerHTML = "";
  nakamalCountEl.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    emptyStateEl.classList.remove("d-none");
    return;
  }

  emptyStateEl.classList.add("d-none");

  filtered.forEach(nakamal => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-xl-4";
    const coverPhoto = nakamal.cover_photo_url
      ? `<img class="cover-photo" src="${escapeHtml(nakamal.cover_photo_url)}" alt="${escapeHtml(nakamal.name)}">`
      : `<div class="cover-placeholder">No photo yet</div>`;
    const rateText = nakamal.rate === null || nakamal.rate === undefined ? "Not rated yet" : `⭐ ${nakamal.rate}/5`;
    const hoursText = formatHours(nakamal.opening_time, nakamal.closing_time);

    card.innerHTML = `
      <div class="card nakamal-card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
        ${coverPhoto}
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h3 class="h5 mb-1">${escapeHtml(nakamal.name)}</h3>
            <span class="badge text-bg-success">${escapeHtml(rateText)}</span>
          </div>
          <p class="small-muted mb-3">${escapeHtml(hoursText)}</p>
          <div class="mb-3">
            ${booleanBadge("Alcohol", nakamal.alcohol_available)}
            ${booleanBadge("Kakai", nakamal.kakai_available)}
          </div>
          <p class="mb-3"><strong>Kava windows:</strong> ${nakamal.kava_windows_count ?? "Unknown"}</p>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-success flex-grow-1" data-view-id="${nakamal.id}">View details</button>
            ${nakamal.google_maps_link ? `<a class="btn btn-outline-secondary" href="${escapeAttribute(nakamal.google_maps_link)}" target="_blank" rel="noopener">Map</a>` : ""}
          </div>
        </div>
      </div>
    `;
    listEl.appendChild(card);
  });

  listEl.querySelectorAll("[data-view-id]").forEach(button => {
    button.addEventListener("click", () => openDetailModal(button.getAttribute("data-view-id")));
  });
}

async function openDetailModal(id) {
  detailTitleEl.textContent = "Loading...";
  detailBodyEl.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-success" role="status"></div>
    </div>
  `;
  detailModal.show();

  try {
    const data = await apiFetch(`/nakamals/${id}`);
    const nakamal = data.nakamal;
    detailTitleEl.textContent = nakamal.name;

    const photoCards = (nakamal.photos || []).length
      ? nakamal.photos.map(photo => `
          <div class="col-md-6 col-lg-4">
            <img class="modal-photo mb-2" src="${escapeHtml(photo.photo_url)}" alt="${escapeHtml(photo.caption || nakamal.name)}">
            ${photo.caption ? `<div class="small-muted">${escapeHtml(photo.caption)}</div>` : ""}
          </div>
        `).join("")
      : `<p class="text-muted">No photos yet.</p>`;

    const commentsCards = (nakamal.comments || []).length
      ? nakamal.comments.map(comment => `
          <div class="comment-card mb-3">
            <div class="d-flex justify-content-between gap-3">
              <strong>${escapeHtml(comment.nickname || "Anonymous")}</strong>
              <span class="small-muted">${escapeHtml(formatDate(comment.created_at))}</span>
            </div>
            <div class="mt-2">${escapeHtml(comment.comment_text)}</div>
          </div>
        `).join("")
      : `<p class="text-muted">No comments yet.</p>`;

    detailBodyEl.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <h6 class="section-title">Information</h6>
          <div class="mb-3">
            <span class="info-chip"><strong>Hours:</strong>&nbsp;${escapeHtml(formatHours(nakamal.opening_time, nakamal.closing_time))}</span>
            <span class="info-chip"><strong>Alcohol:</strong>&nbsp;${escapeHtml(formatYesNo(nakamal.alcohol_available))}</span>
            <span class="info-chip"><strong>Kakai:</strong>&nbsp;${escapeHtml(formatYesNo(nakamal.kakai_available))}</span>
            <span class="info-chip"><strong>Kava windows:</strong>&nbsp;${nakamal.kava_windows_count ?? "Unknown"}</span>
            <span class="info-chip"><strong>Rate:</strong>&nbsp;${nakamal.rate ?? "Not rated yet"}</span>
          </div>
          ${nakamal.google_maps_link ? `<p><a href="${escapeAttribute(nakamal.google_maps_link)}" target="_blank" rel="noopener">Open in Google Maps</a></p>` : `<p class="text-muted">No Google Maps link yet.</p>`}

          <h6 class="section-title mt-4">Photos</h6>
          <div class="row g-3">${photoCards}</div>

          <div class="card border-0 shadow-sm mt-4">
            <div class="card-body">
              <h6 class="section-title">Add a photo URL</h6>
              <form id="addPhotoForm">
                <div class="mb-3">
                  <label class="form-label">Photo URL</label>
                  <input name="photo_url" class="form-control" type="url" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Caption (optional)</label>
                  <input name="caption" class="form-control">
                </div>
                <button class="btn btn-success" type="submit">Add photo</button>
              </form>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <h6 class="section-title">Comments</h6>
          <div id="commentList">${commentsCards}</div>

          <div class="card border-0 shadow-sm mt-4">
            <div class="card-body">
              <h6 class="section-title">Add a comment</h6>
              <form id="addCommentForm">
                <div class="mb-3">
                  <label class="form-label">Nickname</label>
                  <input name="nickname" class="form-control" placeholder="Anonymous if left blank">
                </div>
                <div class="mb-3">
                  <label class="form-label">Comment</label>
                  <textarea name="comment_text" class="form-control" rows="4" required></textarea>
                </div>
                <button class="btn btn-success" type="submit">Post comment</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("addCommentForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      try {
        await apiFetch(`/nakamals/${nakamal.id}/comments`, {
          method: "POST",
          body: JSON.stringify({
            nickname: cleanString(formData.get("nickname")),
            comment_text: cleanString(formData.get("comment_text"))
          })
        });
        showAlert("Comment added successfully.", "success");
        await openDetailModal(nakamal.id);
      } catch (error) {
        showAlert(error.message || "Could not add the comment.", "danger");
      }
    });

    document.getElementById("addPhotoForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      try {
        await apiFetch(`/nakamals/${nakamal.id}/photos`, {
          method: "POST",
          body: JSON.stringify({
            photo_url: cleanString(formData.get("photo_url")),
            caption: cleanString(formData.get("caption"))
          })
        });
        showAlert("Photo URL added successfully.", "success");
        await openDetailModal(nakamal.id);
        await loadNakamals();
      } catch (error) {
        showAlert(error.message || "Could not add the photo.", "danger");
      }
    });

  } catch (error) {
    detailTitleEl.textContent = "Error";
    detailBodyEl.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message || "Could not load nakamal details.")}</div>`;
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" && data?.error ? data.error : "Request failed.";
    throw new Error(message);
  }

  return data;
}

function showAlert(message, type = "info") {
  alertAreaEl.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseNullableInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

function parseNullableFloat(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

function cleanString(value) {
  const output = String(value || "").trim();
  return output === "" ? null : output;
}

function formatHours(opening, closing) {
  if (!opening && !closing) return "Hours not provided";
  return `${opening || "?"} - ${closing || "?"}`;
}

function formatYesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function booleanBadge(label, value) {
  const text = formatYesNo(value);
  const badgeClass = value === true ? "text-bg-success" : value === false ? "text-bg-secondary" : "text-bg-light";
  return `<span class="badge ${badgeClass} me-1">${escapeHtml(label)}: ${escapeHtml(text)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

loadNakamals();
