const loadingMessages = [
    "⏳ Searching...",
    "📦 กำลังตรวจสอบพัสดุ...",
    "🔍 กำลังเชื่อมต่อไปรษณีย์ไทย..."
];

const BASE_URL =
    "https://script.google.com/macros/s/AKfycbxNSGjoIZEOPGk0LSBIPkZ8B0hXa-C7roCBF0HvzELJeNoSVRP12mBSBPeGfTRgEi9jlw/exec";

// Holds the username once it has been confirmed to exist in step 1
let confirmedUsername = null;

let loadingInterval;


// ===========================
// Format Date
// ===========================

function formatDate(dateStr) {

    if (!dateStr) return "";

    return dateStr
        .replace(/\+\d{2}:?\d{2}$/, "")
        .trim();
}


// ===========================
// Loading Text
// ===========================

function startLoadingText(messages) {

    const list = messages || loadingMessages;

    let i = 0;

    document.getElementById("loadingText").textContent = list[0];

    document
        .getElementById("loading")
        .classList.remove("hidden");

    loadingInterval = setInterval(() => {

        i = (i + 1) % list.length;

        document.getElementById("loadingText").textContent =
            list[i];

    }, 1200);
}


function stopLoadingText() {

    clearInterval(loadingInterval);

    document
        .getElementById("loading")
        .classList.add("hidden");
}


// ===========================
// Clean Username
// ===========================

function cleanUsername(raw) {
    return raw
        .replaceAll("@", "")
        .trim()
        .toLowerCase();
}


// ===========================
// Step 1: Check Username
// ===========================

async function checkUsername() {

    const username = cleanUsername(
        document.getElementById("username").value
    );

    document
        .getElementById("usernameError")
        .classList.add("hidden");


    // Empty username
    if (username === "@") {

        alert("กรุณากรอก Username");

        return;
    }


    // ===========================
    // IMPORTANT:
    // Step 1 uses checkUsername
    // ===========================

    const url =
        BASE_URL
        + "?action=checkUsername"
        + "&username=" + encodeURIComponent(username)
        + "&_=" + Date.now();


    startLoadingText([
        "🔍 Checking Username..."
    ]);


    try {

        const response = await fetch(url, {
            cache: "no-store"
        });


        if (!response.ok) {

            throw new Error(
                "Server Error : " +
                response.status
            );
        }


        const data = await response.json();

        console.log("CHECK USERNAME:", data);


        stopLoadingText();


        if (data.found) {

            // Save confirmed username
            confirmedUsername = username;


            // Show username in step 2
            document
                .getElementById("confirmedUsername")
                .textContent = username;


            // Hide step 1
            document
                .getElementById("stepUsername")
                .classList.add("hidden");


            // Show step 2
            document
                .getElementById("stepPhone")
                .classList.remove("hidden");


            // Reset phone input
            document
                .getElementById("phoneLast4")
                .value = "";


            // Focus phone input
            document
                .getElementById("phoneLast4")
                .focus();

        } else {

            document
                .getElementById("usernameError")
                .classList.remove("hidden");
        }


    } catch (error) {

        stopLoadingText();

        console.error(
            "CHECK USERNAME ERROR:",
            error
        );

        alert(
            "Error connecting to server."
        );
    }
}


// ===========================
// Back to Step 1
// ===========================

function resetUsername() {

    confirmedUsername = null;


    document
        .getElementById("stepPhone")
        .classList.add("hidden");


    document
        .getElementById("usernameError")
        .classList.add("hidden");


    document
        .getElementById("result")
        .classList.add("hidden");


    document
        .getElementById("stepUsername")
        .classList.remove("hidden");


    document
        .getElementById("username")
        .focus();
}


// ===========================
// Step 2: Search Tracking
// ===========================

async function searchTracking() {

    // Make sure username was confirmed
    if (!confirmedUsername) {

        resetUsername();

        return;
    }


    // Get last 4 digits
    const phoneLast4 =
        document
            .getElementById("phoneLast4")
            .value
            .trim();


    // ===========================
    // Validate Phone
    // ===========================

    if (
        phoneLast4.length !== 4 ||
        !/^\d{4}$/.test(phoneLast4)
    ) {

        alert(
            "กรุณากรอกเบอร์โทร 4 ตัวท้าย"
        );

        return;
    }


    // ===========================
    // IMPORTANT:
    // Step 2 uses searchTracking
    // ===========================

    const url =
        BASE_URL
        + "?action=searchTracking"
        + "&username=" +
            encodeURIComponent(confirmedUsername)
        + "&phone=" +
            encodeURIComponent(phoneLast4)
        + "&_=" + Date.now();


    console.log(
        "SEARCH TRACKING URL:",
        url
    );


    // ===========================
    // Reset UI
    // ===========================

    document
        .getElementById("result")
        .classList.add("hidden");


    document
        .getElementById("timeline")
        .innerHTML = "";


    startLoadingText();


    try {

        const response = await fetch(url, {
            cache: "no-store"
        });


        if (!response.ok) {

            throw new Error(
                "Server Error : " +
                response.status
            );
        }


        const data = await response.json();


        console.log(
            "TRACKING RESPONSE:",
            data
        );


        stopLoadingText();


        // ===========================
        // Show Result
        // ===========================

        document
            .getElementById("result")
            .classList.remove("hidden");


        document
            .getElementById("result")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


        // ===========================
        // Found
        // ===========================

        if (data.found) {


            // Tracking Number
            document
                .getElementById("tracking")
                .textContent =
                    data.trackingNumber || "-";


            // Current Status
            document
                .getElementById("status")
                .textContent =
                    data.currentStatus || "-";


            // Last Update
            document
                .getElementById("update")
                .textContent =
                    "📅 " +
                    formatDate(data.currentDate) +
                    " | 📍 " +
                    (data.currentLocation || "-");


            // ===========================
            // Timeline
            // ===========================

            const timeline =
                Array.isArray(data.timeline)
                    ? data.timeline
                    : [];


            // Newest → Oldest
            const reversedTimeline =
                [...timeline].reverse();


            let timelineHTML = "";


            reversedTimeline.forEach(
                (item, index) => {

                    timelineHTML += `

<details
    class="timeline-item"
    ${index === 0 ? "open" : ""}
>

    <summary>

        <span class="timeline-status">
            ${item.status || "-"}
        </span>

        <span class="timeline-date">
            ${formatDate(item.date)}
        </span>

    </summary>


    <div class="timeline-body">

        <p>
            📍 ${item.location || "-"}
        </p>

        <small>
            ${item.detail || ""}
        </small>

    </div>

</details>

`;
                }
            );


            document
                .getElementById("timeline")
                .innerHTML =
                    timelineHTML;


        }

        // ===========================
        // Not Found
        // ===========================

        else {

            document
                .getElementById("tracking")
                .textContent = "-";


            document
                .getElementById("status")
                .textContent =
                    "❌ " +
                    (
                        data.message ||
                        "ไม่พบข้อมูล หรือข้อมูลยืนยันตัวตนไม่ถูกต้อง"
                    );


            document
                .getElementById("update")
                .textContent = "-";


            document
                .getElementById("timeline")
                .innerHTML = "";
        }


    } catch (error) {

        stopLoadingText();


        document
            .getElementById("result")
            .classList.add("hidden");


        console.error(
            "SEARCH TRACKING ERROR:",
            error
        );


        alert(
            "Error connecting to server."
        );
    }
}


// ===========================
// Enter Key - Username
// ===========================

document
    .getElementById("username")
    .addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                checkUsername();
            }
        }
    );


// ===========================
// Enter Key - Phone
// ===========================

document
    .getElementById("phoneLast4")
    .addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                searchTracking();
            }
        }
    );


// ===========================
// Copy Tracking
// ===========================

function copyTracking() {

    const tracking =
        document
            .getElementById("tracking")
            .textContent;


    // Nothing to copy
    if (
        tracking === "-" ||
        tracking === ""
    ) {

        return;
    }


    navigator.clipboard
        .writeText(tracking)
        .then(() => {

            const btn =
                document.getElementById(
                    "copyBtn"
                );


            btn.textContent =
                "✅ Copied!";


            setTimeout(() => {

                btn.textContent =
                    "📋 Copy";

            }, 1500);

        })
        .catch((error) => {

            console.error(
                "COPY ERROR:",
                error
            );

        });
}
