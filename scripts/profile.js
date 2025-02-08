
async function getUserDetails() {
    console.log("JWT in LocalStorage:", localStorage.getItem("jwtToken"));
  try {
      const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
          },
          body: JSON.stringify({
              query: `{
                  user {
                      id
                      login
                  }
              }`
          })
      });

      const data = await response.json();
      if (data.data && data.data.user.length > 0) {
          return data.data.user[0]; // Assuming you only need the first user.
      } else {
          throw new Error("User data not found");
      }
  } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
  }
}


async function populate() {
  try {
      const user = await getUserDetails();
      if (user) {
          document.getElementById("user-id").textContent = user.id;
          document.getElementById("user-login").textContent = user.login;
      } else {
          document.getElementById("user-id").textContent = "Error fetching data";
          document.getElementById("user-login").textContent = "Error fetching data";
      }
  } catch (error) {
      console.error("Error in getting the user details", error);
  }
}

window.onload = populate;

