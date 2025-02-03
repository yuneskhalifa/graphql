function logout() {
    localStorage.removeItem('jwt'); // Remove the token from local storage
    window.location.href = 'index.html'; // Redirect to the login page
}

// Call logout function when logout button is clicked
document.getElementById('logout-btn').addEventListener('click', logout);
