/**
 * ============================================
 * SISTEM PENJEJAK HUTANG KELUARGA
 * Frontend JavaScript v4
 * - Dynamic users from database
 * - User management (add/edit/delete)
 * - Fixed profile picture URL
 * ============================================
 */

// ============================================
// API URL - GANTI DENGAN URL ANDA
// ============================================
const API_URL = "https://script.google.com/macros/s/AKfycbxyb2cC_KRWBtvI4jOCA3Y74nBxNT-azwG-9Yw88vkbj267e1JUglI0kckXvFM7GI5s/exec";

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let appData = {
    balances: {},
    pendingList: [],
    transactions: [],
    users: {}
};
let editingUserKey = null;

// ============================================
// DOM ELEMENTS
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
        fileUploadContent: document.getElementById("fileUploadContent"),
        imagePreview: document.getElementById("imagePreview"),
        previewImg: document.getElementById("previewImg"),
        removeImage: document.getElementById("removeImage"),
        submitPaymentBtn: document.getElementById("submitPaymentBtn"),
        userTransactions: document.getElementById("userTransactions"),
        
        // Admin Screen
        adminAvatarImg: document.getElementById("adminAvatarImg"),
        adminAvatarEmoji: document.getElementById("adminAvatarEmoji"),
        adminAvatarInput: document.getElementById("adminAvatarInput"),
        adminLogoutBtn: document.getElementById("adminLogoutBtn"),
        usersList: document.getElementById("usersList"),
        addUserBtn: document.getElementById("addUserBtn"),
        addUserForm: document.getElementById("addUserForm"),
        newUserName: document.getElementById("newUserName"),
        confirmAddUser: document.getElementById("confirmAddUser"),
        cancelAddUser: document.getElementById("cancelAddUser"),
        addDebtForm: document.getElementById("addDebtForm"),
        debtName: document.getElementById("debtName"),
        debtAmount: document.getElementById("debtAmount"),
        debtNotes: document.getElementById("debtNotes"),
        addDebtBtn: document.getElementById("addDebtBtn"),
        pendingCount: document.getElementById("pendingCount"),
        pendingList: document.getElementById("pendingList"),
        allTransactions: document.getElementById("allTransactions"),
        
        // Modal
        editPasswordModal: document.getElementById("editPasswordModal"),
        editPasswordUserName: document.getElementById("editPasswordUserName"),
        editPasswordInput: document.getElementById("editPasswordInput"),
        closePasswordModal: document.getElementById("closePasswordModal"),
        cancelPasswordEdit: document.getElementById("cancelPasswordEdit"),
        savePasswordBtn: document.getElementById("savePasswordBtn"),
        
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

function switchScreen(screenId) {
    const allScreens = document.querySelectorAll(".screen");
    allScreens.forEach(screen => {
        screen.classList.remove("active");
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active");
        window.scrollTo(0, 0);
    }
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

function updateAvatarDisplay(imgElement, emojiElement, imageURL) {
    if (imageURL && imgElement) {
        imgElement.src = imageURL;
        imgElement.classList.add("show");
    } else if (imgElement) {
        imgElement.src = "";
        imgElement.classList.remove("show");
    }
}

async function uploadProfilePicture(userKey, imageBase64) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "updateProfile",
                userKey: userKey,
                image: imageBase64
            })
        });
        return { success: true };
    } catch (error) {
        throw error;
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
        
        showLoading(true);
        
        try {
            const imageBase64 = await fileToBase64(file);
            await uploadProfilePicture(userKey, imageBase64);
            updateAvatarDisplay(imgElement, emojiElement, imageBase64);
            showToast("Gambar profil berjaya dikemaskini!");
            
            setTimeout(async () => {
                await fetchData();
                showLoading(false);
            }, 2000);
            
        } catch (error) {
            showToast("Gagal memuat naik gambar.", "error");
            showLoading(false);
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
            
            // Update profile pictures
            if (currentUser) {
                const userInfo = appData.users[currentUser.key];
                if (userInfo && userInfo.profilePicURL) {
                    if (currentUser.role === "admin") {
                        updateAvatarDisplay(elements.adminAvatarImg, elements.adminAvatarEmoji, userInfo.profilePicURL);
                    } else {
                        updateAvatarDisplay(elements.userAvatarImg, elements.userAvatarEmoji, userInfo.profilePicURL);
                    }
                }
            }
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
}

async function approvePayment(rowIndex) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "approve", rowIndex: rowIndex })
    });
}

async function rejectPayment(rowIndex) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "reject", rowIndex: rowIndex })
    });
}

async function addDebt(name, amount, notes) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "addDebt", name: name, amount: amount, notes: notes })
    });
}

async function deleteTransaction(rowIndex) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "delete", rowIndex: rowIndex })
    });
}

async function addUser(name) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "addUser", name: name })
    });
}

async function updatePassword(userKey, password) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "updatePassword", userKey: userKey, password: password })
    });
}

async function deleteUser(userKey) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "deleteUser", userKey: userKey })
    });
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
    // Update Users List with balance and password
    const usersHtml = Object.entries(appData.users)
        .filter(([key, user]) => user.role !== "admin")
        .map(([key, user]) => {
            const balance = appData.balances[user.name] || 0;
            const avatarContent = user.profilePicURL 
                ? `<img src="${user.profilePicURL}" alt="${user.name}">`
                : "👤";
            
            return `
                <div class="user-card" data-user-key="${key}">
                    <div class="user-card-avatar">${avatarContent}</div>
                    <div class="user-card-info">
                        <div class="user-card-name">${user.name}</div>
                        <div class="user-card-balance">RM ${formatCurrency(balance)}</div>
                        <div class="user-card-password">
                            🔑 <code>${user.password}</code>
                        </div>
                    </div>
                    <div class="user-card-actions">
                        <button class="btn btn-xs btn-secondary" onclick="openEditPassword('${key}', '${user.name}', '${user.password}')">✏️ Edit</button>
                        <button class="btn btn-xs btn-danger" onclick="handleDeleteUser('${key}', '${user.name}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join("");
    
    elements.usersList.innerHTML = usersHtml || `<p class="empty-state">Tiada penghutang. Klik "Tambah" untuk menambah.</p>`;
    
    // Update debt dropdown with users
    const debtOptions = Object.entries(appData.users)
        .filter(([key, user]) => user.role !== "admin")
        .map(([key, user]) => `<option value="${user.name}">${user.name}</option>`)
        .join("");
    
    elements.debtName.innerHTML = `<option value="">Pilih nama...</option>${debtOptions}`;
    
    // Update pending count
    elements.pendingCount.textContent = appData.pendingList.length;
    
    // Update pending list
    if (appData.pendingList.length === 0) {
        elements.pendingList.innerHTML = `<p class="empty-state">Tiada bayaran menunggu kelulusan</p>`;
    } else {
        elements.pendingList.innerHTML = appData.pendingList.map(t => `
            <div class="pending-item">
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
    
    // Update all transactions
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
    
    // Find user by password
    let foundUser = null;
    let foundKey = null;
    
    for (const [key, user] of Object.entries(appData.users)) {
        if (user.password === password) {
            foundUser = user;
            foundKey = key;
            break;
        }
    }
    
    if (foundUser) {
        currentUser = {
            key: foundKey,
            name: foundUser.name,
            role: foundUser.role || "user",
            profilePicURL: foundUser.profilePicURL
        };
        
        elements.loginError.textContent = "";
        elements.passwordInput.value = "";
        
        if (currentUser.role === "admin") {
            if (elements.adminAvatarEmoji) {
                elements.adminAvatarEmoji.textContent = "👨‍💼";
            }
            if (foundUser.profilePicURL) {
                updateAvatarDisplay(elements.adminAvatarImg, elements.adminAvatarEmoji, foundUser.profilePicURL);
            }
            switchScreen("adminScreen");
        } else {
            if (elements.userAvatarEmoji) {
                elements.userAvatarEmoji.textContent = "👤";
            }
            if (elements.userName) {
                elements.userName.textContent = currentUser.name;
            }
            if (foundUser.profilePicURL) {
                updateAvatarDisplay(elements.userAvatarImg, elements.userAvatarEmoji, foundUser.profilePicURL);
            }
            switchScreen("userScreen");
        }
        
        fetchData();
        showToast(`Selamat datang, ${currentUser.name}!`);
    } else {
        elements.loginError.textContent = "Kata laluan tidak sah. Sila cuba lagi.";
    }
}

function handleLogout() {
    currentUser = null;
    
    if (elements.userAvatarImg) {
        elements.userAvatarImg.src = "";
        elements.userAvatarImg.classList.remove("show");
    }
    if (elements.adminAvatarImg) {
        elements.adminAvatarImg.src = "";
        elements.adminAvatarImg.classList.remove("show");
    }
    
    switchScreen("loginScreen");
    
    if (elements.paymentForm) elements.paymentForm.reset();
    if (elements.addDebtForm) elements.addDebtForm.reset();
    resetImagePreview();
    
    // Re-fetch data for fresh login
    fetchData();
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
            if (elements.fileUploadContent) {
                elements.fileUploadContent.classList.add("hidden");
            }
        };
        reader.readAsDataURL(file);
    }
}

function resetImagePreview() {
    if (elements.receiptInput) elements.receiptInput.value = "";
    if (elements.previewImg) elements.previewImg.src = "";
    if (elements.imagePreview) elements.imagePreview.classList.add("hidden");
    if (elements.fileUploadContent) elements.fileUploadContent.classList.remove("hidden");
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
        showToast("Gagal menambah hutang: " + error.message, "error");
    } finally {
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
        elements.addDebtBtn.disabled = false;
    }
}

// ============================================
// USER MANAGEMENT HANDLERS
// ============================================

function showAddUserForm() {
    elements.addUserForm.classList.remove("hidden");
    elements.newUserName.focus();
}

function hideAddUserForm() {
    elements.addUserForm.classList.add("hidden");
    elements.newUserName.value = "";
}

async function handleAddUser() {
    const name = elements.newUserName.value.trim();
    
    if (!name) {
        showToast("Sila masukkan nama penghutang.", "error");
        return;
    }
    
    showLoading(true);
    
    try {
        await addUser(name);
        showToast("Penghutang baru berjaya ditambah!");
        hideAddUserForm();
        
        setTimeout(async () => {
            await fetchData();
            showLoading(false);
        }, 1500);
        
    } catch (error) {
        showToast("Gagal menambah penghutang: " + error.message, "error");
        showLoading(false);
    }
}

function openEditPassword(userKey, userName, currentPassword) {
    editingUserKey = userKey;
    elements.editPasswordUserName.textContent = userName;
    elements.editPasswordInput.value = currentPassword;
    elements.editPasswordModal.classList.remove("hidden");
    elements.editPasswordInput.focus();
}

function closeEditPasswordModal() {
    elements.editPasswordModal.classList.add("hidden");
    editingUserKey = null;
    elements.editPasswordInput.value = "";
}

async function handleSavePassword() {
    const newPassword = elements.editPasswordInput.value.trim();
    
    if (!newPassword) {
        showToast("Sila masukkan password baru.", "error");
        return;
    }
    
    if (newPassword.length < 4) {
        showToast("Password mesti sekurang-kurangnya 4 aksara.", "error");
        return;
    }
    
    showLoading(true);
    
    try {
        await updatePassword(editingUserKey, newPassword);
        showToast("Password berjaya dikemaskini!");
        closeEditPasswordModal();
        
        setTimeout(async () => {
            await fetchData();
            showLoading(false);
        }, 1500);
        
    } catch (error) {
        showToast("Gagal mengemaskini password: " + error.message, "error");
        showLoading(false);
    }
}

async function handleDeleteUser(userKey, userName) {
    if (!confirm(`Adakah anda pasti mahu PADAM penghutang "${userName}"? Tindakan ini tidak boleh dibatalkan!`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        await deleteUser(userKey);
        showToast("Penghutang berjaya dipadam!");
        
        setTimeout(async () => {
            await fetchData();
            showLoading(false);
        }, 1500);
        
    } catch (error) {
        showToast("Gagal memadam penghutang: " + error.message, "error");
        showLoading(false);
    }
}

// ============================================
// TRANSACTION HANDLERS
// ============================================

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
        showToast("Gagal memadam transaksi: " + error.message, "error");
        showLoading(false);
    }
}

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    
    // Fetch initial data (for login validation)
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success) {
            appData = data;
        }
    } catch (error) {
        console.error("Initial fetch error:", error);
    }
    
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }
    
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
    
    // Add User buttons
    if (elements.addUserBtn) {
        elements.addUserBtn.addEventListener("click", showAddUserForm);
    }
    if (elements.confirmAddUser) {
        elements.confirmAddUser.addEventListener("click", handleAddUser);
    }
    if (elements.cancelAddUser) {
        elements.cancelAddUser.addEventListener("click", hideAddUserForm);
    }
    
    // Password Modal
    if (elements.closePasswordModal) {
        elements.closePasswordModal.addEventListener("click", closeEditPasswordModal);
    }
    if (elements.cancelPasswordEdit) {
        elements.cancelPasswordEdit.addEventListener("click", closeEditPasswordModal);
    }
    if (elements.savePasswordBtn) {
        elements.savePasswordBtn.addEventListener("click", handleSavePassword);
    }
    
    // Close modal on backdrop click
    if (elements.editPasswordModal) {
        elements.editPasswordModal.querySelector(".modal-backdrop").addEventListener("click", closeEditPasswordModal);
    }
    
    // File upload
    if (elements.receiptInput) {
        elements.receiptInput.addEventListener("change", handleFileChange);
    }
    if (elements.removeImage) {
        elements.removeImage.addEventListener("click", resetImagePreview);
    }
    
    // Drag and drop
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
    
    // Forms
    if (elements.paymentForm) {
        elements.paymentForm.addEventListener("submit", handlePaymentSubmit);
    }
    if (elements.addDebtForm) {
        elements.addDebtForm.addEventListener("submit", handleAddDebtSubmit);
    }
    
    console.log("App initialized - v4 with User Management!");
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.handleApprove = handleApprove;
window.handleReject = handleReject;
window.handleDelete = handleDelete;
window.openEditPassword = openEditPassword;
window.handleDeleteUser = handleDeleteUser;
