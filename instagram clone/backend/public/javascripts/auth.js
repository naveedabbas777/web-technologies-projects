function authHeader() {
  var token = localStorage.getItem('token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

async function createPost(title, body, tags) {
  var res = await fetch('/api/v1/posts', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
    body: JSON.stringify({ title: title, body: body, tags: tags || [] })
  });
  return res.json();
}

async function createComment(postId, body, parentId) {
  var res = await fetch('/api/v1/comments/' + encodeURIComponent(postId), {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
    body: JSON.stringify({ body: body, parentId: parentId || null })
  });
  return res.json();
}

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  location.reload();
}

function renderAuthLinks(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  if (isLoggedIn()) {
    el.innerHTML = '<button id="logoutBtn" type="button">Logout</button>';
    var btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', logout);
  } else {
    el.innerHTML = '<a href="/login">Login</a> <a href="/signup">Signup</a>';
  }
}


