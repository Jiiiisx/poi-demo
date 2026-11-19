const CLIENT_ID = 'DEMO_CLIENT_ID';
let currentIdToken = null;
let currentUserEmail = null;

const ErrorHandler = {
  log: () => {},
  handleError: () => {}
};

function getDemoUser() {
  if (window.DEMO_CONFIG && window.DEMO_CONFIG.DEMO_USER) {
    return window.DEMO_CONFIG.DEMO_USER;
  }
  return {
    email: 'demo.sales@nusantarafiber.demo',
    name: 'Demo Sales',
    picture: '',
    token: 'demo-sales-token'
  };
}

function initializeGsi() {
  // Google Sign-In dinonaktifkan pada mode Live Demo
}

function enterDemoSession() {
  const demoUser = getDemoUser();
  localStorage.setItem('userInfo', JSON.stringify(demoUser));
  localStorage.setItem('isLoggedIn', 'true');
  currentIdToken = demoUser.token;
  currentUserEmail = demoUser.email;
  window.currentUserEmail = currentUserEmail;
  updateSigninStatus(true, demoUser.name, demoUser.picture);
}

window.handleCredentialResponse = function() {
  enterDemoSession();
};

function checkNetworkSpeed() {
    try {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            const effectiveType = connection.effectiveType;
            const saveData = connection.saveData;

            if (saveData || effectiveType.includes('2g')) {
                NotificationHandler.show('Koneksi internet Anda lambat. Beberapa fitur mungkin tidak berfungsi dengan baik.', 'warning');
            }
        }
    } catch (error) {
        ErrorHandler.handleError(error, 'checkNetworkSpeed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const demoSignInBtn = document.getElementById('demoSignInBtn');
  if (demoSignInBtn) {
    demoSignInBtn.addEventListener('click', () => {
      enterDemoSession();
    });
  }

  document.querySelectorAll('.demo-reset-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof ModalHandler !== 'undefined' && ModalHandler.show) {
        ModalHandler.show(
          'Reset Data Demo',
          'Kembalikan semua data POI dan monitoring ke data dummy awal?',
          () => {
            if (window.DemoStore && typeof window.DemoStore.reset === 'function') {
              window.DemoStore.reset();
            }
            window.location.reload();
          }
        );
      } else if (window.DemoStore) {
        window.DemoStore.reset();
        window.location.reload();
      }
    });
  });

  checkNetworkSpeed();
});

function handleSignoutClick() {
  try {
    currentIdToken = null;
    currentUserEmail = null;
    updateSigninStatus(false);
    sessionStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('id_token');
    localStorage.removeItem('accessToken');
    ErrorHandler.log("User signed out");
  } catch (error) {
    ErrorHandler.handleError(error, 'handleSignoutClick');
  }
};

function revealDemoDashboard(skeletonLoader, mainContent, startTime) {
  const MIN_LOADING_TIME = 0;
  const elapsedTime = Date.now() - startTime;
  const timeToWait = Math.max(0, MIN_LOADING_TIME - elapsedTime);

  setTimeout(() => {
    if (skeletonLoader) {
      skeletonLoader.style.display = 'none';
    }
    mainContent.style.display = 'block';
    if (typeof playDashboardEntranceAnimation === 'function') {
      playDashboardEntranceAnimation();
    }
  }, timeToWait);
}

function updateSigninStatus(isSignedIn, userName = '', userPicture = '') {
  try {
    ErrorHandler.log(`Updating sign-in status: ${isSignedIn}`);
    const signInWrapper = document.querySelector('.sign-in');
    const mainContent = document.getElementById('main-content');
    const signOutButton = document.getElementById('sign-out-button');
    const wavyLines = document.querySelector('.wavy-lines');
    const userProfileDisplayElement = document.getElementById('userProfileDisplayElement');

    if (!signInWrapper || !mainContent || !signOutButton) {
      ErrorHandler.log('Required DOM elements not found for sign-in status update');
      return;
    }

    if (isSignedIn) {
      const startTime = Date.now();

      signInWrapper.style.display = 'none';
      const skeletonLoader = document.getElementById('skeleton-loader');
      if (skeletonLoader) {
          skeletonLoader.style.display = 'flex';
          playSkeletonBuildUpAnimation();
      }
      mainContent.style.display = 'none';
      signOutButton.style.display = 'block';

      if (userProfileDisplayElement) {
          const profilePictureElement = document.getElementById('userProfilePicture');
          const profileNameElement = document.getElementById('userProfileName');
          if (profilePictureElement && profileNameElement) {
              profilePictureElement.src = userPicture;
              profileNameElement.textContent = userName;
              updateWelcomeMessage(userName);
          }
          userProfileDisplayElement.style.display = 'block';
      }
      
      if (wavyLines) {
        wavyLines.style.display = 'none';
      }

      const runSetup = () => {
        if (!window.googleSheetsIntegration) return;
        window.googleSheetsIntegration.setup().then(() => {
          revealDemoDashboard(skeletonLoader, mainContent, startTime);
        }).catch(() => {
          if (skeletonLoader) skeletonLoader.style.display = 'none';
          mainContent.style.display = 'block';
        });
      };

      if (window.googleSheetsIntegration) {
        runSetup();
      } else {
        document.addEventListener('googleSheetsIntegrationReady', runSetup, { once: true });
      }
      
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      signInWrapper.style.display = 'flex';
      mainContent.style.display = 'none';
      signOutButton.style.display = 'none';
      
      if (userProfileDisplayElement) {
          userProfileDisplayElement.style.display = 'none';
      }
      
      if (wavyLines) {
        wavyLines.style.display = 'block';
      }
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'updateSigninStatus');
  }
};

function safeRefreshData() {
  if (typeof window.googleSheetsIntegration !== 'undefined' && typeof window.googleSheetsIntegration.refreshData === 'function') {
    window.googleSheetsIntegration.refreshData().then(() => {
      populateSalesDropdown();
    });
  }
}

function closeEditModal() {
  try {
    const editModal = document.getElementById('editModal');
    if (editModal) {
      editModal.style.display = 'none';
      editModal.classList.remove('show');
      
      const editForm = document.getElementById('editForm');
      if (editForm) {
        editForm.reset();
      }
      
      const errorDisplay = document.getElementById('errorDisplay');
      if (errorDisplay) {
        errorDisplay.style.display = 'none';
      }
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'closeEditModal');
  }
}

function closeViewHistoryModal() {
  try {
    const viewHistoryModal = document.getElementById('viewHistoryModal');
    if (viewHistoryModal) {
      viewHistoryModal.style.display = 'none';
      viewHistoryModal.classList.remove('show');
      
      const historyError = document.getElementById('historyError');
      if (historyError) {
        historyError.style.display = 'none';
      }
      const historyTableBody = document.getElementById('historyTableBody');
      if (historyTableBody) {
        historyTableBody.innerHTML = '';
      }
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'closeViewHistoryModal');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  try {
    ErrorHandler.log('DOM Content Loaded - Initializing application...');
    
    const requiredElements = ['sign-in-container', 'main-content', 'errorDisplay'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      ErrorHandler.log(`Missing elements: ${missingElements.join(', ')}`);
      return;
    }
    
    // Bypass login automatically in Live Demo mode
    enterDemoSession();
    
    initializeUIComponents();

    checkNetworkSpeed();

    const customerTableBody = document.querySelector('#customerTable tbody');
    if (customerTableBody) {
        customerTableBody.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.btn-toggle-details');
            if (toggleBtn) {
                const cardRow = toggleBtn.closest('tr');
                if (cardRow) {
                    cardRow.classList.toggle('details-expanded');
                }
            }
        });
    }

    const govFilterBtn = document.getElementById('btnTableShowGoverment');
    const allFilterBtn = document.getElementById('btnTableShowAll');
    const schoolFilterBtn = document.getElementById('btnTableShowSchool');
    const nonSchoolFilterBtn = document.getElementById('btnTableShowNonSchool');
    const dashboardTutorialLink = document.getElementById('dashboard-tutorial-link');
    const dashboardTutorialModal = document.getElementById('dashboard-tutorial-modal');
    const dashboardTutorialClose = document.getElementById('dashboard-tutorial-close');
    const dashboardTutorialSidebarLinks = document.querySelectorAll('.dashboard-tutorial-trigger');

    if (dashboardTutorialLink && dashboardTutorialModal && dashboardTutorialClose) {
        dashboardTutorialLink.addEventListener('click', (e) => {
            e.preventDefault();
            dashboardTutorialModal.style.display = 'block';
        });

        dashboardTutorialSidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                dashboardTutorialModal.style.display = 'block';
            });
        });

        dashboardTutorialClose.addEventListener('click', () => {
            dashboardTutorialModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target == dashboardTutorialModal) {
                dashboardTutorialModal.style.display = 'none';
            }
        });
    }

    function setActiveFilterButton(activeBtn) {
      [allFilterBtn, schoolFilterBtn, nonSchoolFilterBtn, govFilterBtn].forEach(btn => {
        if (btn) {
          btn.classList.remove('active');
        }
      });
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }

    if (govFilterBtn) {
      govFilterBtn.addEventListener('click', () => {
        if (window.googleSheetsIntegration) {
          window.googleSheetsIntegration.currentDataView = 'government';
          window.googleSheetsIntegration.governmentCurrentPage = 1;
          window.googleSheetsIntegration.applyCombinedFilters();
          window.googleSheetsIntegration.renderPaginationControls();
          setActiveFilterButton(govFilterBtn);
        }
      });
    }

    if (allFilterBtn) {
      allFilterBtn.addEventListener('click', () => {
        if (window.googleSheetsIntegration) {
          window.googleSheetsIntegration.currentDataView = 'customer';
          window.googleSheetsIntegration.currentSchoolFilter = 'all';
          window.googleSheetsIntegration.currentPage = 1;
          window.googleSheetsIntegration.applyCombinedFilters();
          window.googleSheetsIntegration.renderPaginationControls();
          setActiveFilterButton(allFilterBtn);
        }
      });
    }

    if (schoolFilterBtn) {
      schoolFilterBtn.addEventListener('click', () => {
        if (window.googleSheetsIntegration) {
          window.googleSheetsIntegration.currentDataView = 'customer';
          window.googleSheetsIntegration.currentSchoolFilter = 'school';
          window.googleSheetsIntegration.currentPage = 1;
          window.googleSheetsIntegration.applyCombinedFilters();
          window.googleSheetsIntegration.renderPaginationControls();
          setActiveFilterButton(schoolFilterBtn);
        }
      });
    }

    if (nonSchoolFilterBtn) {
      nonSchoolFilterBtn.addEventListener('click', () => {
        if (window.googleSheetsIntegration) {
          window.googleSheetsIntegration.currentDataView = 'customer';
          window.googleSheetsIntegration.currentSchoolFilter = 'nonSchool';
          window.googleSheetsIntegration.currentPage = 1;
          window.googleSheetsIntegration.applyCombinedFilters();
          window.googleSheetsIntegration.renderPaginationControls();
          setActiveFilterButton(nonSchoolFilterBtn);
        }
      });
    }

    document.addEventListener('salesViewChanged', (e) => {
        const salesName = e.detail.salesName;
        const chartSection = document.querySelector('.chart-section');

        if (!chartSection) return;

        if (salesName && salesName !== 'Home') {
            if (salesPerformanceChart) {
                salesPerformanceChart.destroy();
            }
            chartSection.style.display = 'none';
        } else {
            chartSection.style.display = 'block';
            if (typeof window.renderSalesPerformanceChart === 'function') {
                window.renderSalesPerformanceChart();
            }
        }
    });
    
  } catch (error) {
    ErrorHandler.handleError(error, 'DOMContentLoaded');
  }
});

function initializeUIComponents() {
  try {
    const addSalesModal = document.getElementById('addSalesModal');
    const openAddSalesBtn = document.getElementById('openAddSalesBtn');
    const closeAddSalesModal = document.getElementById('closeAddSalesModal');
    const cancelAddSalesBtn = document.getElementById('cancelAddSalesBtn');
    const editModal = document.getElementById('editModal');
    const toggleCustomerFormBtn = document.getElementById('toggle-customer-form');
    const addCustomerFormContainer = document.getElementById('add-customer-form-container');
    const overviewBtn = document.getElementById('overview-btn');

    const toggleForm = () => {
        const addCustomerSection = document.getElementById('add-customer-section');
        if (addCustomerSection) {
            const isVisible = addCustomerSection.style.display === 'block';
            addCustomerSection.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                resetAddCustomerForm();
                populateSalesDropdown();
                addCustomerSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    if (toggleCustomerFormBtn) {
      toggleCustomerFormBtn.addEventListener('click', toggleForm);
    }

    const fabAddCustomerBtn = document.getElementById('fab-add-customer');
    if (fabAddCustomerBtn) {
      fabAddCustomerBtn.addEventListener('click', toggleForm);
    }
    
    const closeFormBtn = document.getElementById('closeFormBtn');
    if (closeFormBtn) {
      closeFormBtn.addEventListener('click', () => {
        const addCustomerSection = document.getElementById('add-customer-section');
        if (addCustomerSection) {
          addCustomerSection.style.display = 'none';
          resetAddCustomerForm();
        }
      });
    }
    
    const cancelAddCustomerBtn = document.getElementById('cancelAddCustomer');
    if (cancelAddCustomerBtn) {
      cancelAddCustomerBtn.addEventListener('click', () => {
        const addCustomerSection = document.getElementById('add-customer-section');
        if (addCustomerSection) {
          addCustomerSection.style.display = 'none';
          resetAddCustomerForm();
        }
      });
    }
    
    initializeAddCustomerForm();

    populateSalesDropdown();

    if (openAddSalesBtn && addSalesModal) {
      openAddSalesBtn.addEventListener('click', () => {
        addSalesModal.classList.add('show');
      });
    }

    if(closeAddSalesModal && addSalesModal) {
      closeAddSalesModal.addEventListener('click', () => {
        addSalesModal.classList.remove('show');
      });
    }

    if (cancelAddSalesBtn && addSalesModal) {
      cancelAddSalesBtn.addEventListener('click', () => {
        addSalesModal.classList.remove('show');
      });
    }

    window.addEventListener('click', (event) => {
      const editGovModal = document.getElementById('editGovernmentModal');
      const viewHistoryModal = document.getElementById('viewHistoryModal');
      if (addSalesModal && event.target === addSalesModal) addSalesModal.classList.remove('show');
      if (editModal && event.target === editModal) closeEditModal();
      if (editGovModal && event.target === editGovModal) {
        editGovModal.style.display = 'none';
        editGovModal.classList.remove('show');
      }
      if (viewHistoryModal && event.target === viewHistoryModal) closeViewHistoryModal();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const currentEditModal = document.getElementById('editModal');
        const currentAddSalesModal = document.getElementById('addSalesModal');
        const editGovModal = document.getElementById('editGovernmentModal');
        const viewHistoryModal = document.getElementById('viewHistoryModal');

        if (currentEditModal && currentEditModal.classList.contains('show')) {
          closeEditModal();
        }
        if (editGovModal && editGovModal.classList.contains('show')) {
          editGovModal.style.display = 'none';
          editGovModal.classList.remove('show');
        }
        if (viewHistoryModal && viewHistoryModal.classList.contains('show')) {
          closeViewHistoryModal();
        }
        if (currentAddSalesModal && currentAddSalesModal.classList.contains('show')) {
          currentAddSalesModal.classList.remove('show');
        }
      }
    });

    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        googleSheetsIntegration.filterBySales('Home');
        document.querySelectorAll('.sales-item').forEach(i => i.classList.remove('active'));
        overviewBtn.classList.add('active');
      });
    }
    setupFormHandlers();
  } catch (error) {
    ErrorHandler.handleError(error, 'initializeUIComponents');
  }
};

function setupFormHandlers() {
  try {
    const addSalesForm = document.getElementById('addSalesForm');
    if (addSalesForm) {
      addSalesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const salesName = document.getElementById('salesName').value.trim();
        if (salesName) {
          ModalHandler.show('Info', 'Fitur tambah sales akan segera tersedia');
          document.getElementById('addSalesModal').classList.remove('show');
          addSalesForm.reset();
        }
      });
    }

    const editForm = document.getElementById('editForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        googleSheetsIntegration.saveEdit();
      });
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'setupFormHandlers');
  }
};

window.addEventListener('error', (event) => {
  if (event.message.includes('refreshData') && event.message.includes('undefined')) {
    return;
  }
  ErrorHandler.handleError(new Error(event.message), 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handleError(new Error(event.reason), 'Unhandled Promise Rejection');
});

function initializeAddCustomerForm() {
  try {
    const addCustomerForm = document.getElementById('addCustomerForm');
    const cancelAddCustomerBtn = document.getElementById('cancelAddCustomer');
    
    if (addCustomerForm) {
      addCustomerForm.addEventListener('submit', handleAddCustomerSubmit);
    }
    
    if (cancelAddCustomerBtn) {
      cancelAddCustomerBtn.addEventListener('click', () => {
        const addCustomerFormContainer = document.getElementById('add-customer-form-container');
        if (addCustomerFormContainer) {
          addCustomerFormContainer.style.display = 'none';
        }
        resetAddCustomerForm();
      });
    }
    
  } catch (error) {
    ErrorHandler.handleError(error, 'initializeAddCustomerForm');
  }
};



function populateSalesDropdown() {
  try {
    const salesSelect = document.getElementById('assignedSales');
    const editSalesSelect = document.getElementById('editSales');
    
    if (!salesSelect || salesSelect.tagName !== 'SELECT' || 
        !editSalesSelect || editSalesSelect.tagName !== 'SELECT') {
      return; 
    }
    
    salesSelect.innerHTML = '<option value="">Pilih Sales</option>';
    editSalesSelect.innerHTML = '<option value="">Pilih Sales</option>';
    
    const salesItems = document.querySelectorAll('.sales-list .sales-item');
    const namesFromSidebar = [];
    salesItems.forEach(item => {
      const salesName = item.dataset.salesName || item.textContent.trim();
      if (salesName && salesName !== 'Home') {
        namesFromSidebar.push(salesName);
      }
    });

    const fallbackNames = (window.DEMO_CONFIG && Array.isArray(window.DEMO_CONFIG.INTERNAL_SALES))
      ? window.DEMO_CONFIG.INTERNAL_SALES
      : [];
    const salesNames = namesFromSidebar.length > 0 ? namesFromSidebar : fallbackNames;

    salesNames.forEach(salesName => {
      const option1 = new Option(salesName, salesName);
      const option2 = new Option(salesName, salesName);
      salesSelect.add(option1);
      editSalesSelect.add(option2);
    });
    
  } catch (error) {
    ErrorHandler.handleError(error, 'populateSalesDropdown');
  }
};

async function handleAddCustomerSubmit(e) {
  e.preventDefault();

  if (!googleSheetsCRUD) {
    ModalHandler.show('Error', 'Google Sheets CRUD belum diinisialisasi. Silakan refresh halaman.');
    return;
  }
  
  try {
    const formData = new FormData(e.target);
    const customerData = Object.fromEntries(formData.entries());

    if (!customerData.nama || !customerData.no_telepon || !customerData.alamat || !customerData.odp_terdekat || !customerData.nama_sales) {
      ModalHandler.show('Error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    
    googleSheetsCRUD.validateCustomerData(customerData);
    
    const saveBtn = document.getElementById('saveCustomer');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveBtn.disabled = true;
    
    const customerDataForSheets = {
        odp_terdekat: customerData.odp_terdekat || '',
        nama: customerData.nama || '',
        alamat: customerData.alamat || '',
        no_telepon: customerData.no_telepon || '',
        nama_sales: customerData.nama_sales || '',
        visit: customerData.visit || 'Not Visited',
        status: customerData.status || 'Baru',
        keterangan_tambahan: customerData.keterangan || ''
    };
    
    await googleSheetsCRUD.addCustomer(customerDataForSheets);
    
    NotificationHandler.show('Calon pelanggan berhasil ditambahkan!', 'success');
    
    resetAddCustomerForm();
    const addCustomerSection = document.getElementById('add-customer-section');
    if (addCustomerSection) {
      addCustomerSection.style.display = 'none';
    }
    
    safeRefreshData();
    
  } catch (error) {
    ErrorHandler.handleError(error, 'handleAddCustomerSubmit');
  } finally {
    const saveBtn = document.getElementById('saveCustomer');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Calon Pelanggan';
    saveBtn.disabled = false;
  }
};

function resetAddCustomerForm() {
  try {
    const form = document.getElementById('addCustomerForm');
    if (form) {
      form.reset();
    }
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.classList.remove('error');
    });
    
  } catch (error) {
    ErrorHandler.handleError(error, 'resetAddCustomerForm');
  }
};

function signOut() {
    handleSignoutClick();
}

function displayCurrentDate() {
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('id-ID', options);
  }
}

function updateWelcomeMessage(userName) {
    const placeholder = document.getElementById('user-name-placeholder');
    if (placeholder && userName) {
        const firstName = userName.split(' ')[0];
        placeholder.textContent = firstName;
    }
}

document.addEventListener('DOMContentLoaded', displayCurrentDate);

function setupTabNavigation() {
    const tabContainer = document.querySelector('.tab-navigation');
    const contentGrid = document.querySelector('.content-grid');
    const monitoringSection = document.getElementById('monthlyMonitoringSection');
    const salesSummarySection = document.getElementById('salesSummarySection');

    if (!tabContainer || !contentGrid || !monitoringSection || !salesSummarySection) {
        return; 
    }

    tabContainer.style.display = 'none';

    window.switchToTab = (tabName) => {
        if (!tabContainer.querySelector(`[data-tab="${tabName}"]`)) return;

        tabContainer.querySelectorAll('.tab-link').forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tabName);
        });

        const chartSection = document.querySelector('.chart-section');

        if (tabName === 'pelanggan') {
            contentGrid.style.display = 'block';
            monitoringSection.style.display = 'none';
            salesSummarySection.style.display = 'none';
            if (chartSection) chartSection.style.display = 'none';
        } else if (tabName === 'monitoring') {
            contentGrid.style.display = 'none';
            monitoringSection.style.display = 'block';
            salesSummarySection.style.display = 'block';
            if (chartSection) chartSection.style.display = 'block';
        }
    };

    tabContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.tab-link');
        if (target && target.dataset.tab) {
            window.switchToTab(target.dataset.tab);
        }
    });

    window.switchToTab('pelanggan');
}

document.addEventListener('DOMContentLoaded', setupTabNavigation);
