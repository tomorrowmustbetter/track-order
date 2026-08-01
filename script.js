const loadingMessages = [
    "⏳ Searching...",
    "📦 กำลังตรวจสอบพัสดุ...",
    "🔍 กำลังเชื่อมต่อไปรษณีย์ไทย..."
];

// ===========================
// Format Date
// ===========================
function formatDate(dateStr) {

    if (!dateStr) return "";

    return dateStr.replace(/\+\d{2}:?\d{2}$/, "").trim();

}

let loadingInterval;


// ===========================
// Loading Text
// ===========================
function startLoadingText() {

    let i = 0;

    document.getElementById("loadingText").textContent =
        loadingMessages[0];

    loadingInterval = setInterval(() => {

        i = (i + 1) % loadingMessages.length;

        document.getElementById("loadingText").textContent =
            loadingMessages[i];

    }, 1200);

}


function stopLoadingText() {

    clearInterval(loadingInterval);

}



// ===========================
// Search Tracking
// ===========================
async function searchTracking() {

    const username =
        "@" +
        document
        .getElementById("username")
        .value
        .replaceAll("@", "")
        .trim()
        .toLowerCase();


    const phoneLast4 =
        document
        .getElementById("phoneLast4")
        .value
        .trim();


    // Validate
    if (
        username === "@" ||
        phoneLast4.length !== 4 ||
        !/^\d{4}$/.test(phoneLast4)
    ) {

        alert("กรุณากรอก Username และเบอร์โทร 4 ตัวท้าย");

        return;

    }


    const url =
        "https://script.google.com/macros/s/AKfycbyPH8NW48mq56CFFR9ubeivwZIb5SJxxcvO9T05bW3udzeONgPwPhL3P00lVix3Hh5j7g/exec"
        + "?username=" + encodeURIComponent(username)
        + "&phone=" + encodeURIComponent(phoneLast4)
        + "&_=" + Date.now();



    // Reset UI
    document.getElementById("result").classList.add("hidden");
    document.getElementById("timeline").innerHTML = "";

    document.getElementById("loading").classList.remove("hidden");

    startLoadingText();


    try {

        const response = await fetch(url, {

            cache: "no-store"

        });


        if (!response.ok) {

            throw new Error("Server Error : " + response.status);

        }


        const data = await response.json();

        console.log(data);


        stopLoadingText();

        document
            .getElementById("loading")
            .classList.add("hidden");

        document
            .getElementById("result")
            .classList.remove("hidden");


        document
            .getElementById("result")
            .scrollIntoView({

                behavior: "smooth",
                block: "start"

            });



        if (data.found) {


            // Tracking Number

            document
                .getElementById("tracking")
                .textContent =
                data.trackingNumber;



            // Status

            document
                .getElementById("status")
                .textContent =
                data.currentStatus;



            // Update

            document
                .getElementById("update")
                .textContent =
                "📅 "
                + formatDate(data.currentDate)
                + " | 📍 "
                + data.currentLocation;



            // Timeline

            const reversedTimeline =
                [...data.timeline].reverse();


            let timelineHTML = "";


            reversedTimeline.forEach((item, index) => {

                timelineHTML += `

<details class="timeline-item" ${index === 0 ? "open" : ""}>

    <summary>

        <span class="timeline-status">
            ${item.status}
        </span>

        <span class="timeline-date">
            ${formatDate(item.date)}
        </span>

    </summary>

    <div class="timeline-body">

        <p>📍 ${item.location}</p>

        <small>
            ${item.detail}
        </small>

    </div>

</details>

`;

            });


            document
                .getElementById("timeline")
                .innerHTML =
                timelineHTML;


        } else {


            document
                .getElementById("tracking")
                .textContent = "-";


            document
                .getElementById("status")
                .textContent =
                "❌ ไม่พบข้อมูล หรือข้อมูลยืนยันตัวตนไม่ถูกต้อง";


            document
                .getElementById("update")
                .textContent = "-";


            document
                .getElementById("timeline")
                .innerHTML = "";

        }

    }

    catch (error) {

        stopLoadingText();

        document
            .getElementById("loading")
            .classList.add("hidden");

        document
            .getElementById("result")
            .classList.add("hidden");

        console.error(error);

        alert("Error connecting to server.");

    }

}



// ===========================
// Enter Key
// ===========================
document
    .getElementById("username")
    .addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            searchTracking();

        }

    });


document
    .getElementById("phoneLast4")
    .addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            searchTracking();

        }

    });



// ===========================
// Copy Tracking
// ===========================
function copyTracking() {

    const tracking =
        document
        .getElementById("tracking")
        .textContent;


    if (
        tracking === "-" ||
        tracking === ""
    ) {

        return;

    }


    navigator.clipboard.writeText(tracking);


    const btn =
        document
        .getElementById("copyBtn");


    btn.textContent = "✅ Copied!";


    setTimeout(() => {

        btn.textContent = "📋 Copy";

    }, 1500);

}