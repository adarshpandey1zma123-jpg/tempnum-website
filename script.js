/* ============================================
   TempNum — OTP Send/Receive Logic
   ============================================ */

// ===== PHONE NUMBER DATABASE =====
const phoneData = {
    us: {
        country: "United States", code: "+1", flag: "🇺🇸",
        numbers: [
            { number: "+1 (202) 555-0147" },
            { number: "+1 (415) 555-0198" },
            { number: "+1 (312) 555-0263" },
            { number: "+1 (713) 555-0321" },
        ]
    },
    uk: {
        country: "United Kingdom", code: "+44", flag: "🇬🇧",
        numbers: [
            { number: "+44 7700 900123" },
            { number: "+44 7700 900456" },
            { number: "+44 7700 900789" },
        ]
    },
    in: {
        country: "India", code: "+91", flag: "🇮🇳",
        numbers: [
            { number: "+91 98765 43210" },
            { number: "+91 87654 32109" },
            { number: "+91 76543 21098" },
            { number: "+91 65432 10987" },
            { number: "+91 99887 76655" },
        ]
    },
    ca: {
        country: "Canada", code: "+1", flag: "🇨🇦",
        numbers: [
            { number: "+1 (604) 555-0134" },
            { number: "+1 (416) 555-0267" },
            { number: "+1 (514) 555-0398" },
        ]
    },
    de: {
        country: "Germany", code: "+49", flag: "🇩🇪",
        numbers: [
            { number: "+49 151 12345678" },
            { number: "+49 152 23456789" },
            { number: "+49 160 34567890" },
        ]
    },
    fr: {
        country: "France", code: "+33", flag: "🇫🇷",
        numbers: [
            { number: "+33 6 12 34 56 78" },
            { number: "+33 6 23 45 67 89" },
            { number: "+33 7 34 56 78 90" },
        ]
    },
    au: {
        country: "Australia", code: "+61", flag: "🇦🇺",
        numbers: [
            { number: "+61 412 345 678" },
            { number: "+61 423 456 789" },
        ]
    },
    br: {
        country: "Brazil", code: "+55", flag: "🇧🇷",
        numbers: [
            { number: "+55 11 91234-5678" },
            { number: "+55 21 92345-6789" },
            { number: "+55 31 93456-7890" },
        ]
    },
    jp: {
        country: "Japan", code: "+81", flag: "🇯🇵",
        numbers: [
            { number: "+81 90-1234-5678" },
            { number: "+81 80-2345-6789" },
        ]
    },
    ru: {
        country: "Russia", code: "+7", flag: "🇷🇺",
        numbers: [
            { number: "+7 912 345-67-89" },
            { number: "+7 926 456-78-90" },
            { number: "+7 903 567-89-01" },
        ]
    },
    nl: {
        country: "Netherlands", code: "+31", flag: "🇳🇱",
        numbers: [
            { number: "+31 6 12345678" },
            { number: "+31 6 23456789" },
        ]
    },
    se: {
        country: "Sweden", code: "+46", flag: "🇸🇪",
        numbers: [
            { number: "+46 70 123 45 67" },
            { number: "+46 73 234 56 78" },
        ]
    }
};

// ===== MESSAGE STORAGE (per number) =====
// Maps number string -> array of message objects
const messageStore = {};

// Get all numbers as flat array
function getAllNumbers() {
    const list = [];
    Object.keys(phoneData).forEach(key => {
        const d = phoneData[key];
        d.numbers.forEach(n => {
            list.push({ ...n, country: d.country, code: d.code, flag: d.flag, countryKey: key });
        });
    });
    return list;
}

// ===== DOM ELEMENTS =====
const numbersGrid = document.getElementById("numbersGrid");
const countryFilter = document.getElementById("countryFilter");
const smsModal = document.getElementById("smsModal");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalBody = document.getElementById("modalBody");
const modalMsgCount = document.getElementById("modalMsgCount");
const modalRefresh = document.getElementById("modalRefresh");
const modalSendOtp = document.getElementById("modalSendOtp");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const toastIcon = document.getElementById("toastIcon");
const navbar = document.getElementById("navbar");
const mobileToggle = document.getElementById("mobileToggle");
const navLinks = document.getElementById("navLinks");

// OTP sender elements
const otpTargetNumber = document.getElementById("otpTargetNumber");
const otpSenderName = document.getElementById("otpSenderName");
const otpCustomSender = document.getElementById("otpCustomSender");
const otpCode = document.getElementById("otpCode");
const otpRandomBtn = document.getElementById("otpRandomBtn");
const otpMessage = document.getElementById("otpMessage");
const otpCustomMessage = document.getElementById("otpCustomMessage");
const otpSendBtn = document.getElementById("otpSendBtn");
const otpPreviewSender = document.getElementById("otpPreviewSender");
const otpPreviewBody = document.getElementById("otpPreviewBody");

// OTP success modal
const otpSuccessModal = document.getElementById("otpSuccessModal");
const otpSuccessDetails = document.getElementById("otpSuccessDetails");
const otpSuccessCode = document.getElementById("otpSuccessCode");
const otpSuccessViewInbox = document.getElementById("otpSuccessViewInbox");
const otpSuccessClose = document.getElementById("otpSuccessClose");

let currentFilter = "all";
let currentModalNumber = null;
let lastSentNumber = null;

// ===== POPULATE TARGET NUMBER DROPDOWN =====
function populateTargetDropdown() {
    otpTargetNumber.innerHTML = "";
    const all = getAllNumbers();
    all.forEach(n => {
        const opt = document.createElement("option");
        opt.value = n.number;
        opt.textContent = `${n.flag} ${n.number}`;
        otpTargetNumber.appendChild(opt);
    });
}

// ===== RENDER NUMBER CARDS =====
function renderNumbers(filter = "all") {
    numbersGrid.innerHTML = "";
    let delay = 0;
    const countries = filter === "all" ? Object.keys(phoneData) : [filter];

    countries.forEach(countryKey => {
        const data = phoneData[countryKey];
        if (!data) return;

        data.numbers.forEach(num => {
            const msgs = messageStore[num.number] || [];
            const hasOtp = msgs.length > 0;

            const card = document.createElement("div");
            card.className = `number-card${hasOtp ? " has-otp" : ""}`;
            card.style.animationDelay = `${delay * 0.04}s`;

            const otpBadge = hasOtp
                ? `<span class="number-otp-badge"><i class="fas fa-envelope"></i> ${msgs.length} OTP</span>`
                : `<div class="number-status"><span class="number-status-dot"></span>Online</div>`;

            card.innerHTML = `
                <div class="number-card-header">
                    <div class="number-country">
                        <span class="number-country-flag">${data.flag}</span>
                        <div class="number-country-info">
                            <span class="number-country-name">${data.country}</span>
                            <span class="number-country-code">${data.code}</span>
                        </div>
                    </div>
                    ${otpBadge}
                </div>
                <div class="number-display">${num.number}</div>
                <div class="number-actions">
                    <button class="btn btn-primary btn-sm copy-btn" data-number="${num.number}">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn ${hasOtp ? "btn-accent" : "btn-glass"} btn-sm inbox-btn" 
                            data-number="${num.number}" 
                            data-country="${data.country}" 
                            data-flag="${data.flag}">
                        <i class="fas fa-envelope${hasOtp ? "-open" : ""}"></i> 
                        ${hasOtp ? `Inbox (${msgs.length})` : "View Inbox"}
                    </button>
                </div>
            `;

            numbersGrid.appendChild(card);
            delay++;
        });
    });

    // Attach events
    document.querySelectorAll(".copy-btn").forEach(btn => {
        btn.addEventListener("click", () => copyNumber(btn.dataset.number));
    });
    document.querySelectorAll(".inbox-btn").forEach(btn => {
        btn.addEventListener("click", () => openInbox(btn.dataset.number, btn.dataset.country, btn.dataset.flag));
    });
}

// ===== COPY NUMBER =====
function copyNumber(number) {
    const raw = number.replace(/[\s\-()]/g, "");
    navigator.clipboard.writeText(raw).then(() => {
        showToast(`Copied ${number}`, "fa-check-circle");
    }).catch(() => {
        const input = document.createElement("input");
        input.value = raw;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        showToast(`Copied ${number}`, "fa-check-circle");
    });
}

// ===== TOAST =====
function showToast(message, icon = "fa-check-circle") {
    toastMessage.textContent = message;
    toastIcon.className = `fas ${icon}`;
    toast.classList.add("active");
    setTimeout(() => toast.classList.remove("active"), 2500);
}

// ===== SMS INBOX MODAL =====
function openInbox(number, country, flag) {
    currentModalNumber = number;
    modalTitle.textContent = `${flag} ${country}`;
    modalSubtitle.textContent = number;
    renderInboxMessages(number);
    smsModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function renderInboxMessages(number) {
    const msgs = messageStore[number] || [];
    modalMsgCount.textContent = `${msgs.length} message${msgs.length !== 1 ? "s" : ""}`;

    if (msgs.length === 0) {
        modalBody.innerHTML = `
            <div class="sms-empty">
                <i class="fas fa-inbox"></i>
                <p>No messages yet.<br>Use the "Send OTP" section above to send an OTP to this number.</p>
            </div>
        `;
        return;
    }

    modalBody.innerHTML = msgs.map((msg, i) => {
        // Highlight the OTP code in the message body
        const bodyHtml = highlightOTP(msg.body, msg.otp);
        return `
            <div class="sms-message sms-otp-highlight" style="animation-delay: ${i * 0.05}s">
                <div class="sms-header">
                    <span class="sms-sender">${msg.sender}${msg.isNew ? '<span class="sms-new-badge">NEW</span>' : ''}</span>
                    <span class="sms-time">${msg.time}</span>
                </div>
                <div class="sms-body">${bodyHtml}</div>
            </div>
        `;
    }).join("");

    // Make OTP codes clickable to copy
    document.querySelectorAll(".sms-otp-code").forEach(el => {
        el.addEventListener("click", () => {
            copyNumber(el.dataset.otp);
            showToast(`OTP ${el.dataset.otp} copied!`, "fa-key");
        });
        el.title = "Click to copy OTP";
    });

    // Mark messages as not new after viewing
    msgs.forEach(m => m.isNew = false);
}

function highlightOTP(body, otp) {
    if (!otp) return body;
    return body.replace(otp, `<span class="sms-otp-code" data-otp="${otp}">${otp}</span>`);
}

function closeInbox() {
    smsModal.classList.remove("active");
    document.body.style.overflow = "";
    currentModalNumber = null;
}

// ============================================
//  SEND OTP LOGIC (The Main Feature)
// ============================================

function getOTPCode() {
    return otpCode.value.trim() || generateRandomOTP();
}

function generateRandomOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSenderName() {
    if (otpSenderName.value === "Custom") {
        return otpCustomSender.value.trim() || "Unknown";
    }
    return otpSenderName.value;
}

function getMessageBody(otp) {
    if (otpMessage.value === "custom") {
        const custom = otpCustomMessage.value.trim();
        if (custom) return custom.replace(/\{OTP\}/gi, otp);
        return `Your verification code is: ${otp}`;
    }
    return otpMessage.value.replace(/\{OTP\}/gi, otp);
}

function sendOTP() {
    const targetNumber = otpTargetNumber.value;
    const otp = getOTPCode();
    const sender = getSenderName();
    const body = getMessageBody(otp);

    if (!targetNumber) {
        showToast("Select a target number!", "fa-exclamation-circle");
        return;
    }

    if (!otp || otp.length < 4) {
        showToast("Enter a valid OTP code (min 4 digits)", "fa-exclamation-circle");
        return;
    }

    // Store the message
    if (!messageStore[targetNumber]) {
        messageStore[targetNumber] = [];
    }

    const now = new Date();
    messageStore[targetNumber].unshift({
        sender: sender,
        body: body,
        otp: otp,
        time: "Just now",
        date: now,
        isNew: true
    });

    lastSentNumber = targetNumber;

    // Show sending animation
    otpSendBtn.disabled = true;
    otpSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // Simulate network delay (1.5 seconds)
    setTimeout(() => {
        otpSendBtn.disabled = false;
        otpSendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP Now';

        // Update the number cards to show OTP badge
        renderNumbers(currentFilter);

        // Find which country this number belongs to for the success message
        const numInfo = getAllNumbers().find(n => n.number === targetNumber);
        const countryLabel = numInfo ? `${numInfo.flag} ${numInfo.country}` : "";

        // Show success modal
        otpSuccessDetails.textContent = `Sent to ${targetNumber} (${countryLabel})`;
        otpSuccessCode.textContent = otp;
        otpSuccessModal.classList.add("active");

    }, 1500);
}

// ===== OTP FORM - Live Preview =====
function updatePreview() {
    const otp = otpCode.value.trim() || "------";
    const sender = getSenderName();

    let body;
    if (otpMessage.value === "custom") {
        const custom = otpCustomMessage.value.trim() || "Your verification code is: {OTP}.";
        body = custom.replace(/\{OTP\}/gi, `<strong>${otp}</strong>`);
    } else {
        body = otpMessage.value.replace(/\{OTP\}/gi, `<strong>${otp}</strong>`);
    }

    otpPreviewSender.textContent = sender;
    otpPreviewBody.innerHTML = body;
}

// Listen to form changes for live preview
otpCode.addEventListener("input", updatePreview);
otpSenderName.addEventListener("change", () => {
    if (otpSenderName.value === "Custom") {
        otpCustomSender.classList.add("visible");
        otpCustomSender.focus();
    } else {
        otpCustomSender.classList.remove("visible");
    }
    updatePreview();
});
otpCustomSender.addEventListener("input", updatePreview);
otpMessage.addEventListener("change", () => {
    if (otpMessage.value === "custom") {
        otpCustomMessage.classList.add("visible");
        otpCustomMessage.focus();
    } else {
        otpCustomMessage.classList.remove("visible");
    }
    updatePreview();
});
otpCustomMessage.addEventListener("input", updatePreview);

// Random OTP button
otpRandomBtn.addEventListener("click", () => {
    otpCode.value = generateRandomOTP();
    updatePreview();
});

// Send button
otpSendBtn.addEventListener("click", sendOTP);

// ===== SUCCESS MODAL =====
otpSuccessClose.addEventListener("click", () => {
    otpSuccessModal.classList.remove("active");
});

otpSuccessViewInbox.addEventListener("click", () => {
    otpSuccessModal.classList.remove("active");
    if (lastSentNumber) {
        const info = getAllNumbers().find(n => n.number === lastSentNumber);
        if (info) {
            openInbox(lastSentNumber, info.country, info.flag);
        }
    }
});

otpSuccessModal.addEventListener("click", (e) => {
    if (e.target === otpSuccessModal) {
        otpSuccessModal.classList.remove("active");
    }
});

// ===== INBOX MODAL EVENTS =====
modalClose.addEventListener("click", closeInbox);
smsModal.addEventListener("click", (e) => {
    if (e.target === smsModal) closeInbox();
});
modalRefresh.addEventListener("click", () => {
    if (currentModalNumber) renderInboxMessages(currentModalNumber);
});
modalSendOtp.addEventListener("click", () => {
    if (currentModalNumber) {
        // Pre-fill the OTP sender with this number and scroll to it
        otpTargetNumber.value = currentModalNumber;
        closeInbox();
        document.getElementById("send-otp").scrollIntoView({ behavior: "smooth" });
        otpCode.focus();
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (otpSuccessModal.classList.contains("active")) {
            otpSuccessModal.classList.remove("active");
        } else if (smsModal.classList.contains("active")) {
            closeInbox();
        }
    }
});

// ===== COUNTRY FILTER =====
countryFilter.addEventListener("click", (e) => {
    const btn = e.target.closest(".country-btn");
    if (!btn) return;
    document.querySelectorAll(".country-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.country;
    renderNumbers(currentFilter);
});

// ===== NAVBAR =====
window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
});

mobileToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

navLinks.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});

// ===== FAQ =====
document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
        const item = btn.parentElement;
        const answer = item.querySelector(".faq-answer");
        const isActive = item.classList.contains("active");

        document.querySelectorAll(".faq-item").forEach(faq => {
            faq.classList.remove("active");
            faq.querySelector(".faq-answer").style.maxHeight = null;
        });

        if (!isActive) {
            item.classList.add("active");
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    populateTargetDropdown();
    renderNumbers("all");
    updatePreview();

    // Auto-generate a random OTP on load
    otpCode.value = generateRandomOTP();
    updatePreview();
});
