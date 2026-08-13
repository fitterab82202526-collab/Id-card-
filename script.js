const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbzZ_ltyfqQovQjNeF_C90rUbRRRc11rFVKBmUPtgaP5Si9_UA6cM0-O0IvamZ3eQKG8/exec";

const BASE_DATA = window.ITI_STUDENTS || [];

let students = BASE_DATA;
let selected = null;
let photoUrl = null;

const $ = id => document.getElementById(id);


/* -------------------------
   Basic helpers
------------------------- */

function clean(value) {
    return String(value ?? "").trim();
}

function searchKey(value) {
    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function escapeHtml(value) {
    return clean(value).replace(
        /[&<>"]/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;"
        }[m])
    );
}


/* -------------------------
   Start website
------------------------- */

function startWebsite() {

    renderTrades();

    renderResults();

    if (students.length) {
        selectStudent(students[0].enrolment);
    }
}


/* -------------------------
   Trade filter
------------------------- */

function renderTrades() {

    const trades = [
        ...new Set(
            students
                .map(s => clean(s.trade))
                .filter(Boolean)
        )
    ].sort();

    $("tradeFilter").innerHTML =
        '<option value="">All Trades</option>' +
        trades.map(
            trade =>
                `<option value="${escapeHtml(trade)}">${escapeHtml(trade)}</option>`
        ).join("");
}


/* -------------------------
   Search
------------------------- */

function getFilteredStudents() {

    const query =
        searchKey($("searchBox").value);

    const trade =
        $("tradeFilter").value;

    return students.filter(student => {

        const name =
            searchKey(student.name);

        const enrollment =
            searchKey(student.enrolment);

        const tradeMatch =
            !trade ||
            clean(student.trade) === trade;

        const searchMatch =
            !query ||
            name.includes(query) ||
            enrollment.includes(query);

        return searchMatch && tradeMatch;
    });
}


function renderResults() {

    const list =
        getFilteredStudents();

    const results =
        $("results");

    results.innerHTML = "";

    list.slice(0, 100).forEach(student => {

        const item =
            document.createElement("div");

        item.className =
            "result" +
            (
                selected &&
                selected.enrolment === student.enrolment
                    ? " active"
                    : ""
            );

        item.innerHTML = `
            <div>
                <div class="result-name">
                    ${escapeHtml(student.name)}
                </div>

                <div class="result-meta">
                    ${escapeHtml(student.enrolment)}
                    ·
                    ${escapeHtml(student.trade)}
                    ·
                    ${escapeHtml(student.batch)}
                </div>
            </div>

            <strong>SELECT</strong>
        `;

        item.onclick = () =>
            selectStudent(student.enrolment);

        results.appendChild(item);
    });

    $("resultInfo").textContent =
        list.length +
        " matching student(s).";
}


/* -------------------------
   Select student
------------------------- */

async function selectStudent(enrollment) {

    selected =
        students.find(
            student =>
                String(student.enrolment) ===
                String(enrollment)
        );

    if (!selected) return;

    setText(
        "sName",
        selected.name
    );

    setText(
        "sEnrol",
        selected.enrolment
    );

    setText(
        "sTrade",
        selected.trade
    );

    setText(
        "sBatch",
        `${selected.batch} / ${selected.session}`
    );

    setText(
        "cName",
        selected.name
    );

    setText(
        "cEnrol",
        selected.enrolment
    );

    setText(
        "cTrade",
        selected.trade
    );

    setText(
        "cBatch",
        `${selected.batch} / ${selected.session}`
    );

    setText(
        "cDob",
        selected.dob
    );

    setText(
        "cAddress",
        selected.address
    );

    $("photoInput").disabled = false;
    $("generateBtn").disabled = false;
    $("printBtn").disabled = false;
    $("pdfBtn").disabled = false;

    renderResults();

    await loadPhotoFromGoogleDrive(
        selected.enrolment
    );
}


/* -------------------------
   Set text
------------------------- */

function setText(id, value) {

    $(id).textContent =
        clean(value) || "—";
}


/* -------------------------
   Get photo from Google Drive
------------------------- */

function loadPhotoFromGoogleDrive(
    enrollment
) {

    return new Promise(resolve => {

        const callback =
            "photoCallback_" +
            Date.now();

        window[callback] =
            function(result) {

                try {

                    delete window[callback];

                    if (
                        result &&
                        result.success &&
                        result.data
                    ) {

                        displayPhoto(
                            result.data
                        );

                    } else {

                        displayNoPhoto();

                    }

                } catch (error) {

                    displayNoPhoto();

                }

                resolve();
            };

        const script =
            document.createElement("script");

        const url =
            GOOGLE_SCRIPT_URL +
            "?action=getPhoto" +
            "&enrollment=" +
            encodeURIComponent(enrollment) +
            "&callback=" +
            callback;

        script.src = url;

        script.onerror = function() {

            delete window[callback];

            displayNoPhoto();

            resolve();
        };

        document.body.appendChild(script);

        setTimeout(() => {

            if (window[callback]) {

                delete window[callback];

                displayNoPhoto();

                resolve();
            }

            script.remove();

        }, 15000);
    });
}


/* -------------------------
   Display photo
------------------------- */

function displayPhoto(data) {

    const box =
        $("cardPhoto");

    if (photoUrl) {

        URL.revokeObjectURL(
            photoUrl
        );

        photoUrl = null;
    }

    box.innerHTML = "";

    const img =
        document.createElement("img");

    img.src = data;

    box.appendChild(img);

    $("photoStatus").textContent =
        "Photo saved";

    $("photoStatus").className =
        "status done";
}


function displayNoPhoto() {

    const box =
        $("cardPhoto");

    box.innerHTML =
        "PHOTO";

    $("photoStatus").textContent =
        "Photo pending";

    $("photoStatus").className =
        "status pending";
}


/* -------------------------
   Upload photo
------------------------- */

$("photoInput").addEventListener(
    "change",
    async function(event) {

        if (
            !selected ||
            !event.target.files[0]
        ) {
            return;
        }

        const file =
            event.target.files[0];

        if (!file.type.startsWith("image/")) {

            showToast(
                "Please select an image."
            );

            return;
        }

        try {

            showToast(
                "Preparing photo..."
            );

            const resized =
                await resizePhoto(
                    file,
                    900,
                    900
                );

            const base64 =
                await fileToBase64(
                    resized
                );

            const payload = {

                enrollment:
                    selected.enrolment,

                photo:
                    base64
            };

            /*
             * no-cors is used because Apps Script
             * handles the browser cross-origin request.
             */

            await fetch(
                GOOGLE_SCRIPT_URL,
                {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },
                    body:
                        JSON.stringify(payload)
                }
            );

            displayPhoto(
                base64
            );

            showToast(
                "Photo uploaded to Google Drive."
            );

        } catch (error) {

            console.error(error);

            showToast(
                "Photo upload failed."
            );
        }

        event.target.value = "";
    }
);


/* -------------------------
   Resize photo
------------------------- */

function resizePhoto(
    file,
    maxWidth,
    maxHeight
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    const img =
                        new Image();

                    img.onload =
                        function() {

                            let width =
                                img.width;

                            let height =
                                img.height;

                            const ratio =
                                Math.min(
                                    maxWidth / width,
                                    maxHeight / height,
                                    1
                                );

                            width =
                                Math.round(
                                    width * ratio
                                );

                            height =
                                Math.round(
                                    height * ratio
                                );

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;

                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );

                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );

                            canvas.toBlob(
                                blob => {

                                    if (blob)
                                        resolve(blob);
                                    else
                                        reject(
                                            new Error(
                                                "Resize failed"
                                            )
                                        );

                                },
                                "image/jpeg",
                                0.88
                            );
                        };

                    img.onerror =
                        reject;

                    img.src =
                        event.target.result;
                };

            reader.onerror =
                reject;

            reader.readAsDataURL(file);
        }
    );
}


/* -------------------------
   File to Base64
------------------------- */

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () =>
                    resolve(
                        reader.result
                    );

            reader.onerror =
                reject;

            reader.readAsDataURL(file);
        }
    );
}


/* -------------------------
   Generate
------------------------- */

$("generateBtn").onclick =
    async function() {

        if (!selected) return;

        await loadPhotoFromGoogleDrive(
            selected.enrolment
        );

        $("idCard").scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        showToast(
            "ID card generated."
        );
    };


/* -------------------------
   Print
------------------------- */

$("printBtn").onclick =
    function() {

        if (!selected) return;

        window.print();
    };


/* -------------------------
   PDF
------------------------- */

$("pdfBtn").onclick =
    function() {

        if (!selected) return;

        const card =
            $("idCard").outerHTML;

        const win =
            window.open(
                "",
                "_blank"
            );

        if (!win) {

            showToast(
                "Allow pop-ups first."
            );

            return;
        }

        win.document.write(`
            <!doctype html>
            <html>
            <head>
                <title>
                    ITI ID Card
                </title>

                <style>
                    body{
                        margin:20px;
                        font-family:Arial;
                    }

                    ${document.querySelector("style")
                        ? document.querySelector("style").textContent
                        : ""}

                    .id-card{
                        box-shadow:none!important;
                        margin:auto;
                    }
                </style>
            </head>

            <body>

                ${card}

                <script>
                    window.onload=function(){
                        window.print();
                    };
                <\/script>

            </body>
            </html>
        `);

        win.document.close();
    };


/* -------------------------
   Search
------------------------- */

$("searchBox").addEventListener(
    "input",
    renderResults
);

$("tradeFilter").addEventListener(
    "change",
    renderResults
);


/* -------------------------
   Toast
------------------------- */

function showToast(message) {

    const toast =
        $("toast");

    toast.textContent =
        message;

    toast.style.display =
        "block";

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(
            () => {
                toast.style.display =
                    "none";
            },
            3500
        );
}


/* -------------------------
   Start
------------------------- */

startWebsite();