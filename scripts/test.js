
const objectDetailsQuery = `
  query GetObjectNames($objectIds: [Int!]!) {
    object(where: { id: { _in: $objectIds }, type: { _eq: "project" } }) {
      id
      name
    }
  }
`;

async function getProjectNames(objectIds) {
  if (!objectIds.length) return new Map(); // Return empty map if no IDs provided

  try {
    const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify({
        query: objectDetailsQuery,
        variables: { objectIds }
      })
    });

    const data = await response.json();

    if (data && data.data && data.data.object.length > 0) {
      return new Map(data.data.object.map(proj => [proj.id, proj.name])); // Return a map of projectId → name
    }
  } catch (error) {
    console.error("Error fetching project names:", error);
  }

  return new Map(); // Return empty map if error occurs
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

      const projectsContainer = document.getElementById("projects-container");
      projectsContainer.innerHTML = ""; // Clear previous data

      const transactions = data.data.transaction;

      // ✅ Calculate Total XP
      const totalXp = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      projectsContainer.innerHTML += `<h3>Total XP Earned: ${totalXp}</h3>`;

      // ✅ Collect All Unique Project IDs
      const uniqueProjectIds = [...new Set(transactions.map(tx => tx.objectId))];

      // ✅ Fetch All Project Names in One API Call
      const projectNameMap = await getProjectNames(uniqueProjectIds);

      // ✅ Prepare Data for Pie Chart
      const projectData = transactions
        .filter(tx => projectNameMap.has(tx.objectId)) // Ignore unknown projects
        .map(tx => ({ name: projectNameMap.get(tx.objectId), xp: tx.amount }));

      // ✅ Draw the Pie Chart
      createPieChart1(projectData, projectsContainer);

      // ✅ Display Last 5 Projects
      transactions.slice(0, 5).forEach(tx => {
        if (projectNameMap.has(tx.objectId)) {
          projectsContainer.innerHTML += `
            <div>
              <p><strong>Project Name:</strong> ${projectNameMap.get(tx.objectId)}</p>
              <p><strong>Project ID:</strong> ${tx.objectId}</p>
              <p><strong>XP Earned:</strong> ${tx.amount}</p>
              <p><strong>Date:</strong> ${new Date(tx.createdAt).toLocaleDateString()}</p>
              <hr>
            </div>
          `;
        }
      });

    } else {
      console.log("No data retrieved");
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}
