let mediaRecorder;
let audioChunks = [];

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const audioPlayback = document.getElementById("audioPlayback");
const descriptionInput = document.getElementById("description");
const noteList = document.getElementById("noteList");
const searchInput = document.getElementById("search");
const popup = document.getElementById("popup");

let currentBlob = null;

// Detect if the browser is iOS Safari
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (isIOS && isSafari) {
  alert("Voice recording is not supported on iOS Safari. Please try Chrome on Android or use a desktop browser.");
  startBtn.disabled = true;
}

// Start recording
startBtn.onclick = async () => {
  if (isIOS && isSafari) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];
    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

    mediaRecorder.onstop = () => {
      currentBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioPlayback.src = URL.createObjectURL(currentBlob);
      saveBtn.disabled = false;
      downloadBtn.disabled = false;
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Button color change (green when recording)
    startBtn.classList.add("recording");
    startBtn.classList.remove("stopped");
  } catch (err) {
    alert("Microphone access denied or not available.");
    console.error("Error accessing microphone:", err);
  }
};

// Stop recording
stopBtn.onclick = () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;

  // Button color change (red when stopped)
  startBtn.classList.remove("recording");
  startBtn.classList.add("stopped");
};

// Save note
saveBtn.onclick = () => {
  if (!currentBlob) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result;
    const date = new Date().toLocaleString();
    const description = descriptionInput.value || "No description";

    const savedNotes = JSON.parse(localStorage.getItem("voiceNotes") || "[]");
    savedNotes.push({ base64, date, description });
    localStorage.setItem("voiceNotes", JSON.stringify(savedNotes));

    descriptionInput.value = "";
    saveBtn.disabled = true;
    downloadBtn.disabled = true;
    showPopup("✅ Note saved successfully!");
    loadNotes();
  };
  reader.readAsDataURL(currentBlob);
};

// Download audio
downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.href = audioPlayback.src;
  a.download = `VoiceNote-${new Date().toISOString()}.webm`;
  a.click();
};

// Load notes
function loadNotes() {
  noteList.innerHTML = "";
  const savedNotes = JSON.parse(localStorage.getItem("voiceNotes") || "[]");
  const searchTerm = searchInput.value.toLowerCase();

  savedNotes.forEach((note, index) => {
    if (
      note.description.toLowerCase().includes(searchTerm) ||
      note.date.toLowerCase().includes(searchTerm)
    ) {
      const li = document.createElement("li");
      li.className = "note-item";
      li.innerHTML = `
        <strong>${note.date}</strong><br/>
        ${note.description}<br/>
        <audio controls src="${note.base64}"></audio>
        <br/>
        <button onclick="deleteNote(${index})">🗑️ Delete</button>
      `;
      noteList.appendChild(li);
    }
  });
}

const historyTableBody = document.querySelector("#historyTable tbody");
historyTableBody.innerHTML = ""; // Clear old rows

savedNotes.forEach((note) => {
  if (
    note.description.toLowerCase().includes(searchTerm) ||
    note.date.toLowerCase().includes(searchTerm)
  ) {
    // Existing list display
    const li = document.createElement("li");
    li.className = "note-item";
    li.innerHTML = `
      <strong>${note.date}</strong><br/>
      ${note.description}<br/>
      <audio controls src="${note.base64}"></audio>
      <br/>
      <button onclick="deleteNote(${index})">🗑️ Delete</button>
    `;
    noteList.appendChild(li);

    // Add to history table
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${note.date}</td>
      <td>${note.description}</td>
      <td><audio controls src="${note.base64}"></audio></td>
    `;
    historyTableBody.appendChild(row);
  }
});


// Popup display
function showPopup(message) {
  popup.textContent = message;
  popup.classList.add("show");
  setTimeout(() => {
    popup.classList.remove("show");
  }, 2500);
}

// Delete note
function deleteNote(index) {
  const savedNotes = JSON.parse(localStorage.getItem("voiceNotes") || "[]");
  savedNotes.splice(index, 1);
  localStorage.setItem("voiceNotes", JSON.stringify(savedNotes));
  showPopup("🗑️ Note deleted!");
  loadNotes();
}

// Search
searchInput.addEventListener("input", loadNotes);

// Init
loadNotes();
