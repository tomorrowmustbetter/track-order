const loadingMessages = [
    "Searching...",
    "Checking shipment data...",
    "Connecting to tracking service..."
];

const BASE_URL =
    "https://script.google.com/macros/s/AKfycbxNSGjoIZEOPGk0LSBIPkZ8B0hXa-C7roCBF0HvzELJeNoSVRP12mBSBPeGfTRgEi9jlw/exec";

let confirmedUsername = null;
let loadingInterval;


/* ===========================
   Format Date
=========================== */

function formatDate(dateStr) {

    if (!dateStr) {
        return "";
    }

    return dateStr
        .replace(/\+\d{2}:?\d{2}$/, "")
        .trim();
}


/* ===========================
   Loading
=========================== */

function startLoadingText(messages) {

    const list = messages || loadingMessages;

    let i = 0;

    const loadingText =
        document.getElementById("loadingText");

    const loading =
        document.getElementById("loading");

    loadingText.textContent = list[0];

    loading.classList.remove("hidden");

    clearInterval(loadingInterval);

    loadingInterval = setInterval(() => {

        i = (i + 1) % list.length;

        loadingText.textContent = list[i];

    }, 1200);
}


function stopLoadingText() {

    clearInterval(loadingInterval);

    document
        .getElementById("loading")
        .classList.add("hidden");
}


/* ===========================
   Clean Username
=========================== */

function cleanUsername(raw) {

    return raw
        .replaceAll("@", "")
        .trim()
        .toLowerCase();
}


/* ===========================
   Warning Popup
=========================== */

function showWarning(title, message) {

    document.getElementById("popupTitle").textContent =
        title;

    document.getElementById("popupMessage").textContent =
        message;

    document
        .getElementById("warningPopup")
        .classList.remove("hidden");
}


function closeWarning() {

    document
        .getElementById("warningPopup")
        .classList.add("hidden");
}


/* ===========================
   Step 1
   Check Username
=========================== */

async function checkUsername() {

    const username = cleanUsername(
        document.getElementById("username").value
    );


    if (!username) {

        showWarning(
            "Account Required",
            "Please enter your Twitter / X username."
        );

        return;
    }


    const url =
        BASE_URL +
        "?action=checkUsername" +
        "&username=" +
        encodeURIComponent(username) +
        "&_=" +
        Date.now();


    startLoadingText([
        "Checking account..."
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


        console.log(
            "CHECK USERNAME:",
            data
        );


        stopLoadingText();


        /* ===========================
           Account Found
        =========================== */

        if (data.found) {

            confirmedUsername = username;


            document
                .getElementById("stepUsername")
                .classList.add("hidden");


            document
                .getElementById("stepPhone")
                .classList.remove("hidden");


            /* Progress */

            document
                .getElementById("progressAccount")
                .classList.remove("active");

            document
                .getElementById("progressAccount")
                .classList.add("completed");


            document
                .getElementById("progressVerify")
                .classList.add("active");


            /* Reset phone */

            document
                .getElementById("phoneLast4")
                .value = "";


            document
                .getElementById("phoneLast4")
                .focus();

        }


        /* ===========================
           Account Not Found
        =========================== */

        else {

            showWarning(
                "Account Not Found",
                "We couldn't find this account. Please check your username and try again."
            );
        }

    }


    catch (error) {

        stopLoadingText();


        console.error(
            "CHECK USERNAME ERROR:",
            error
        );


        showWarning(
            "Connection Error",
            "Unable to connect to the tracking service. Please try again."
        );
    }
}


/* ===========================
   Step 2
   Search Tracking
=========================== */

async function searchTracking() {

    /* Make sure username passed Step 1 */

    if (!confirmedUsername) {

        resetUsername();

        return;
    }


    const phoneLast4 =
        document
            .getElementById("phoneLast4")
            .value
            .trim();


    /* ===========================
       Validate Phone
    =========================== */

    if (!/^\d{4}$/.test(phoneLast4)) {

        showWarning(
            "Invalid Phone Number",
            "Please enter the last 4 digits of the phone number."
        );

        return;
    }


    const url =
        BASE_URL +
        "?action=searchTracking" +
        "&username=" +
        encodeURIComponent(confirmedUsername) +
        "&phone=" +
        encodeURIComponent(phoneLast4) +
        "&_=" +
        Date.now();


    console.log(
        "SEARCH TRACKING URL:",
        url
    );


    /* Reset previous result */

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


        /* ===========================
           Order Not Found
        =========================== */

        if (!data.found) {

            showWarning(
                "Order Not Found",
                data.message ||
                "The information doesn't match any order."
            );

            return;
        }


        /* ===========================
           Order Found
        =========================== */

        document
            .getElementById("stepPhone")
            .classList.add("hidden");


        document
            .getElementById("result")
            .classList.remove("hidden");


        /* Progress */

        document
            .getElementById("progressVerify")
            .classList.remove("active");

        document
            .getElementById("progressVerify")
            .classList.add("completed");


        document
            .getElementById("progressTracking")
            .classList.add("active");


        /* ===========================
           Tracking Number
        =========================== */

        document
            .getElementById("tracking")
            .textContent =
                data.trackingNumber || "-";


        /* ===========================
           Current Status
        =========================== */

        document
            .getElementById("status")
            .textContent =
                data.currentStatus || "-";


        /* ===========================
           Last Update
        =========================== */

        const updateText =
            formatDate(data.currentDate);

        const locationText =
            data.currentLocation || "-";


        document
            .getElementById("update")
            .textContent =
                `${updateText} · ${locationText}`;


        /* ===========================
           Timeline
        =========================== */

        const timeline =
            Array.isArray(data.timeline)
                ? data.timeline
                : [];


        /* Newest → Oldest */

        const reversedTimeline =
            [...timeline].reverse();


        let timelineHTML = "";


        reversedTimeline.forEach(
            (item) => {

                timelineHTML += `
                    <div class="timeline-item">

                        <div class="timeline-dot"></div>

                        <div class="timeline-content">

                            <p class="timeline-status">
                                ${item.status || "-"}
                            </p>

                            <p class="timeline-date">
                                ${formatDate(item.date)}
                            </p>

                            <p class="timeline-body">
                                ${item.location || "-"}
                                ${
                                    item.detail
                                        ? ` · ${item.detail}`
                                        : ""
                                }
                            </p>

                        </div>

                    </div>
                `;
            }
        );


        document
            .getElementById("timeline")
            .innerHTML =
                timelineHTML;


        /* Scroll to result */

        document
            .getElementById("result")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }


    catch (error) {

        stopLoadingText();


        document
            .getElementById("result")
            .classList.add("hidden");


        console.error(
            "SEARCH TRACKING ERROR:",
            error
        );


        showWarning(
            "Connection Error",
            "Unable to connect to the tracking service. Please try again."
        );
    }
}


/* ===========================
   Reset
=========================== */

function resetUsername() {

    confirmedUsername = null;


    document
        .getElementById("stepPhone")
        .classList.add("hidden");


    document
        .getElementById("result")
        .classList.add("hidden");


    document
        .getElementById("stepUsername")
        .classList.remove("hidden");


    /* Reset Progress */

    document
        .getElementById("progressAccount")
        .classList.remove("completed");

    document
        .getElementById("progressAccount")
        .classList.add("active");


    document
        .getElementById("progressVerify")
        .classList.remove(
            "active",
            "completed"
        );


    document
        .getElementById("progressTracking")
        .classList.remove(
            "active",
            "completed"
        );


    document
        .getElementById("username")
        .focus();
}


/* ===========================
   Enter Key
=========================== */

document
    .getElementById("username")
    .addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                checkUsername();
            }
        }
    );


document
    .getElementById("phoneLast4")
    .addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchTracking();
            }
        }
    );


/* ===========================
   Copy Tracking
=========================== */

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


    navigator.clipboard
        .writeText(tracking)
        .then(() => {

            const btn =
                document.getElementById("copyBtn");


            btn.textContent = "Copied";


            setTimeout(() => {

                btn.textContent = "Copy";

            }, 1500);

        })


        .catch((error) => {

            console.error(
                "COPY ERROR:",
                error
            );

        });
}