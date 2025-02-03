async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    errorMsg.textContent = "";
    
    if (!username || !password) {
        errorMsg.textContent = "Please enter both username and password.";
        return;
    }
    // this line will  encode the username and password to base 64
    // i used btoa binary to ascii
    const credentials = btoa(`${username}:${password}`);
    
    try {
        const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Login failed. Please check your credentials.');
        }
        // extract json response from the server
        const data = await response.json();
        localStorage.setItem('jwt', data.token);
        // save the json web token in the browser local storage 
        // which will allow us to remain logged in accross pages 
        window.location.href = 'profile.html'; // Redirect to profile page
    } catch (error) {
        errorMsg.textContent = error.message;
    }
}

window.addEventListener('click', function(event) {
   login();
});