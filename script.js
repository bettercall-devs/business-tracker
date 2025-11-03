// ========================================
// IMPROVED TOKEN MANAGEMENT WITH SETTINGS
// ========================================

let GITHUB_TOKEN = null;
let GIST_ID = null;
let GIST_API_URL = "";

function initializeGitHub() {
    // Try to load from localStorage
    GITHUB_TOKEN = localStorage.getItem("business_tracker_token");
    GIST_ID = localStorage.getItem("business_tracker_gist_id");
    
    if (GITHUB_TOKEN && GIST_ID) {
        setupGistUrls();
        setSyncStatus("synced");
        console.log("GitHub credentials loaded from storage");
        return true;
    } else {
        setSyncStatus("local");
        return false;
    }
}

function setupGistUrls() {
    GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
}

function showGitHubSettings() {
    const isConfigured = GITHUB_TOKEN && GIST_ID;
    
    const settingsHtml = `
        <div id="githubSettingsModal" class="modal active">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h4><i class="fab fa-github"></i> GitHub Sync Settings</h4>
                    <span class="close" onclick="closeGitHubSettings()">&times;</span>
                </div>
                <div class="modal-body">
                    ${isConfigured ? `
                        <div style="padding: 15px; background: #d4edda; border-radius: 8px; margin-bottom: 20px; color: #155724;">
                            <i class="fas fa-check-circle"></i> GitHub sync is configured and working!
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h5>Current Setup:</h5>
                            <p><strong>Token:</strong> ${GITHUB_TOKEN.substring(0, 8)}...${GITHUB_TOKEN.substring(-4)} (Hidden for security)</p>
                            <p><strong>Gist ID:</strong> ${GIST_ID}</p>
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn btn-danger" onclick="removeGitHubCredentials()">
                                <i class="fas fa-trash"></i> Remove Credentials
                            </button>
                            <button class="btn btn-secondary" onclick="closeGitHubSettings()">
                                <i class="fas fa-times"></i> Close
                            </button>
                            <button class="btn btn-primary" onclick="testGitHubConnection()">
                                <i class="fas fa-sync"></i> Test Connection
                            </button>
                        </div>
                    ` : `
                        <div style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                            <h5>One-Time Setup:</h5>
                            <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                                <li>Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings → Personal Access Tokens</a></li>
                                <li>Click "Generate new token (classic)"</li>
                                <li>Name: "Business Tracker"</li>
                                <li>Select scope: <strong>gist</strong> only</li>
                                <li>Click "Generate token" and copy it</li>
                                <li>Go to <a href="https://gist.github.com/new" target="_blank">gist.github.com/new</a></li>
                                <li>Filename: "business-data.json"</li>
                                <li>Content: <code>{}</code></li>
                                <li>Create gist and copy the ID from URL</li>
                            </ol>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Personal Access Token:</label>
                            <input type="password" id="newToken" class="form-control" placeholder="ghp_...">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-file-code"></i> Gist ID:</label>
                            <input type="text" id="newGistId" class="form-control" placeholder="abc123...">
                            <small style="color: #666;">From URL: gist.github.com/username/<strong>THIS_PART</strong></small>
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn btn-secondary" onclick="closeGitHubSettings()">Cancel</button>
                            <button class="btn btn-primary" onclick="saveGitHubCredentials()">
                                <i class="fas fa-save"></i> Save & Test
                            </button>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML("beforeend", settingsHtml);
}

function saveGitHubCredentials() {
    const token = document.getElementById("newToken").value.trim();
    const gistId = document.getElementById("newGistId").value.trim();
    
    if (!token || !gistId) {
        showNotification("Please fill in both fields", "error");
        return;
    }
    
    if (!token.startsWith('ghp_')) {
        showNotification("Invalid token format", "error");
        return;
    }
    
    // Save permanently
    localStorage.setItem("business_tracker_token", token);
    localStorage.setItem("business_tracker_gist_id", gistId);
    
    GITHUB_TOKEN = token;
    GIST_ID = gistId;
    setupGistUrls();
    
    // Test and close
    testGitHubConnection().then(success => {
        if (success) {
            showNotification("GitHub sync configured! ✅", "success");
            closeGitHubSettings();
            loadFromGitHub();
        } else {
            showNotification("Connection failed. Check your credentials.", "error");
        }
    });
}

function removeGitHubCredentials() {
    if (confirm("Remove GitHub credentials? You'll work in offline mode until you set them up again.")) {
        localStorage.removeItem("business_tracker_token");
        localStorage.removeItem("business_tracker_gist_id");
        
        GITHUB_TOKEN = null;
        GIST_ID = null;
        GIST_API_URL = "";
        
        setSyncStatus("local");
        showNotification("GitHub credentials removed", "info");
        closeGitHubSettings();
    }
}

function closeGitHubSettings() {
    const modal = document.getElementById("githubSettingsModal");
    if (modal) modal.remove();
}

async function testGitHubConnection() {
    if (!GITHUB_TOKEN || !GIST_API_URL) return false;
    
    try {
        const response = await fetch(GIST_API_URL, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
        
        if (response.ok) {
            setSyncStatus("synced");
            showNotification("Connection successful! ✅", "success");
            return true;
        } else {
            setSyncStatus("error");
            return false;
        }
    } catch (error) {
        setSyncStatus("error");
        return false;
    }
}

// Make functions global
window.showGitHubSettings = showGitHubSettings;
window.closeGitHubSettings = closeGitHubSettings;
window.saveGitHubCredentials = saveGitHubCredentials;
window.removeGitHubCredentials = removeGitHubCredentials;
window.testGitHubConnection = testGitHubConnection;


      // ========================================
      // LOGIN SYSTEM
      // ========================================
      const DEFAULT_INITIAL_CASH = 0;
      const DEFAULT_INITIAL_UPI = 0;
      let currentUser = null;

      const users = {
        krishnaraj: { password: "krishnaraj@123", name: "Krishnaraj" },
        dhanush: { password: "dhanush@123", name: "Dhanush" },
        jayasuriya: { password: "jayasuriya@123", name: "Jayasuriya" },
        jana: { password: "jana@123", name: "Jana" },
      };

      function showLogin() {
        const loginHtml = `
              <div id="loginModal" class="modal active">
                  <div class="modal-content" style="max-width: 400px;">
                      <div class="modal-header">
                          <h4><i class="fas fa-lock"></i> Login Required</h4>
                      </div>
                      <div class="modal-body">
                          <form id="loginForm">
                              <div class="form-group">
                                  <label><i class="fas fa-user"></i> Username</label>
                                  <input type="text" id="username" class="form-control" required autocomplete="username">
                              </div>
                              <div class="form-group">
                                  <label><i class="fas fa-key"></i> Password</label>
                                  <input type="password" id="password" class="form-control" required autocomplete="current-password">
                              </div>
                              <div class="form-actions">
                                  <button type="submit" class="btn btn-primary" style="width: 100%;">
                                      <i class="fas fa-sign-in-alt"></i> Login
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
          `;
        document.body.insertAdjacentHTML("beforeend", loginHtml);

        document
          .getElementById("loginForm")
          .addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            if (login(username, password)) {
              document.getElementById("loginModal").remove();
              initializeApp();
            } else {
              showNotification("Invalid username or password", "error");
            }
          });
      }

      function login(username, password) {
        if (users[username] && users[username].password === password) {
          currentUser = { username, name: users[username].name };
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
          document.querySelector(
            ".user-info span"
          ).textContent = `Welcome, ${currentUser.name}`;
          return true;
        }
        return false;
      }

      function logout() {
        currentUser = null;
        localStorage.removeItem("currentUser");
        location.reload();
      }

      function checkAuth() {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
          currentUser = JSON.parse(savedUser);
          document.querySelector(
            ".user-info span"
          ).textContent = `Welcome, ${currentUser.name}`;
          return true;
        }
        showLogin();
        return false;
      }

      // ========================================
      // APP VARIABLES
      // ========================================

      let salesData = [];
      let expensesData = [];
      let purposeFrequency = {};
      let currentEditingItem = null;
      let isOnline = navigator.onLine;

      // IMAGE UPLOAD VARIABLES
      let currentImageData = null;
      let currentImageName = null;

      let currentFilters = {
        salesSearch: "",
        salesDateFrom: "",
        salesDateTo: "",
        expensesSearch: "",
        expensesDateFrom: "",
        expensesDateTo: "",
      };

      // ========================================
      // ID GENERATION (SL001, EX001 format)
      // ========================================

      function generateSaleId() {
        const maxId = salesData.reduce((max, sale) => {
          if (sale.id && sale.id.startsWith("SL")) {
            const num = parseInt(sale.id.substring(2));
            return Math.max(max, num);
          }
          return max;
        }, 0);
        return `SL${(maxId + 1).toString().padStart(3, "0")}`;
      }

      function generateExpenseId() {
        const maxId = expensesData.reduce((max, expense) => {
          if (expense.id && expense.id.startsWith("EX")) {
            const num = parseInt(expense.id.substring(2));
            return Math.max(max, num);
          }
          return max;
        }, 0);
        return `EX${(maxId + 1).toString().padStart(3, "0")}`;
      }

      // ========================================
      // IMAGE HANDLING FUNCTIONS
      // ========================================

      function handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith("image/")) {
          showNotification("Please select a valid image file.", "error");
          input.value = "";
          return;
        }

        // Check file size (5MB limit for better user experience)
        if (file.size > 5 * 1024 * 1024) {
          showNotification(
            "Image too large. Please choose an image under 5MB.",
            "error"
          );
          input.value = "";
          return;
        }

        showLoading();

        const reader = new FileReader();

        reader.onload = function (e) {
          // Compress image if needed
          compressImage(e.target.result, file.name)
            .then((compressedData) => {
              currentImageData = compressedData;
              currentImageName = file.name;

              // Show preview
              const previewImg = document.getElementById("previewImg");
              const imagePreview = document.getElementById("imagePreview");
              const imageInfo = document.getElementById("imageInfo");

              if (previewImg && imagePreview) {
                previewImg.src = currentImageData;

                if (imageInfo) {
                  const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
                  const compressedSizeMB = (
                    (currentImageData.length * 0.75) /
                    1024 /
                    1024
                  ).toFixed(2);
                  imageInfo.textContent = `${file.name} (${compressedSizeMB}MB compressed from ${originalSizeMB}MB)`;
                }

                imagePreview.style.display = "block";
                showNotification(
                  "Image uploaded and compressed successfully!",
                  "success"
                );
              }

              hideLoading();
            })
            .catch((error) => {
              hideLoading();
              showNotification("Error processing image", "error");
              console.error("Image compression error:", error);
            });
        };

        reader.onerror = function () {
          hideLoading();
          showNotification("Error reading image file", "error");
        };

        reader.readAsDataURL(file);
      }

      // Image compression function
      function compressImage(
        base64String,
        fileName,
        maxWidth = 1200,
        quality = 0.8
      ) {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to compressed base64
            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
          };

          img.onerror = reject;
          img.src = base64String;
        });
      }

      function removeImage() {
        currentImageData = null;
        currentImageName = null;
        const imageInput = document.getElementById("expenseImage");
        const imagePreview = document.getElementById("imagePreview");

        if (imageInput) imageInput.value = "";
        if (imagePreview) imagePreview.style.display = "none";

        showNotification("Image removed", "success");
      }

      function viewExpenseImage(expenseId) {
        const expense = readExpense(expenseId);

        if (expense && expense.image) {
          document.getElementById("fullSizeImage").src = expense.image;
          document.getElementById("imageViewerModal").classList.add("active");
          document.body.style.overflow = "hidden";
        } else {
          showNotification("No image available for this expense", "error");
        }
      }

      function closeImageViewer() {
        document.getElementById("imageViewerModal").classList.remove("active");
        document.body.style.overflow = "";
      }

      function downloadImage() {
        const img = document.getElementById("fullSizeImage");
        const link = document.createElement("a");
        link.download = "receipt-image.jpg";
        link.href = img.src;
        link.click();
      }

      // Make image functions globally available
      window.handleImageUpload = handleImageUpload;
      window.removeImage = removeImage;
      window.viewExpenseImage = viewExpenseImage;
      window.closeImageViewer = closeImageViewer;
      window.downloadImage = downloadImage;

      // ========================================
      // GITHUB FUNCTIONS
      // ========================================

      async function saveToGitHub() {
        if (
          !isOnline ||
          !GITHUB_TOKEN ||
          GITHUB_TOKEN === "YOUR_NEW_GITHUB_TOKEN"
        ) {
          saveToLocalStorage();
          setSyncStatus("local");
          return;
        }

        setSyncStatus("syncing");
        try {
          const data = {
            sales: salesData,
            expenses: expensesData,
            purposeFrequency: purposeFrequency,
            lastUpdated: new Date().toISOString(),
          };

          const response = await fetch(GIST_API_URL, {
            method: "PATCH",
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: {
                "business-data.json": {
                  content: JSON.stringify(data, null, 2),
                },
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          setSyncStatus("synced");
          saveToLocalStorage();
        } catch (error) {
          setSyncStatus("error");
          saveToLocalStorage();
        }
      }

      async function loadFromGitHub() {
        if (
          !isOnline ||
          !GITHUB_TOKEN ||
          GITHUB_TOKEN === "YOUR_NEW_GITHUB_TOKEN"
        ) {
          loadFromLocalStorage();
          return;
        }

        setSyncStatus("syncing");
        try {
          const response = await fetch(GIST_API_URL, {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const gistData = await response.json();
          const fileContent = gistData.files["business-data.json"]?.content;
          if (!fileContent) {
            throw new Error("business-data.json not found in gist");
          }

          const data = JSON.parse(fileContent);

          salesData = data.sales || [];
          expensesData = data.expenses || [];
          purposeFrequency = data.purposeFrequency || {};

          renderSalesTable();
          renderExpensesTable();
          updateDashboard();
          saveToLocalStorage();

          setSyncStatus("synced");
        } catch (error) {
          setSyncStatus("error");
          loadFromLocalStorage();
        }
      }

      // ========================================
      // LOCAL STORAGE FUNCTIONS
      // ========================================

      function saveToLocalStorage() {
        try {
          localStorage.setItem(
            "business_tracker_sales",
            JSON.stringify(salesData)
          );
          localStorage.setItem(
            "business_tracker_expenses",
            JSON.stringify(expensesData)
          );
          localStorage.setItem(
            "business_tracker_frequency",
            JSON.stringify(purposeFrequency)
          );
        } catch (error) {
          console.error("❌ Local storage failed:", error);
        }
      }

      function loadFromLocalStorage() {
        try {
          salesData = JSON.parse(
            localStorage.getItem("business_tracker_sales") || "[]"
          );
          expensesData = JSON.parse(
            localStorage.getItem("business_tracker_expenses") || "[]"
          );
          purposeFrequency = JSON.parse(
            localStorage.getItem("business_tracker_frequency") || "{}"
          );

          renderSalesTable();
          renderExpensesTable();
          updateDashboard();

          setSyncStatus("local");
        } catch (error) {
          salesData = [];
          expensesData = [];
          purposeFrequency = {};
          renderSalesTable();
          renderExpensesTable();
          updateDashboard();
        }
      }

      // ========================================
      // STATUS FUNCTIONS
      // ========================================

      function setSyncStatus(status) {
        const statusEl = document.getElementById("syncStatus");
        if (statusEl) {
          const statusConfig = {
            syncing: {
              icon: "fas fa-sync fa-spin",
              text: "Syncing",
              class: "syncing",
            },
            synced: { icon: "fab fa-github", text: "GitHub", class: "synced" },
            local: { icon: "fas fa-database", text: "Local", class: "local" },
            error: {
              icon: "fas fa-exclamation-triangle",
              text: "Error",
              class: "error",
            },
          };

          const config = statusConfig[status] || statusConfig.error;
          statusEl.className = `sync-status ${config.class}`;
          statusEl.innerHTML = `<i class="${config.icon}"></i> ${config.text}`;
        }
      }

      function showNotification(message, type = "success") {
        const notification = document.createElement("div");
        notification.style.cssText = `
                  position: fixed; top: 20px; right: 20px; padding: 12px 20px;
                  background: ${
                    type === "success"
                      ? "#38a169"
                      : type === "error"
                      ? "#e53e3e"
                      : "#4299e1"
                  };
                  color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  z-index: 3000; font-weight: 600; font-size: 14px; max-width: 300px;
                  animation: slideIn 0.3s ease;
              `;
        notification.innerHTML = `<i class="fas fa-${
          type === "success" ? "check" : type === "error" ? "times" : "info"
        }-circle"></i> ${message}`;

        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.animation = "slideOut 0.3s ease";
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }

      function showLoading() {
        document.getElementById("loadingOverlay").classList.add("active");
      }

      function hideLoading() {
        document.getElementById("loadingOverlay").classList.remove("active");
      }

      // ========================================
      // CRUD OPERATIONS
      // ========================================

      async function createSale(saleData) {
        const sale = {
          id: generateSaleId(),
          ...saleData,
          total: saleData.cash + saleData.upi,
          created_by: currentUser.username,
          created_by_name: currentUser.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        salesData.unshift(sale);
        await saveToGitHub();

        renderSalesTable();
        updateDashboard();

        showNotification(`Sale ${sale.id} created successfully!`, "success");
        return sale;
      }

      async function createExpense(expenseData) {
        const expense = {
          id: generateExpenseId(),
          date: expenseData.date,
          business: expenseData.business,
          purpose: expenseData.purpose,
          amount: expenseData.amount,
          payment_method: expenseData.payment_method,
          image: expenseData.image || null,
          imageName: expenseData.imageName || null,
          created_by: currentUser.username,
          created_by_name: currentUser.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        expensesData.unshift(expense);
        await saveToGitHub();

        renderExpensesTable();
        updateDashboard();

        showNotification(
          `Expense ${expense.id} created successfully!`,
          "success"
        );
        return expense;
      }

      function readSale(id) {
        return salesData.find((sale) => sale.id === id);
      }

      function readExpense(id) {
        return expensesData.find((expense) => expense.id === id);
      }

      async function updateSale(id, updatedData) {
        const index = salesData.findIndex((sale) => sale.id === id);
        if (index === -1) {
          throw new Error("Sale not found");
        }

        salesData[index] = {
          ...salesData[index],
          ...updatedData,
          total: updatedData.cash + updatedData.upi,
          updated_at: new Date().toISOString(),
        };

        await saveToGitHub();
        renderSalesTable();
        updateDashboard();

        showNotification(`Sale ${id} updated successfully!`, "success");
        return salesData[index];
      }

      async function updateExpense(id, updatedData) {
        const index = expensesData.findIndex((expense) => expense.id === id);
        if (index === -1) {
          throw new Error("Expense not found");
        }

        expensesData[index] = {
          ...expensesData[index],
          ...updatedData,
          updated_at: new Date().toISOString(),
        };

        await saveToGitHub();
        renderExpensesTable();
        updateDashboard();

        showNotification(`Expense ${id} updated successfully!`, "success");
        return expensesData[index];
      }

      async function deleteSale(id) {
        const index = salesData.findIndex((sale) => sale.id === id);
        if (index === -1) {
          showNotification("Sale not found!", "error");
          return;
        }

        const deletedSale = salesData.splice(index, 1)[0];

        showLoading();
        try {
          await saveToGitHub();
          renderSalesTable();
          updateDashboard();
          showNotification(`Sale ${id} deleted successfully!`, "success");
        } catch (error) {
          salesData.splice(index, 0, deletedSale);
          renderSalesTable();
          showNotification("Failed to delete sale", "error");
        } finally {
          hideLoading();
        }
      }

      async function deleteExpense(id) {
        const index = expensesData.findIndex((expense) => expense.id === id);
        if (index === -1) {
          showNotification("Expense not found!", "error");
          return;
        }

        const deletedExpense = expensesData.splice(index, 1)[0];

        showLoading();
        try {
          await saveToGitHub();
          renderExpensesTable();
          updateDashboard();
          showNotification(`Expense ${id} deleted successfully!`, "success");
        } catch (error) {
          expensesData.splice(index, 0, deletedExpense);
          renderExpensesTable();
          showNotification("Failed to delete expense", "error");
        } finally {
          hideLoading();
        }
      }

      // ========================================
      // EDIT FUNCTIONS
      // ========================================

      function editSale(id) {
        const sale = readSale(id);
        if (!sale) {
          showNotification("Sale not found", "error");
          return;
        }

        currentEditingItem = { type: "sale", id: id };

        document.getElementById("saleDate").value = sale.date;
        document.getElementById("saleBusiness").value = sale.business;
        document.getElementById("saleCash").value = sale.cash;
        document.getElementById("saleUPI").value = sale.upi;
        document.getElementById("saleTotal").value = sale.total;

        document.querySelector("#salesModal .modal-header h4").innerHTML =
          '<i class="fas fa-edit"></i> Edit Sale';
        showSalesForm();
      }

      function editExpense(id) {
        const expense = readExpense(id);
        if (!expense) {
          showNotification("Expense not found", "error");
          return;
        }

        currentEditingItem = { type: "expense", id: id };

        document.getElementById("expenseDate").value = expense.date;
        document.getElementById("expenseBusiness").value = expense.business;
        document.getElementById("expensePurpose").value = expense.purpose;
        document.getElementById("expenseAmount").value = expense.amount;
        document.getElementById("expensePaymentMethod").value =
          expense.payment_method;

        // Handle existing image
        if (expense.image) {
          currentImageData = expense.image;
          currentImageName = expense.imageName;

          const previewImg = document.getElementById("previewImg");
          const imagePreview = document.getElementById("imagePreview");
          const imageInfo = document.getElementById("imageInfo");

          if (previewImg && imagePreview) {
            previewImg.src = expense.image;
            if (imageInfo) {
              imageInfo.textContent =
                expense.imageName || "Existing receipt image";
            }
            imagePreview.style.display = "block";
          }
        }

        document.querySelector("#expensesModal .modal-header h4").innerHTML =
          '<i class="fas fa-edit"></i> Edit Expense';
        showExpensesForm();
      }

      // ========================================
      // SEARCH AND FILTER FUNCTIONS
      // ========================================

      function applyFilters() {
        currentFilters = {
          salesSearch:
            document.getElementById("salesSearch")?.value.toLowerCase() || "",
          salesDateFrom: document.getElementById("salesDateFrom")?.value || "",
          salesDateTo: document.getElementById("salesDateTo")?.value || "",
          expensesSearch:
            document.getElementById("expensesSearch")?.value.toLowerCase() ||
            "",
          expensesDateFrom:
            document.getElementById("expensesDateFrom")?.value || "",
          expensesDateTo:
            document.getElementById("expensesDateTo")?.value || "",
        };

        renderSalesTable();
        renderExpensesTable();
      }

      function clearFilters() {
        // Clear sales filters
        if (document.getElementById("salesSearch"))
          document.getElementById("salesSearch").value = "";
        if (document.getElementById("salesDateFrom"))
          document.getElementById("salesDateFrom").value = "";
        if (document.getElementById("salesDateTo"))
          document.getElementById("salesDateTo").value = "";

        // Clear expenses filters
        if (document.getElementById("expensesSearch"))
          document.getElementById("expensesSearch").value = "";
        if (document.getElementById("expensesDateFrom"))
          document.getElementById("expensesDateFrom").value = "";
        if (document.getElementById("expensesDateTo"))
          document.getElementById("expensesDateTo").value = "";

        // Reset filters object
        currentFilters = {
          salesSearch: "",
          salesDateFrom: "",
          salesDateTo: "",
          expensesSearch: "",
          expensesDateFrom: "",
          expensesDateTo: "",
        };

        renderSalesTable();
        renderExpensesTable();
      }

      function filterSalesData() {
        let filtered = [...salesData];

        // Apply search filter
        if (currentFilters.salesSearch) {
          filtered = filtered.filter(
            (sale) =>
              sale.id.toLowerCase().includes(currentFilters.salesSearch) ||
              sale.business
                .toLowerCase()
                .includes(currentFilters.salesSearch) ||
              (sale.created_by_name &&
                sale.created_by_name
                  .toLowerCase()
                  .includes(currentFilters.salesSearch))
          );
        }

        // Apply date filters
        if (currentFilters.salesDateFrom) {
          filtered = filtered.filter(
            (sale) => sale.date >= currentFilters.salesDateFrom
          );
        }
        if (currentFilters.salesDateTo) {
          filtered = filtered.filter(
            (sale) => sale.date <= currentFilters.salesDateTo
          );
        }

        return filtered;
      }

      function filterExpensesData() {
        let filtered = [...expensesData];

        // Apply search filter
        if (currentFilters.expensesSearch) {
          filtered = filtered.filter(
            (expense) =>
              expense.id
                .toLowerCase()
                .includes(currentFilters.expensesSearch) ||
              expense.business
                .toLowerCase()
                .includes(currentFilters.expensesSearch) ||
              expense.purpose
                .toLowerCase()
                .includes(currentFilters.expensesSearch) ||
              (expense.created_by_name &&
                expense.created_by_name
                  .toLowerCase()
                  .includes(currentFilters.expensesSearch))
          );
        }

        // Apply date filters
        if (currentFilters.expensesDateFrom) {
          filtered = filtered.filter(
            (expense) => expense.date >= currentFilters.expensesDateFrom
          );
        }
        if (currentFilters.expensesDateTo) {
          filtered = filtered.filter(
            (expense) => expense.date <= currentFilters.expensesDateTo
          );
        }

        return filtered;
      }

      // ========================================
      // FORM HANDLING
      // ========================================

      async function submitSale() {
        const saleData = {
          date: document.getElementById("saleDate").value,
          business: document.getElementById("saleBusiness").value,
          cash: parseFloat(document.getElementById("saleCash").value) || 0,
          upi: parseFloat(document.getElementById("saleUPI").value) || 0,
        };

        if (!saleData.business) {
          showNotification("Please select a business", "error");
          return;
        }
        if (saleData.cash === 0 && saleData.upi === 0) {
          showNotification("Please enter at least one payment amount", "error");
          return;
        }

        showLoading();

        try {
          if (currentEditingItem && currentEditingItem.type === "sale") {
            await updateSale(currentEditingItem.id, saleData);
          } else {
            await createSale(saleData);
          }

          closeSalesModal();
          resetSalesForm();
        } catch (error) {
          showNotification("Failed to save sale: " + error.message, "error");
        } finally {
          hideLoading();
          currentEditingItem = null;
        }
      }

      async function submitExpense() {
        const expenseData = {
          date: document.getElementById("expenseDate").value,
          business: document.getElementById("expenseBusiness").value,
          purpose: document.getElementById("expensePurpose").value.trim(),
          amount:
            parseFloat(document.getElementById("expenseAmount").value) || 0,
          payment_method: document.getElementById("expensePaymentMethod").value,
          image: currentImageData,
          imageName: currentImageName,
        };

        if (
          !expenseData.business ||
          !expenseData.purpose ||
          expenseData.amount <= 0
        ) {
          showNotification("Please fill all required fields", "error");
          return;
        }

        showLoading();

        try {
          if (currentEditingItem && currentEditingItem.type === "expense") {
            await updateExpense(currentEditingItem.id, expenseData);
          } else {
            await createExpense(expenseData);
          }

          closeExpensesModal();
          resetExpensesForm();
        } catch (error) {
          showNotification("Failed to save expense: " + error.message, "error");
        } finally {
          hideLoading();
          currentEditingItem = null;
        }
      }

      // ========================================
      // TABLE RENDERING
      // ========================================

      function renderSalesTable() {
        const tbody = document.getElementById("salesTableBody");
        const filteredSales = filterSalesData();

        if (!filteredSales.length) {
          tbody.innerHTML =
            '<tr><td colspan="8" class="loading">No sales found</td></tr>';
          return;
        }

        tbody.innerHTML = filteredSales
          .map(
            (sale) => `
              <tr>
                  <td><strong>${sale.id}</strong></td>
                  <td>${formatDate(sale.date)}</td>
                  <td><span class="badge">${sale.business}</span></td>
                  <td class="status-positive">₹${formatNumber(
                    sale.cash || 0
                  )}</td>
                  <td class="status-positive">₹${formatNumber(
                    sale.upi || 0
                  )}</td>
                  <td><strong>₹${formatNumber(sale.total || 0)}</strong></td>
                  <td>
                      <span class="user-badge">${
                        sale.created_by_name || sale.created_by || "Unknown"
                      }</span>
                  </td>
                  <td>
                      <div style="display: flex; gap: 5px;">
                          <button type="button" class="btn btn-primary" onclick="editSale('${
                            sale.id
                          }')" style="padding: 4px 8px; font-size: 12px;" title="Edit Sale">
                              <i class="fas fa-edit"></i>
                          </button>
                          <button type="button" class="btn btn-danger" data-action="delete-sale" data-id="${
                            sale.id
                          }" style="padding: 4px 8px; font-size: 12px;" title="Delete Sale">
                              <i class="fas fa-trash"></i>
                          </button>
                      </div>
                  </td>
              </tr>
          `
          )
          .join("");
      }

      function renderExpensesTable() {
        const tbody = document.getElementById("expensesTableBody");
        const filteredExpenses = filterExpensesData();

        if (!filteredExpenses.length) {
          tbody.innerHTML =
            '<tr><td colspan="8" class="loading">No expenses found</td></tr>';
          return;
        }

        tbody.innerHTML = filteredExpenses
          .map(
            (expense) => `
            <tr>
                <td><strong>${expense.id}</strong></td>
                <td>${formatDate(expense.date)}</td>
                <td><span class="badge">${expense.business}</span></td>
                <td>
                    ${expense.purpose}
                    ${
                      expense.image
                        ? '<br><i class="fas fa-image" style="color: #4299e1; font-size: 12px;" title="Has receipt image"></i>'
                        : ""
                    }
                </td>
                <td class="status-negative"><strong>₹${formatNumber(
                  expense.amount || 0
                )}</strong></td>
                <td><span class="badge">${expense.payment_method}</span></td>
                <td>
                    <span class="user-badge">${
                      expense.created_by_name || expense.created_by || "Unknown"
                    }</span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${
                          expense.image
                            ? `
                            <button type="button" class="btn btn-secondary" onclick="viewExpenseImage('${expense.id}')" style="padding: 4px 8px; font-size: 12px;" title="View Receipt">
                                <i class="fas fa-eye"></i>
                            </button>
                        `
                            : ""
                        }
                        <button type="button" class="btn btn-primary" onclick="editExpense('${
                          expense.id
                        }')" style="padding: 4px 8px; font-size: 12px;" title="Edit Expense">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger" data-action="delete-expense" data-id="${
                          expense.id
                        }" style="padding: 4px 8px; font-size: 12px;" title="Delete Expense">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
          )
          .join("");
      }

      // ========================================
      // DASHBOARD FUNCTIONS
      // ========================================

      function updateDashboard() {
        const business = document.getElementById("businessFilter").value;
        const period = document.getElementById("periodFilter").value;

        const filteredSales = filterDataByPeriodAndBusiness(
          salesData,
          period,
          business
        );
        const filteredExpenses = filterDataByPeriodAndBusiness(
          expensesData,
          period,
          business
        );

        const totals = calculateTotals(filteredSales, filteredExpenses);
        displayTotals(totals);
      }

      function filterDataByPeriodAndBusiness(data, period, business) {
        let filtered = [...data];
        if (business) {
          filtered = filtered.filter((e) => e.business === business);
        }

        const now = new Date();
        let startDate;

        switch (period) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "last-month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            return filtered.filter((e) => {
              const itemDate = new Date(e.date);
              return itemDate >= startDate && itemDate <= endDate;
            });
          case "quarter":
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case "all":
            return filtered;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return filtered.filter((e) => new Date(e.date) >= startDate);
      }

function calculateTotals(sales, expenses) {
  const salesCash = sales.reduce((a, s) => a + (s.cash || 0), 0);
  const salesUpi = sales.reduce((a, s) => a + (s.upi || 0), 0);
  const salesTotal = salesCash + salesUpi;

  const expensesCash = expenses
    .filter((e) => (e.payment_method || "").toLowerCase() === "cash")
    .reduce((a, e) => a + (e.amount || 0), 0);
  const expensesUpi = expenses
    .filter((e) => (e.payment_method || "").toLowerCase() === "upi")
    .reduce((a, e) => a + (e.amount || 0), 0);
  const expensesTotal = expensesCash + expensesUpi;

  // Include default starting amounts
  const totalCashInHand = DEFAULT_INITIAL_CASH + salesCash - expensesCash;
  const totalUpiInHand = DEFAULT_INITIAL_UPI + salesUpi - expensesUpi;

  const profit = salesTotal - expensesTotal;
  const profitMargin = salesTotal === 0 ? 0 : (profit / salesTotal) * 100;

  return {
    cashInHand: totalCashInHand,
    upiInHand: totalUpiInHand,
    salesTotal,
    expensesTotal,
    profit,
    profitMargin,
    salesCount: sales.length,
    expensesCount: expenses.length,
    salesCash,
    salesUpi,
    expensesCash,
    expensesUpi,
  };
}

      function displayTotals(totals) {
        document.getElementById("totalCash").textContent = formatCurrency(
          totals.cashInHand
        );
        document.getElementById("totalCash").className =
          totals.cashInHand >= 0 ? "status-positive" : "status-negative";
        document.getElementById(
          "cashBreakdown"
        ).textContent = `Collected: ${formatCurrency(
          totals.salesCash
        )} | Spent: ${formatCurrency(totals.expensesCash)}`;

        document.getElementById("totalUPI").textContent = formatCurrency(
          totals.upiInHand
        );
        document.getElementById("totalUPI").className =
          totals.upiInHand >= 0 ? "status-positive" : "status-negative";
        document.getElementById(
          "upiBreakdown"
        ).textContent = `Collected: ${formatCurrency(
          totals.salesUpi
        )} | Spent: ${formatCurrency(totals.expensesUpi)}`;

        document.getElementById("totalSales").textContent = formatCurrency(
          totals.salesTotal
        );
        document.getElementById(
          "salesCount"
        ).textContent = `${totals.salesCount} transactions`;

        document.getElementById("totalExpenses").textContent = formatCurrency(
          totals.expensesTotal
        );
        document.getElementById(
          "expensesCount"
        ).textContent = `${totals.expensesCount} transactions`;

        document.getElementById("netProfit").textContent = formatCurrency(
          totals.profit
        );
        document.getElementById("netProfit").className =
          totals.profit >= 0 ? "status-positive" : "status-negative";
        document.getElementById(
          "profitMargin"
        ).textContent = `${totals.profitMargin.toFixed(1)}% margin`;
      }

      // ========================================
      // GLOBAL FUNCTIONS
      // ========================================

      window.showTab = function (tabName) {
        document
          .querySelectorAll(".tab-content")
          .forEach((el) => el.classList.remove("active"));
        document
          .querySelectorAll(".nav-tab")
          .forEach((btn) => btn.classList.remove("active"));
        document.getElementById(tabName + "Tab").classList.add("active");
        document
          .querySelector(`[onclick="showTab('${tabName}')"]`)
          .classList.add("active");

        if (tabName === "dashboard") {
          updateDashboard();
        }
      };

      window.refreshData = function () {
        loadFromGitHub();
      };
      window.showSalesForm = function () {
        document.getElementById("salesModal").classList.add("active");
        document.body.style.overflow = "hidden";
      };
      window.closeSalesModal = function () {
        document.getElementById("salesModal").classList.remove("active");
        document.body.style.overflow = "";
        currentEditingItem = null;
        document.querySelector("#salesModal .modal-header h4").innerHTML =
          '<i class="fas fa-plus-circle"></i> Add New Sale';
      };
      window.showExpensesForm = function () {
        document.getElementById("expensesModal").classList.add("active");
        document.body.style.overflow = "hidden";
      };
      window.closeExpensesModal = function () {
        document.getElementById("expensesModal").classList.remove("active");
        document.body.style.overflow = "";
        currentEditingItem = null;

        // Reset image data
        currentImageData = null;
        currentImageName = null;

        // Hide image preview
        const imagePreview = document.getElementById("imagePreview");
        if (imagePreview) {
          imagePreview.style.display = "none";
        }

        // Clear file input
        const imageInput = document.getElementById("expenseImage");
        if (imageInput) {
          imageInput.value = "";
        }

        document.querySelector("#expensesModal .modal-header h4").innerHTML =
          '<i class="fas fa-plus-circle"></i> Add New Expense';
      };
      window.updateDashboard = updateDashboard;
      window.editSale = editSale;
      window.editExpense = editExpense;
      window.applyFilters = applyFilters;
      window.clearFilters = clearFilters;
      window.logout = logout;

      // ========================================
      // UTILITY FUNCTIONS
      // ========================================

      function resetSalesForm() {
        document.getElementById("salesForm").reset();
        document.getElementById("saleDate").value = new Date()
          .toISOString()
          .slice(0, 10);
        document.getElementById("saleCash").value = "0";
        document.getElementById("saleUPI").value = "0";
        document.getElementById("saleTotal").value = "0.00";
      }

      function resetExpensesForm() {
        document.getElementById("expensesForm").reset();
        document.getElementById("expenseDate").value = new Date()
          .toISOString()
          .slice(0, 10);

        // Reset image data
        currentImageData = null;
        currentImageName = null;

        // Hide image preview
        const imagePreview = document.getElementById("imagePreview");
        if (imagePreview) {
          imagePreview.style.display = "none";
        }
      }

      function formatCurrency(value) {
        return `₹${formatNumber(value)}`;
      }

      function formatNumber(value) {
        return Number(value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
      }

      function formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-IN");
      }

      function formatDateTime(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString("en-IN", {
          year: "2-digit",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      function setupAutoCalculation() {
        const cashInput = document.getElementById("saleCash");
        const upiInput = document.getElementById("saleUPI");
        const totalInput = document.getElementById("saleTotal");

        function calculate() {
          const cash = parseFloat(cashInput.value) || 0;
          const upi = parseFloat(upiInput.value) || 0;
          totalInput.value = (cash + upi).toFixed(2);
        }

        cashInput.addEventListener("input", calculate);
        upiInput.addEventListener("input", calculate);
        calculate();
      }

      function setupFormHandlers() {
        document
          .getElementById("salesForm")
          .addEventListener("submit", function (e) {
            e.preventDefault();
            submitSale();
          });

        document
          .getElementById("expensesForm")
          .addEventListener("submit", function (e) {
            e.preventDefault();
            submitExpense();
          });
      }

      // ========================================
      // APP INITIALIZATION
      // ========================================

function initializeApp() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("saleDate").value = today;
    document.getElementById("expenseDate").value = today;

    // Securely load GitHub credentials from localStorage, if available
    let githubToken = localStorage.getItem("business_tracker_token");
    let gistId = localStorage.getItem("business_tracker_gist_id");

    // Setup sync URLs if credentials exist
    if (githubToken && gistId) {
        GITHUB_TOKEN = githubToken;
        GIST_ID = gistId;
        GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
        GIST_RAW_URL = `https://gist.githubusercontent.com/krishnarajdevr/${GIST_ID}/raw/business-data.json`;
    }

    // Decide sync mode (GitHub or local)
    if (!GITHUB_TOKEN || !GIST_ID) {
        setSyncStatus("local");
        loadFromLocalStorage();
    } else {
        loadFromGitHub();
    }

    setupFormHandlers();
    setupAutoCalculation();

    // Auto-sync with GitHub every 30 seconds (if online and token is ready)
    setInterval(() => {
        if (isOnline && GITHUB_TOKEN && GIST_ID) {
            loadFromGitHub();
        }
    }, 30000);

    // Handle online/offline state changes
    window.addEventListener("online", () => {
        isOnline = true;
        if (GITHUB_TOKEN && GIST_ID) {
            saveToGitHub();
        }
    });

    window.addEventListener("offline", () => {
        isOnline = false;
        setSyncStatus("local");
    });

    // Modal: close when clicking outside
    window.addEventListener("click", function (e) {
        if (e.target.classList.contains("modal")) {
            if (e.target.id === "salesModal") closeSalesModal();
            else if (e.target.id === "expensesModal") closeExpensesModal();
            else if (e.target.id === "imageViewerModal") closeImageViewer();
            else if (e.target.id === "githubSettingsModal") closeGitHubSettings();
        }
    });

    // Data table delete button delegation
    document.addEventListener("click", function (e) {
        const button = e.target.closest("button[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === "delete-sale") {
            e.preventDefault();
            if (confirm(`Delete sale ${id}? This cannot be undone.`)) {
                deleteSale(id);
            }
        } else if (action === "delete-expense") {
            e.preventDefault();
            if (confirm(`Delete expense ${id}? This cannot be undone.`)) {
                deleteExpense(id);
            }
        }
    });

    // OPTIONAL: Load initial balance or other one-time settings here
    if (typeof loadInitialBalance === "function") loadInitialBalance();
}

      // ========================================
      // START APPLICATION
      // ========================================

      document.addEventListener("DOMContentLoaded", function () {
        if (checkAuth()) {
          initializeApp();
        }
      });

