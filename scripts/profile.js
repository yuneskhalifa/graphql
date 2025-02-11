

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
          getUserXpProjects(user.id) 
          fetchUserSkills();

      } else {
          document.getElementById("user-id").textContent = "Error fetching data";
          document.getElementById("user-login").textContent = "Error fetching data";
      }
     
       
  } catch (error) {
      console.error("Error in getting the user details", error);
  }
}


  
  const userTransactionQuery = `
  query GetTransactionData($userId: Int!) {
    transaction(where: { type: { _eq: "xp" }, userId: { _eq: $userId } },
    order_by: { createdAt: desc },  
      limit: 5                        
      ) {
      id
      type
      amount
      objectId
      userId
      createdAt
      path
    }
  }
`;

const objectDetailsQuery = `
  query GetObjectName($objectId: Int!) {
    object(where: { id: { _eq: $objectId }, type: { _eq: "project" } }) {
      name
    }
  }
`;


async function getProjectName(objectId) {
    try {
      const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
        },
        body: JSON.stringify({
          query: objectDetailsQuery,
          variables: { objectId }
        })
      });
      const data = await response.json();
      if (data && data.data && data.data.object.length > 0) {
        return data.data.object[0].name; // Return the project name
      } else {
        console.log("Project name not found");
        return "Unknown Project"; // Return a default name if not found
      }
    } catch (error) {
      console.error("Error fetching project name:", error);
      return "Error Fetching Name";
    }
  }
  


  async function getUserXpProjects(userId) {
    console.log("JWT in LocalStorage:", localStorage.getItem("jwtToken"));
  try {
    const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify({
        query: userTransactionQuery,
        variables: { userId }
      })
    });

    const data = await response.json();

    if (data && data.data && data.data.transaction.length > 0) {
      console.log("Retrieved data");

      // Get the container where the projects will be displayed
      const projectsContainer = document.getElementById("projects-container");

      // Loop through the transactions (last 5)
      const lastFiveTransactions = data.data.transaction.slice(0, 5);
      for (let tx of lastFiveTransactions) {
        // Fetch the project name based on the objectId
        const projectName = await getProjectName(tx.objectId);

        // Create a new div for each project
        const projectDiv = document.createElement("div");

        // Populate the content for each project
        projectDiv.innerHTML = `
          <p><strong>Project Name:</strong> ${projectName}</p>
          <p><strong>Project ID:</strong> ${tx.objectId}</p>
          <p><strong>XP Earned:</strong> ${tx.amount}</p>
          <p><strong>Date:</strong> ${new Date(tx.createdAt).toLocaleDateString()}</p>
        `;

        // Append the project div to the container
        projectsContainer.appendChild(projectDiv);
      }
    } else {
      console.log("No data retrieved");
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}



const skillsQuery = `
  query GetUserSkills {
    user {
      transactions(
        order_by: [{ type: desc }, { amount: desc }]
        distinct_on: [type]
        where: {
          type: { _in: ["skill_js", "skill_go", "skill_html", "skill_prog", "skill_front-end", "skill_back-end"] }
        }
      ) {
        type
        amount
      }
    }
  }
`;

async function fetchUserSkills() {
  const container = document.getElementById("skills-container");
  container.innerHTML = "Loading..."; // Show loading message

  try {
    // API Request
    const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwtToken")}` // Authentication token
      },
      body: JSON.stringify({ query: skillsQuery }) // Replace 'skillsQuery' with your actual query
    });

    const result = await response.json();
    container.innerHTML = ""; // Clear container before displaying results

    // Check if user data exists
    if (result?.data?.user?.length > 0) {
      const transactions = result.data.user[0].transactions; // Access transactions for the first user
      console.log(transactions); // Debugging purpose

      // Check if transactions exist
      if (transactions && transactions.length > 0) {
        console.log("Transactions found:", transactions);

        // Display each skill
        transactions.forEach(skill => {
          const skillDiv = document.createElement("div");
          skillDiv.className = "skill";
          skillDiv.innerHTML = `
            <div class="skill-type">Skill: ${formatSkillType(skill.type)}</div>
            <div class="skill-amount">Proficiency: ${skill.amount}</div>
          `;
          container.appendChild(skillDiv);
        });

      } else {
        console.log("No transactions found.");
        container.innerHTML = "No skills found.";
      }
    } else {
      console.log("No user data found.");
      container.innerHTML = "No user data found.";
    }

  } catch (error) {
    console.error("Error fetching skills:", error);
    container.innerHTML = "Failed to load skills. Please try again.";
  }
}

// Helper function to format skill types
function formatSkillType(type) {
  return type.replace("skill_", "").replace("-", " ").toUpperCase();
}



window.onload = populate;



