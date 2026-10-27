/* =========================================================
   EduBridge LMS — script.js
   Generic modal / CRUD / toast / search-filter engine
========================================================= */

/* ---------------- Sidebar ---------------- */
function toggleSidebar(){
  var shell = document.querySelector('.app-shell');
  var sidebar = document.getElementById('sidebar');
  if (window.matchMedia('(max-width: 900px)').matches) {
    sidebar.classList.toggle('open');
    document.getElementById('overlayBackdrop').classList.toggle('show');
  } else {
    shell.classList.toggle('sidebar-collapsed');
    try { localStorage.setItem('edubridge-sidebar-collapsed', shell.classList.contains('sidebar-collapsed') ? '1' : '0'); } catch(e) {}
  }
}
document.addEventListener('DOMContentLoaded', function(){
  try {
    if (localStorage.getItem('edubridge-sidebar-collapsed') === '1' && !window.matchMedia('(max-width: 900px)').matches) {
      document.querySelector('.app-shell')?.classList.add('sidebar-collapsed');
    }
  } catch(e) {}
});
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlayBackdrop').classList.remove('show');
}

/* ---------------- User dropdown ---------------- */
function toggleUserMenu(e){
  e.stopPropagation();
  document.getElementById('userDropdown').classList.toggle('show');
}
document.addEventListener('click', function(){
  var dd = document.getElementById('userDropdown');
  if(dd) dd.classList.remove('show');
});

/* ---------------- Toasts ---------------- */
function showToast(message, type, title){
  type = type || 'success';
  title = title || (type === 'success' ? 'Success' : 'Error');
  var stack = document.getElementById('toastStack');
  if(!stack) return;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML =
    '<i class="fa-solid ' + icon + ' t-ic"></i>' +
    '<div class="t-body"><strong>' + title + '</strong><span>' + message + '</span></div>' +
    '<button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>';
  stack.appendChild(toast);
  setTimeout(function(){ if(toast.parentElement) toast.remove(); }, 4500);
}

/* Show flash-generated toasts on page load (server-side flash messages) */
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.flash-msg[data-toast="1"]').forEach(function(el){
    showToast(el.dataset.message, el.dataset.type === 'error' ? 'error' : 'success', el.dataset.type === 'error' ? 'Error' : 'Success');
  });
});

/* ---------------- Modal helpers ---------------- */
function openModal(id){
  var m = document.getElementById(id);
  if(m) m.classList.add('show');
}
function closeModal(id){
  var m = document.getElementById(id);
  if(m) m.classList.remove('show');
}
document.addEventListener('click', function(e){
  if(e.target.classList && e.target.classList.contains('modal-overlay')){
    e.target.classList.remove('show');
  }
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    document.querySelectorAll('.modal-overlay.show').forEach(function(m){ m.classList.remove('show'); });
  }
});

/* ---------------- Search / Filter (client side) ---------------- */
function filterTable(inputEl, tableId){
  var query = inputEl.value.toLowerCase().trim();
  var rows = document.querySelectorAll('#' + tableId + ' tbody tr[data-row]');
  var visible = 0;
  rows.forEach(function(row){
    var text = row.innerText.toLowerCase();
    var show = text.indexOf(query) !== -1 && rowPassesFilters(row);
    row.style.display = show ? '' : 'none';
    if(show) visible++;
  });
  toggleEmptyState(tableId, visible);
}

function applyFilters(tableId){
  var rows = document.querySelectorAll('#' + tableId + ' tbody tr[data-row]');
  var searchInput = document.querySelector('[data-search-for="' + tableId + '"]');
  var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  var visible = 0;
  rows.forEach(function(row){
    var text = row.innerText.toLowerCase();
    var show = text.indexOf(query) !== -1 && rowPassesFilters(row);
    row.style.display = show ? '' : 'none';
    if(show) visible++;
  });
  toggleEmptyState(tableId, visible);
}

function rowPassesFilters(row){
  var tableId = row.closest('table').id;
  var filters = document.querySelectorAll('[data-filter-for="' + tableId + '"]');
  for(var i = 0; i < filters.length; i++){
    var f = filters[i];
    var val = f.value;
    if(!val) continue;
    var field = f.dataset.field;
    if(row.dataset[field] !== val) return false;
  }
  return true;
}

function toggleEmptyState(tableId, visibleCount){
  var emptyRow = document.querySelector('#' + tableId + ' .empty-row');
  if(emptyRow) emptyRow.style.display = visibleCount === 0 ? '' : 'none';
}

/* ---------------- Generic AJAX CRUD ---------------- */
/**
 * entity: e.g. 'courses'
 * method: 'POST' (create) or 'PUT' (update)
 * formEl: the <form> element containing named inputs
 * itemId: required for PUT
 */
function submitEntityForm(entity, method, formEl, itemId, onSuccess){
  var formData = new FormData(formEl);
  var payload = {};
  formData.forEach(function(value, key){ payload[key] = value; });

  var url = '/api/data/' + entity + (method === 'PUT' ? '/' + itemId : '');
  var submitBtn = formEl.querySelector('[type="submit"]');
  if(submitBtn){ submitBtn.disabled = true; submitBtn.dataset.originalText = submitBtn.innerHTML; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

  fetch(url, {
    method: method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  })
  .then(function(res){ return res.json().then(function(data){ return {status: res.status, data: data}; }); })
  .then(function(result){
    if(result.status === 200 || result.status === 201){
      var successMessage = result.data.message || 'Saved successfully';
      if(result.data.item && result.data.item.temporary_password){
        successMessage += ' | Login username: ' + (result.data.item.portal_username || result.data.item.email || '') + ' | Default password: ' + result.data.item.temporary_password;
      }
      showToast(successMessage, 'success');
      if(onSuccess) onSuccess(result.data);
      setTimeout(function(){ window.location.reload(); }, result.data.item && result.data.item.temporary_password ? 3500 : 600);
    } else {
      showToast(result.data.error || 'Something went wrong', 'error');
    }
  })
  .catch(function(){
    showToast('Network error. Please try again.', 'error');
  })
  .finally(function(){
    if(submitBtn){ submitBtn.disabled = false; submitBtn.innerHTML = submitBtn.dataset.originalText; }
  });
}

var pendingDelete = { entity: null, id: null, label: null };

function confirmDelete(entity, id, label){
  pendingDelete = { entity: entity, id: id, label: label };
  var labelEl = document.getElementById('deleteItemLabel');
  if(labelEl) labelEl.innerText = label || 'this item';
  openModal('deleteModal');
}

function executeDelete(){
  if(!pendingDelete.entity || !pendingDelete.id) return;
  var btn = document.getElementById('confirmDeleteBtn');
  if(btn){ btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...'; }

  fetch('/api/data/' + pendingDelete.entity + '/' + pendingDelete.id, { method: 'DELETE' })
  .then(function(res){ return res.json().then(function(data){ return {status: res.status, data: data}; }); })
  .then(function(result){
    if(result.status === 200){
      showToast(result.data.message || 'Deleted successfully', 'success');
      var row = document.querySelector('tr[data-id="' + pendingDelete.id + '"][data-entity="' + pendingDelete.entity + '"]');
      if(row) row.remove();
      closeModal('deleteModal');
      setTimeout(function(){ window.location.reload(); }, 500);
    } else {
      showToast(result.data.error || 'Could not delete', 'error');
    }
  })
  .catch(function(){ showToast('Network error. Please try again.', 'error'); })
  .finally(function(){
    if(btn){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete'; }
  });
}

/* ---------------- Edit-modal field prefill ---------------- */
function prefillForm(formId, dataAttrs){
  var form = document.getElementById(formId);
  if(!form) return;
  Object.keys(dataAttrs).forEach(function(key){
    var field = form.querySelector('[name="' + key + '"]');
    if(field) field.value = dataAttrs[key];
  });
}

/* ---------------- Attendance quick mark ---------------- */
function markAttendance(selectEl, entity, id){
  var payload = { status: selectEl.value };
  fetch('/api/data/' + entity + '/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  })
  .then(function(res){ return res.json().then(function(data){ return {ok:res.ok,data:data}; }); })
  .then(function(result){ if(result.ok){ showToast('Attendance updated', 'success'); var row=selectEl.closest('tr'); if(row){ row.dataset.status=selectEl.value; } } else { showToast(result.data.error || 'Could not update attendance','error'); } })
  .catch(function(){ showToast('Could not update attendance', 'error'); });
}

/* ---------------- Dashboard "Add" deep-link ----------------
   Dashboard boxes (Course/Trainer/Batches/Students/Sessions) link to
   each list page with ?open=add so the page auto-opens its Add modal. */
document.addEventListener('DOMContentLoaded', function(){
  var params = new URLSearchParams(window.location.search);
  if(params.get('open') === 'add'){
    var addModalFns = [
      'openAddCourseModal','openAddTrainerModal','openAddBatchModal',
      'openAddStudentModal','openAddSessionModal','openAddAssessmentModal',
      'openAddAttendanceModal','openAddAnnouncementModal','openAddGuardianModal',
      'openAddPaymentModal'
    ];
    for(var i=0;i<addModalFns.length;i++){
      var fn = addModalFns[i];
      if(typeof window[fn] === 'function'){ window[fn](); break; }
    }
  }

  /* Dashboard "Registered" deep-link: pre-apply the status filter on the
     Students page when arriving via ?status=Active */
  var statusParam = params.get('status');
  if(statusParam){
    var statusSelect = document.querySelector('.filter-select[data-field="status"]');
    if(statusSelect){
      statusSelect.value = statusParam;
      if(typeof applyFilters === 'function'){
        var tableEl = statusSelect.getAttribute('data-filter-for');
        if(tableEl) applyFilters(tableEl);
      }
    }
  }
});

// Global appearance + language controls
(function(){
  document.documentElement.classList.toggle('dark-mode', (localStorage.getItem('lms-theme')||'light')==='dark');
  document.addEventListener('DOMContentLoaded', function(){
    var t=document.getElementById('themeToggle');
    function icon(){if(t)t.innerHTML=document.documentElement.classList.contains('dark-mode')?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>'; }
    icon();
    if(t)t.onclick=function(){var d=!document.documentElement.classList.contains('dark-mode');document.documentElement.classList.toggle('dark-mode',d);localStorage.setItem('lms-theme',d?'dark':'light');icon();};
    var l=document.getElementById('languageSelect');
    if(l){var m=document.cookie.match(/(?:^|; )googtrans=([^;]+)/);if(m){var parts=decodeURIComponent(m[1]).split('/');l.value=parts[parts.length-1]||'en';}l.onchange=function(){document.cookie='googtrans=/en/'+this.value+';path=/';location.reload();};}
  });
})();


/* Global previous-page navigation. Fall back to the LMS entry point when a
   page was opened directly or from another site. */
function goBackSafely(){
  try {
    if (document.referrer) {
      var previous = new URL(document.referrer, window.location.href);
      if (previous.origin === window.location.origin && previous.href !== window.location.href) {
        window.history.back();
        return;
      }
    }
  } catch (e) {}
  window.location.assign('/');
}
