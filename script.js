/**
 * ============================================
 * SISTEM PENJEJAK HUTANG KELUARGA
 * Frontend JavaScript v3 - Fixed screen switching
 * ============================================
 */

// ============================================
// API URL
// ============================================
const API_URL = "https://script.google.com/macros/s/AKfycbxyb2cC_KRWBtvI4jOCA3Y74nBxNT-azwG-9Yw88vkbj267e1JUglI0kckXvFM7GI5s/exec";

// ============================================
// KONFIGURASI LOGIN
// ============================================
const USERS = {
    "qis12345": {
        name: "Qistina Hanan",
        role: "user",
        avatar: "👧",
        key: "qistina"
    },
    "ziq12345": {
        name: "Haziq Haikal",
        role: "user",
        avatar: "👦",
        key: "haziq"
    },
    "admin123": {
        name: "Admin",
        role: "admin",
        avatar: "👨‍💼",
        key: "admin"
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let appData = {
    balances: {},
    pendingList: [],
    transactions: []
};

// ============================================
// DOM ELEMENTS - Initialize after DOM loaded
// ============================================
let elements = {};

function initElements() {
    elements = {
        // Screens
        loginScreen: document.getElementById("loginScreen"),
        userScreen: document.getElementById("userScreen"),
        adminScreen: document.getElementById("adminScreen"),
        
        // Login
        loginForm: document.getElementById("loginForm"),
        passwordInput: document.getElementById("passwordInput"),
        togglePassword: document.getElementById("togglePassword"),
        loginError: document.getElementById("loginError"),
        
        // User Screen
        userAvatarWrapper: document.getElementById("userAvatarWrapper"),
        userAvatarImg: document.getElementById("userAvatarImg"),
        userAvatarEmoji: document.getElementById("userAvatarEmoji"),
        userAvatarInput: document.getElementById("userAvatarInput"),
        userName: document.getElementById("userName"),
        userBalance: document.getElementById("userBalance"),
        balanceStatus: document.getElementById("balanceStatus"),
        logoutBtn: document.getElementById("logoutBtn"),
        
        // Payment Form
        paymentForm: document.getElementById("paymentForm"),
        amountInput: document.getElementById("amountInput"),
        receiptInput: document.getElementById("receiptInput"),
        notesInput: document.getElementById("notesInput"),
        fileUploadArea: document.getElementById("fileUploadArea"),
        imagePreview: document.getElementById("imagePreview"),
        previewImg: document.getElementById("previewImg"),
        removeImage: document.getElementById("removeImage"),
        submitPaymentBtn: document.getElementById("submitPaymentBtn"),
        userTransactions: document.getElementById("userTransactions"),
        
        // Admin Screen
        adminAvatarWrapper: document.getElementById("adminAvatarWrapper"),
        adminAvatarImg: document.getElementById("adminAvatarImg"),
        adminAvatarEmoji: document.getElementById("adminAvatarEmoji"),
        adminAvatarInput: document.getElementById("adminAvatarInput"),
        adminLogoutBtn: document.getElementById("adminLogoutBtn"),
        qistinaBalance: document.getElementById("qistinaBalance"),
        haziqBalance: document.getElementById("haziqBalance"),
        addDebtForm: document.getElementById("addDebtForm"),
        debtName: document.getElementById("debtName"),
        debtAmount: document.getElementById("debtAmount"),
        debtNotes: document.getElementById("debtNotes"),
        addDebtBtn: document.getElementById("addDebtBtn"),
        pendingCount: document.getElementById("pendingCount"),
        pendingList: document.getElementById("pendingList"),
        allTransactions: document.getElementById("allTransactions"),
        
        // Global
        toast: document.getElementById("toast"),
        toastIcon: document.getElementById("toastIcon"),
        toastMessage: document.getElementById("toastMessage"),
        loadingOverlay: document.getElementById("loadingOverlay")
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2);
}

function showToast(message, type = "success") {
    elements.toastIcon.textContent = type === "success" ? "✓" : "✕";
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove("hidden");
    elements.toast.classList.add("show");
    
    setTimeout(() => {
        elements.toast.classList.remove("show");
        setTimeout(() => {
            elements.toast.classList.add("hidden");
        }, 300);
    }, 3000);
}

function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.classList.remove("hidden");
    } else {
        elements.loadingOverlay.classList.add("hidden");
    }
}

// ============================================
// CRITICAL: SCREEN SWITCHING FUNCTION
// ============================================
function switchScreen(screenId) {
    // Hide ALL screens first
    const allScreens = document.querySelectorAll(".screen");
    allScreens.forEach(screen => {
        screen.classList.remove("active");
    });
    
    // Show only the target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active");
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    console.log("Switched to screen:", screenId);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ============================================
// PROFILE PICTURE FUNCTIONS
// ============================================

function saveProfilePicture(userKey, imageData) {
    localStorage.setItem(`profile_${userKey}`, imageData);
}

function loadProfilePicture(userKey) {
    return localStorage.getItem(`profile_${userKey}`);
}

function updateAvatarDisplay(imgElement, emojiElement, imageData) {
    if (imageData && imgElement) {
        imgElement.src = imageData;
        imgElement.classList.add("show");
    } else if (imgElement) {
        imgElement.src = "";
        imgElement.classList.remove("show");
    }
}

async function handleAvatarUpload(e, userKey, imgElement, emojiElement) {
    const file = e.target.files[0];
    
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            showToast("Gambar terlalu besar. Maksimum 2MB.", "error");
            return;
        }
        
        if (!file.type.startsWith("image/")) {
            showToast("Sila pilih fail gambar sahaja.", "error");
            return;
        }
        
        try {
            const imageData = await fileToBase64(file);
            saveProfilePicture(userKey, imageData);
            updateAvatarDisplay(imgElement, emojiElement, imageData);
            showToast("Gambar profil berjaya dikemaskini!");
        } catch (error) {
            showToast("Gagal memuat naik gambar.", "error");
        }
    }
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchData() {
    try {
        showLoading(true);
        
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.success) {
            appData = data;
            updateUI();
        } else {
            throw new Error(data.error || "Gagal memuatkan data");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        showToast("Gagal memuatkan data: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

async function submitPayment(name, amount, imageBase64, notes) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "payment",
                name: name,
                amount: amount,
                image: imageBase64,
                notes: notes
            })
        });
        return { success: true };
    } catch (error) {
        throw error;
    }
}

async function approvePayment(rowIndex) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "approve",
                rowIndex: rowIndex
            })
        });
        return { success: true };
    } catch (error) {
        throw error;
    }
}

async function rejectPayment(rowIndex) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "reject",
                rowIndex: rowIndex
            })
        });
        return { success: true };
    } catch (error) {
        throw error;
    }
}

async function addDebt(name, amount, notes) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "addDebt",
                name: name,
                amount: amount,
                notes: notes
            })
        });
        return { success: true };
    } catch (error) {
        throw error;
    }
}

async function deleteTransaction(rowIndex) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "delete",
                rowIndex: rowIndex
            })
        });
        return { success: true };
    } catch (error) {
        throw error;
    }
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updateUI() {
    if (currentUser) {
        if (currentUser.role === "admin") {
            updateAdminUI();
        } else {
            updateUserUI();
        }
    }
}

function updateUserUI() {
    const balance = appData.balances[currentUser.name] || 0;
    elements.userBalance.textContent = formatCurrency(balance);
    
    if (balance <= 0) {
        elements.balanceStatus.textContent = "Tiada Hutang 🎉";
        elements.balanceStatus.className = "status-badge status-good";
    } else {
        elements.balanceStatus.textContent = "Ada Hutang";
        elements.balanceStatus.className = "status-badge status-debt";
    }
    
    const userTransactions = appData.transactions
        .filter(t => t.name === currentUser.name)
        .reverse();
    
    if (userTransactions.length === 0) {
        elements.userTransactions.innerHTML = `<p class="empty-state">Tiada transaksi lagi</p>`;
    } else {
        elements.userTransactions.innerHTML = userTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-icon ${t.type.toLowerCase()}">
                    ${t.type === "Debt" ? "📥" : "📤"}
                </div>
                <div class="transaction-details">
                    <div class="transaction-type">${t.type === "Debt" ? "Hutang" : "Bayaran"}</div>
                    <div class="transaction-meta">${t.timestamp}</div>
                    ${t.notes ? `<div class="transaction-meta">${t.notes}</div>` : ""}
                </div>
                <div class="transaction-amount">
                    <div class="amount ${t.type.toLowerCase()}">${t.type === "Debt" ? "+" : "-"}RM${formatCurrency(t.amount)}</div>
                    <div class="transaction-status status-${t.status.toLowerCase()}">${t.status}</div>
                </div>
            </div>
        `).join("");
    }
}

function updateAdminUI() {
    elements.qistinaBalance.textContent = formatCurrency(appData.balances["Qistina Hanan"] || 0);
    elements.haziqBalance.textContent = formatCurrency(appData.balances["Haziq Haikal"] || 0);
    
    elements.pendingCount.textContent = appData.pendingList.length;
    
    if (appData.pendingList.length === 0) {
        elements.pendingList.innerHTML = `<p class="empty-state">Tiada bayaran menunggu kelulusan</p>`;
    } else {
        elements.pendingList.innerHTML = appData.pendingList.map(t => `
            <div class="pending-item" data-row="${t.rowIndex}">
                <div class="transaction-icon payment">📤</div>
                <div class="transaction-details">
                    <div class="transaction-type">${t.name}</div>
                    <div class="transaction-meta">${t.timestamp}</div>
                    ${t.notes ? `<div class="transaction-meta">${t.notes}</div>` : ""}
                    ${t.receiptURL ? `<a href="${t.receiptURL}" target="_blank" class="receipt-link">📷 Lihat Resit</a>` : ""}
                </div>
                <div class="transaction-amount">
                    <div class="amount payment">RM${formatCurrency(t.amount)}</div>
                </div>
                <div class="pending-actions">
                    <button class="btn-approve" onclick="handleApprove(${t.rowIndex})">✓ Lulus</button>
                    <button class="btn-reject" onclick="handleReject(${t.rowIndex})">✕ Tolak</button>
                </div>
            </div>
        `).join("");
    }
    
    const sortedTransactions = [...appData.transactions].reverse();
    
    if (sortedTransactions.length === 0) {
        elements.allTransactions.innerHTML = `<p class="empty-state">Tiada transaksi lagi</p>`;
    } else {
        elements.allTransactions.innerHTML = sortedTransactions.slice(0, 50).map(t => `
            <div class="transaction-item">
                <div class="transaction-icon ${t.type.toLowerCase()}">
                    ${t.type === "Debt" ? "📥" : "📤"}
                </div>
                <div class="transaction-details">
                    <div class="transaction-type">${t.name} - ${t.type === "Debt" ? "Hutang" : "Bayaran"}</div>
                    <div class="transaction-meta">${t.timestamp}</div>
                    ${t.notes ? `<div class="transaction-meta">${t.notes}</div>` : ""}
                </div>
                <div class="transaction-amount">
                    <div class="amount ${t.type.toLowerCase()}">${t.type === "Debt" ? "+" : "-"}RM${formatCurrency(t.amount)}</div>
                    <div class="transaction-status status-${t.status.toLowerCase()}">${t.status}</div>
                </div>
                <div class="transaction-actions">
                    <button class="btn-delete" onclick="handleDelete(${t.rowIndex})" title="Padam">🗑️</button>
                </div>
            </div>
        `).join("");
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleLogin(e) {
    e.preventDefault();
    
    const password = elements.passwordInput.value.trim();
    
    if (USERS[password]) {
        currentUser = USERS[password];
        elements.loginError.textContent = "";
        elements.passwordInput.value = "";
        
        if (currentUser.role === "admin") {
            // Load admin profile picture
            const adminPic = loadProfilePicture(currentUser.key);
            updateAvatarDisplay(elements.adminAvatarImg, elements.adminAvatarEmoji, adminPic);
            if (elements.adminAvatarEmoji) {
                elements.adminAvatarEmoji.textContent = currentUser.avatar;
            }
            
            // SWITCH TO ADMIN SCREEN - Hide login, show admin
            switchScreen("adminScreen");
        } else {
            // Load user profile picture
            const userPic = loadProfilePicture(currentUser.key);
            updateAvatarDisplay(elements.userAvatarImg, elements.userAvatarEmoji, userPic);
            if (elements.userAvatarEmoji) {
                elements.userAvatarEmoji.textContent = currentUser.avatar;
            }
            if (elements.userName) {
                elements.userName.textContent = currentUser.name;
            }
            
            // SWITCH TO USER SCREEN - Hide login, show user dashboard
            switchScreen("userScreen");
        }
        
        // Fetch data from API
        fetchData();
        
        showToast(`Selamat datang, ${currentUser.name}!`);
    } else {
        elements.loginError.textContent = "Kata laluan tidak sah. Sila cuba lagi.";
    }
}

function handleLogout() {
    currentUser = null;
    appData = { balances: {}, pendingList: [], transactions: [] };
    
    // SWITCH BACK TO LOGIN SCREEN
    switchScreen("loginScreen");
    
    // Reset forms
    if (elements.paymentForm) elements.paymentForm.reset();
    if (elements.addDebtForm) elements.addDebtForm.reset();
    resetImagePreview();
}

function handleTogglePassword() {
    const type = elements.passwordInput.type === "password" ? "text" : "password";
    elements.passwordInput.type = type;
    elements.togglePassword.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
}

async function handleFileChange(e) {
    const file = e.target.files[0];
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast("Fail terlalu besar. Maksimum 5MB.", "error");
            elements.receiptInput.value = "";
            return;
        }
        
        if (!file.type.startsWith("image/")) {
            showToast("Sila pilih fail gambar sahaja.", "error");
            elements.receiptInput.value = "";
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.remove("hidden");
            elements.fileUploadArea.querySelector(".file-upload-content").classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
}

function resetImagePreview() {
    if (elements.receiptInput) elements.receiptInput.value = "";
    if (elements.previewImg) elements.previewImg.src = "";
    if (elements.imagePreview) elements.imagePreview.classList.add("hidden");
    const fileContent = elements.fileUploadArea?.querySelector(".file-upload-content");
    if (fileContent) fileContent.classList.remove("hidden");
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const amount = parseFloat(elements.amountInput.value);
    const file = elements.receiptInput.files[0];
    const notes = elements.notesInput.value.trim();
    
    if (!amount || amount <= 0) {
        showToast("Sila masukkan amaun yang sah.", "error");
        return;
    }
    
    if (!file) {
        showToast("Sila upload gambar resit.", "error");
        return;
    }
    
    const btnText = elements.submitPaymentBtn.querySelector(".btn-text");
    const btnLoading = elements.submitPaymentBtn.querySelector(".btn-loading");
    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    elements.submitPaymentBtn.disabled = true;
    
    try {
        const imageBase64 = await fileToBase64(file);
        await submitPayment(currentUser.name, amount, imageBase64, notes);
        
        showToast("Bayaran berjaya dihantar! Menunggu kelulusan.");
        
        elements.paymentForm.reset();
        resetImagePreview();
        
        setTimeout(async () => {
            await fetchData();
        }, 1500);
        
    } catch (error) {
        console.error("Payment error:", error);
        showToast("Gagal menghantar bayaran: " + error.message, "error");
    } finally {
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
        elements.submitPaymentBtn.disabled = false;
    }
}

async function handleAddDebtSubmit(e) {
    e.preventDefault();
    
    const name = elements.debtName.value;
    const amount = parseFloat(elements.debtAmount.value);
    const notes = elements.debtNotes.value.trim();
    
    if (!name) {
        showToast("Sila pilih nama.", "error");
        return;
    }
    
    if (!amount || amount <= 0) {
        showToast("Sila masukkan amaun yang sah.", "error");
        return;
    }
    
    const btnText = elements.addDebtBtn.querySelector(".btn-text");
    const btnLoading = elements.addDebtBtn.querySelector(".btn-loading");
    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    elements.addDebtBtn.disabled = true;
    
    try {
        await addDebt(name, amount, notes);
        
        showToast("Hutang berjaya ditambah!");
        
        elements.addDebtForm.reset();
        
        setTimeout(async () => {
            await fetchData();
        }, 1500);
        
    } catch (error) {
        console.error("Add debt error:", error);
        showToast("Gagal menambah hutang: " + error.message, "error");
    } finally {
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
        elements.addDebtBtn.disabled = false;
    }
}

async function handleApprove(rowIndex) {
    if (!confirm("Adakah anda pasti mahu meluluskan bayaran ini?")) {
        return;
    }
    
    showLoading(true);
    
    try {
        await approvePayment(rowIndex);
        showToast("Bayaran telah diluluskan!");
        
        setTimeout(async () => {
            await fetchData();
            showLoading(false);
        }, 1500);
        
    } catch (error) {
        console.error("Approve error:", error);
        showToast("Gagal meluluskan bayaran: " + error.message, "error");
        showLoading(false);
    }
}

async function handleReject(rowIndex) {
    if (!confirm("Adakah anda pasti mahu menolak bayaran ini?")) {
        return;
    }
    
    showLoading(true);
    
    try {
        await rejectPayment(rowIndex);
        showToast("Bayaran telah ditolak.");
        
        setTimeout(async () => {
            await fetchData();
            showLoading(false);
        }, 1500);
        
    } catch (error) {
        console.error("Reject error:", error);
        showToast("Gagal menolak bayaran: " + error.message, "error");
        showLoading(false);
    }
}

async function handleDelete(rowIndex) {
    if (!confirm("Adakah anda pasti mahu PADAM transaksi ini? Tindakan ini tidak boleh dibatalkan!")) {
        return;
    }
    
    showLoading(true);
    
    try {
        await deleteTransaction(rowIndex);
        showToast("Transaksi telah dipadam!");
        
        setTimeout(async () => {
            await fetchData();
            showLoading(false);
        }, 1500);
        
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Gagal memadam transaksi: " + error.message, "error");
        showLoading(false);
    }
}

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    // Initialize DOM elements
    initElements();
    
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }
    
    // Toggle password
    if (elements.togglePassword) {
        elements.togglePassword.addEventListener("click", handleTogglePassword);
    }
    
    // Logout buttons
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", handleLogout);
    }
    if (elements.adminLogoutBtn) {
        elements.adminLogoutBtn.addEventListener("click", handleLogout);
    }
    
    // User Avatar Upload
    if (elements.userAvatarInput) {
        elements.userAvatarInput.addEventListener("change", (e) => {
            if (currentUser) {
                handleAvatarUpload(e, currentUser.key, elements.userAvatarImg, elements.userAvatarEmoji);
            }
        });
    }
    
    // Admin Avatar Upload
    if (elements.adminAvatarInput) {
        elements.adminAvatarInput.addEventListener("change", (e) => {
            if (currentUser) {
                handleAvatarUpload(e, currentUser.key, elements.adminAvatarImg, elements.adminAvatarEmoji);
            }
        });
    }
    
    // File upload for receipt
    if (elements.receiptInput) {
        elements.receiptInput.addEventListener("change", handleFileChange);
    }
    if (elements.removeImage) {
        elements.removeImage.addEventListener("click", resetImagePreview);
    }
    
    // Drag and drop support
    if (elements.fileUploadArea) {
        elements.fileUploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            elements.fileUploadArea.style.borderColor = "var(--primary)";
            elements.fileUploadArea.style.background = "var(--primary-lighter)";
        });
        
        elements.fileUploadArea.addEventListener("dragleave", () => {
            elements.fileUploadArea.style.borderColor = "";
            elements.fileUploadArea.style.background = "";
        });
        
        elements.fileUploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            elements.fileUploadArea.style.borderColor = "";
            elements.fileUploadArea.style.background = "";
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                elements.receiptInput.files = dataTransfer.files;
                handleFileChange({ target: elements.receiptInput });
            }
        });
    }
    
    // Payment form
    if (elements.paymentForm) {
        elements.paymentForm.addEventListener("submit", handlePaymentSubmit);
    }
    
    // Add debt form
    if (elements.addDebtForm) {
        elements.addDebtForm.addEventListener("submit", handleAddDebtSubmit);
    }
    
    console.log("App initialized successfully!");
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.handleApprove = handleApprove;
window.handleReject = handleReject;
window.handleDelete = handleDelete;
