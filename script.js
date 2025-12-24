/**
 * ============================================
 * SISTEM PENJEJAK HUTANG KELUARGA
 * Frontend JavaScript
 * ============================================
 */

// ============================================
// ⚠️ PENTING: TUKAR URL INI ⚠️
// ============================================
// Paste URL Web App dari Google Apps Script di sini
// Contoh: "https://script.google.com/macros/s/AKfycbxxxxxxx/exec"
const API_URL = "https://script.google.com/macros/s/AKfycbyxqat-dT2DIp5G4WIJQAwfhcsOxoIMAfWho8qWYrd133DtTt_5yWnYZYKpJLK_gWyw/exec";
// ============================================

// ============================================
// KONFIGURASI LOGIN
// ============================================
const USERS = {
    "qis12345": {
        name: "Qistina Hanan",
        role: "user",
        avatar: "👧"
    },
    "ziq12345": {
        name: "Haziq Haikal",
        role: "user",
        avatar: "👦"
    },
    "admin123": {
        name: "Admin",
        role: "admin",
        avatar: "👨‍💼"
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
// DOM ELEMENTS
// ============================================
const elements = {
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
    userAvatar: document.getElementById("userAvatar"),
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

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format currency
function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ms-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Show toast notification
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

// Show/hide loading overlay
function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.classList.remove("hidden");
    } else {
        elements.loadingOverlay.classList.add("hidden");
    }
}

// Switch screen
function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    document.getElementById(screenId).classList.add("active");
}

// Convert file to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ============================================
// API FUNCTIONS
// ============================================

// Fetch data from API
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

// Submit payment
async function submitPayment(name, amount, imageBase64, notes) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "payment",
                name: name,
                amount: amount,
                image: imageBase64,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || "Gagal menghantar bayaran");
        }
    } catch (error) {
        throw error;
    }
}

// Approve payment
async function approvePayment(rowIndex) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "approve",
                rowIndex: rowIndex
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || "Gagal meluluskan bayaran");
        }
    } catch (error) {
        throw error;
    }
}

// Reject payment
async function rejectPayment(rowIndex) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "reject",
                rowIndex: rowIndex
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || "Gagal menolak bayaran");
        }
    } catch (error) {
        throw error;
    }
}

// Add debt
async function addDebt(name, amount, notes) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "addDebt",
                name: name,
                amount: amount,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || "Gagal menambah hutang");
        }
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
    // Update balance
    const balance = appData.balances[currentUser.name] || 0;
    elements.userBalance.textContent = formatCurrency(balance);
    
    // Update status badge
    if (balance <= 0) {
        elements.balanceStatus.textContent = "Tiada Hutang 🎉";
        elements.balanceStatus.className = "status-badge status-good";
    } else {
        elements.balanceStatus.textContent = "Ada Hutang";
        elements.balanceStatus.className = "status-badge status-debt";
    }
    
    // Update transaction history
    const userTransactions = appData.transactions
        .filter(t => t.name === currentUser.name)
        .reverse(); // Latest first
    
    if (userTransactions.length === 0) {
        elements.userTransactions.innerHTML = `
            <p class="empty-state">Tiada transaksi lagi</p>
        `;
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
    // Update balances
    elements.qistinaBalance.textContent = formatCurrency(appData.balances["Qistina Hanan"] || 0);
    elements.haziqBalance.textContent = formatCurrency(appData.balances["Haziq Haikal"] || 0);
    
    // Update pending count
    elements.pendingCount.textContent = appData.pendingList.length;
    
    // Update pending list
    if (appData.pendingList.length === 0) {
        elements.pendingList.innerHTML = `
            <p class="empty-state">Tiada bayaran menunggu kelulusan</p>
        `;
    } else {
        elements.pendingList.innerHTML = appData.pendingList.map(t => `
            <div class="pending-item" data-row="${t.rowIndex}">
                <div class="transaction-icon payment">📤</div>
                <div class="transaction-details">
                    <div class="transaction-type">${t.name}</div>
                    <div class="transaction-meta">${t.timestamp}</div>
                    ${t.notes ? `<div class="transaction-meta">${t.notes}</div>` : ""}
                    ${t.receiptURL ? `
                        <a href="${t.receiptURL}" target="_blank" class="receipt-link">
                            📷 Lihat Resit
                        </a>
                    ` : ""}
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
    
    // Update all transactions
    const sortedTransactions = [...appData.transactions].reverse();
    
    if (sortedTransactions.length === 0) {
        elements.allTransactions.innerHTML = `
            <p class="empty-state">Tiada transaksi lagi</p>
        `;
    } else {
        elements.allTransactions.innerHTML = sortedTransactions.slice(0, 20).map(t => `
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
            </div>
        `).join("");
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

// Login handler
function handleLogin(e) {
    e.preventDefault();
    
    const password = elements.passwordInput.value.trim();
    
    if (USERS[password]) {
        currentUser = USERS[password];
        elements.loginError.textContent = "";
        elements.passwordInput.value = "";
        
        if (currentUser.role === "admin") {
            switchScreen("adminScreen");
        } else {
            // Update user info
            elements.userAvatar.textContent = currentUser.avatar;
            elements.userName.textContent = currentUser.name;
            switchScreen("userScreen");
        }
        
        // Fetch data
        fetchData();
        
        showToast(`Selamat datang, ${currentUser.name}!`);
    } else {
        elements.loginError.textContent = "Kata laluan tidak sah. Sila cuba lagi.";
    }
}

// Logout handler
function handleLogout() {
    currentUser = null;
    appData = { balances: {}, pendingList: [], transactions: [] };
    switchScreen("loginScreen");
    
    // Reset forms
    elements.paymentForm.reset();
    elements.addDebtForm.reset();
    resetImagePreview();
}

// Toggle password visibility
function handleTogglePassword() {
    const type = elements.passwordInput.type === "password" ? "text" : "password";
    elements.passwordInput.type = type;
    elements.togglePassword.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
}

// File input change handler
async function handleFileChange(e) {
    const file = e.target.files[0];
    
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast("Fail terlalu besar. Maksimum 5MB.", "error");
            elements.receiptInput.value = "";
            return;
        }
        
        // Check file type
        if (!file.type.startsWith("image/")) {
            showToast("Sila pilih fail gambar sahaja.", "error");
            elements.receiptInput.value = "";
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.remove("hidden");
            elements.fileUploadArea.querySelector(".file-upload-content").classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
}

// Remove image preview
function resetImagePreview() {
    elements.receiptInput.value = "";
    elements.previewImg.src = "";
    elements.imagePreview.classList.add("hidden");
    elements.fileUploadArea.querySelector(".file-upload-content").classList.remove("hidden");
}

// Payment form submit handler
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
    
    // Show loading state
    const btnText = elements.submitPaymentBtn.querySelector(".btn-text");
    const btnLoading = elements.submitPaymentBtn.querySelector(".btn-loading");
    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    elements.submitPaymentBtn.disabled = true;
    
    try {
        // Convert image to Base64
        const imageBase64 = await fileToBase64(file);
        
        // Submit payment
        await submitPayment(currentUser.name, amount, imageBase64, notes);
        
        showToast("Bayaran berjaya dihantar! Menunggu kelulusan.");
        
        // Reset form
        elements.paymentForm.reset();
        resetImagePreview();
        
        // Refresh data
        await fetchData();
        
    } catch (error) {
        console.error("Payment error:", error);
        showToast("Gagal menghantar bayaran: " + error.message, "error");
    } finally {
        // Reset button state
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
        elements.submitPaymentBtn.disabled = false;
    }
}

// Add debt form submit handler
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
    
    // Show loading state
    const btnText = elements.addDebtBtn.querySelector(".btn-text");
    const btnLoading = elements.addDebtBtn.querySelector(".btn-loading");
    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    elements.addDebtBtn.disabled = true;
    
    try {
        await addDebt(name, amount, notes);
        
        showToast("Hutang berjaya ditambah!");
        
        // Reset form
        elements.addDebtForm.reset();
        
        // Refresh data
        await fetchData();
        
    } catch (error) {
        console.error("Add debt error:", error);
        showToast("Gagal menambah hutang: " + error.message, "error");
    } finally {
        // Reset button state
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
        elements.addDebtBtn.disabled = false;
    }
}

// Approve payment handler (global function for onclick)
async function handleApprove(rowIndex) {
    if (!confirm("Adakah anda pasti mahu meluluskan bayaran ini?")) {
        return;
    }
    
    showLoading(true);
    
    try {
        await approvePayment(rowIndex);
        showToast("Bayaran telah diluluskan!");
        await fetchData();
    } catch (error) {
        console.error("Approve error:", error);
        showToast("Gagal meluluskan bayaran: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

// Reject payment handler (global function for onclick)
async function handleReject(rowIndex) {
    if (!confirm("Adakah anda pasti mahu menolak bayaran ini?")) {
        return;
    }
    
    showLoading(true);
    
    try {
        await rejectPayment(rowIndex);
        showToast("Bayaran telah ditolak.");
        await fetchData();
    } catch (error) {
        console.error("Reject error:", error);
        showToast("Gagal menolak bayaran: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    // Login
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.togglePassword.addEventListener("click", handleTogglePassword);
    
    // Logout
    elements.logoutBtn.addEventListener("click", handleLogout);
    elements.adminLogoutBtn.addEventListener("click", handleLogout);
    
    // File upload
    elements.receiptInput.addEventListener("change", handleFileChange);
    elements.removeImage.addEventListener("click", resetImagePreview);
    
    // Drag and drop support
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
    
    // Payment form
    elements.paymentForm.addEventListener("submit", handlePaymentSubmit);
    
    // Add debt form
    elements.addDebtForm.addEventListener("submit", handleAddDebtSubmit);
    
    // Check if API URL is configured
    if (API_URL === "PASTE_URL_WEB_APP_ANDA_DI_SINI") {
        console.warn("⚠️ API URL belum dikonfigurasi! Sila tukar nilai API_URL dalam script.js");
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.handleApprove = handleApprove;
window.handleReject = handleReject;
