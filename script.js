// Store all file paths of songs
let filePath = [];
let currentSong = new Audio();
let folder = ""; // Current album/folder
let songs = [];

// Format seconds into MM:SS string
function formatTime(seconds) {
    if (isNaN(seconds) || seconds == "") {
        return "00:00";
    }
    let minutes = Math.floor(seconds / 60);
    let secnds = Math.floor(seconds % 60);
    minutes = minutes.toString().padStart(2, '0');
    secnds = secnds.toString().padStart(2, "0");
    return `${minutes}:${secnds}`;
}

// Fetch all songs in a selected album/folder
async function getSongs(folder) {
    let a = await fetch(`http://127.0.0.1:3000/Project%202/songs/${folder}/`);
    let response = await a.text();
    let cont = document.createElement("div");
    cont.innerHTML = response;
    let as = cont.getElementsByTagName("a");

    songs = [];
    filePath = [];
    for (let i = 0; i < as.length; i++) {
        if (as[i].innerHTML.endsWith(".mp3")) {
            songs.push(as[i].innerText);
            filePath.push(as[i].href);
        }
    }
    return songs;
}

// Play selected song
const playMusic = (track) => {
    currentSong.src = track;
    currentSong.play();
    play.src = "pause.svg"; // change play button icon to pause

    // Update the UI with the current song name
    let trackName = decodeURIComponent(track.split(`/songs/${folder}/`)[1].split(".")[0]);
    document.querySelector(".songName").innerText = trackName.replaceAll("%20", " ");
}

// Dynamically fetch and display all albums (folders with info.json)
async function dynamicAlbum() {
    let a = await fetch(`http://127.0.0.1:3000/Project%202/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");

    // Loop through all folders
    Array.from(anchors).forEach(async (e) => {
        let folder2 = e.href.split("/songs/").pop().split("/")[0];

        // Avoid invalid folders like 'http:'
        if (folder2 !== "http:") {
            // Fetch album metadata from info.json
            let res = await fetch(`http://127.0.0.1:3000/Project%202/songs/${folder2}/info.json`);
            let albumInfo = await res.json();

            // Create album card HTML
            let cardHTML = `<div class="card" data-folder="${folder2}">
                                <div class="cover-container flex">
                                    <img class="coverimg" src="http://127.0.0.1:3000/Project%202/songs/${folder2}/cover.jpg" alt="card">
                                    <div class="play flex justify-content align-items">
                                        <img class="playlogo" src="play.svg" alt="play">
                                    </div>
                                </div>
                                <div class="card-description flex">
                                    <span class="color-w">${albumInfo.title}</span>
                                    <a class="color-g" href="#">${albumInfo.description}</a>
                                </div>
                            </div>`;

            // Append card to DOM
            let cards = document.querySelector(".cards");
            cards.insertAdjacentHTML("beforeend", cardHTML);

            // Attach click event to card
            let newCard = cards.querySelector(`.card[data-folder="${folder2}"]`);
            newCard.addEventListener("click", async () => {
                folder = folder2;
                let songs = await getSongs(folder);

                // Show all songs in album
                let mainContainer = document.querySelector(".songs-list");
                mainContainer.innerText = "";
                let htmlContent = "";

                songs.forEach((song, index) => {
                    let songName = song.split(".")[0].trim();
                    htmlContent += `<div class="song-card flex align-items color-w">
                                        <div class="left-songcard-cont flex justify-content align-items">
                                            <img src="music.svg" alt="music_logo">
                                            <div class="songinfo">
                                                <ul><li>${songName}</li></ul>
                                            </div>
                                        </div>
                                        <div class="right-songcard-cont flex justify-content align-items">
                                            <div class="playnow"><span>Play now</span></div>
                                            <img src="playCircle.svg" alt="play">
                                        </div>
                                    </div>`;
                });

                mainContainer.innerHTML = htmlContent;

                // Attach click listener to each song card
                document.querySelectorAll(".song-card").forEach((e, index) => {
                    e.addEventListener("click", () => {
                        let songPath = filePath[index];
                        let fileName = encodeURIComponent(songPath.split("/").pop());
                        let fullPath = `http://127.0.0.1:3000/Project%202/songs/${folder}/${fileName}`;
                        playMusic(fullPath);
                    });
                });
            });
        }
    });
}

// Self-executing async function to start player
(async function () {
    await dynamicAlbum(); // Load albums

    // Play/Pause icon
    playicon.addEventListener("click", () => {
        if (currentSong.src == "") {
            play.src = "playS.svg";
        } else if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "playS.svg";
        }
    });

    // Initialize time
    document.querySelector(".song-time").innerText = "00:00";
    document.querySelector(".song-duration").innerText = "00:00";

    // Update seekbar and times
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".song-time").innerText = formatTime(currentSong.currentTime);
        document.querySelector(".song-duration").innerText = formatTime(currentSong.duration);
        document.querySelector(".circle").style.left = `calc(${(currentSong.currentTime / currentSong.duration) * 100}% - 6px)`;
        document.querySelector(".seekbar2").style.width = `calc(${(currentSong.currentTime / currentSong.duration) * 100}%)`;

        // When song ends
        if (currentSong.currentTime == currentSong.duration) {
            play.src = "playS.svg";
        }
    });

    // Seekbar click: jump to clicked position
    document.querySelector(".seekbar-container").addEventListener("click", (e) => {
        let seekbar = e.currentTarget;
        let rect = seekbar.getBoundingClientRect();
        let percent = ((e.clientX - rect.left) / rect.width) * 100;
        document.querySelector(".circle").style.left = `calc(${percent}% - 6px)`;
        currentSong.currentTime = (currentSong.duration * percent / 100);
    });

    // Volume range styling + setting
    const range = document.getElementById("range");

    function updateRangeBackground(element) {
        const val = parseInt(element.value);
        element.style.background = `linear-gradient(to right, #1ed760 ${val}%, #444 ${val}%)`;
    }

    range.addEventListener("input", () => {
        updateRangeBackground(range);
        currentSong.volume = parseFloat(range.value) / 100;
    });

    updateRangeBackground(range); // initial call

    // Previous song logic
    document.querySelector(".previous-icon").addEventListener("click", () => {
        let currentIndex = filePath.findIndex(file =>
            currentSong.src.includes(encodeURIComponent(file.split("/").pop()))
        );
        if (currentIndex > 0) {
            let previousFile = filePath[currentIndex - 1];
            let encodedFile = encodeURIComponent(previousFile.split("/").pop());
            let path = `http://127.0.0.1:3000/Project%202/songs/${folder}/${encodedFile}`;
            playMusic(path);
        }
    });

    // Next song logic
    document.querySelector(".next-icon").addEventListener("click", () => {
        let currentIndex = filePath.findIndex(file =>
            currentSong.src.includes(encodeURIComponent(file.split("/").pop()))
        );
        if (currentIndex < filePath.length - 1) {
            let nextFile = filePath[currentIndex + 1];
            let encodedFile = encodeURIComponent(nextFile.split("/").pop());
            let path = `http://127.0.0.1:3000/Project%202/songs/${folder}/${encodedFile}`;
            playMusic(path);
        }
    });

    // Mute/unmute button
    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.currentTarget.src.includes("volume.svg")) {
            e.currentTarget.src = "mute.svg";
            currentSong.volume = 0;
            range.value = 0;
            range.style.background = "linear-gradient(to right, #1ed760 0%, #444 0%)";
        } else {
            e.currentTarget.src = "volume.svg";
            currentSong.volume = 0.5;
            range.value = 50;
            range.style.background = "linear-gradient(to right, #1ed760 50%, #444 50%)";
        }
    });

})();