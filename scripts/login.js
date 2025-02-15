
async function login() {
    console.log("hello");
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    errorMsg.textContent = "";
    
    if (!username || !password) {
        errorMsg.textContent = "Please enter both username and password.";
        return;
    }

    console.log("Username and password collected."); 
    
    const credentials = btoa(`${username}:${password}`);
    
    try {
        console.log("Sending request..."); 
        
        const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Response received.");  
        
        if (!response.ok) {
            throw new Error(`Login failed. Incorrect username or password Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("hello", data.token);  

        localStorage.setItem('jwtToken', data);
        window.location.href = 'profile.html';
    } catch (error) {
        console.error("Error caught:", error);   
        errorMsg.textContent = error.message;
    }
}

document.getElementById('login-btn').addEventListener('click', login);
