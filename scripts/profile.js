

export async function getUserDetails() {
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


  
//   const userTransactionQuery = `
//   query GetTransactionData($userId: Int!) {
//     transaction(where: { type: { _eq: "xp" }, userId: { _eq: $userId } },
//     order_by: { createdAt: desc },  
//       limit: 5                        
//       ) {
//       id
//       type
//       amount
//       objectId
//       userId
//       createdAt
//       path
//     }
//   }
// `;

const userTransactionQuery = `
  query GetTransactionData($userId: Int!) {
    transaction(
      where: { type: { _eq: "xp" }, userId: { _eq: $userId } },
      order_by: { createdAt: desc }
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
      console.log(projectData);
      console.log(projectNameMap);
      // ✅ Draw the Pie Chart
     

      // ✅ Display Last 5 Projects
      transactions.slice(0, 5).forEach(tx => {
        if (projectNameMap.has(tx.objectId)) {
          projectsContainer.innerHTML += `
            <div>
              <p><strong>Project Name:</strong> ${projectNameMap.get(tx.objectId)}</p>
              <p><strong>XP Earned:</strong> ${tx.amount}</p>
              <p><strong>Date:</strong> ${new Date(tx.createdAt).toLocaleDateString()}</p>
              <hr>
            </div>
          `;
        }
      });
      projectsContainer.innerHTML +=`<div> <h1> The XP & Projects Chart </h1></div>`;
      createPieChart1(projectData, projectsContainer);
    } else {
      console.log("No data retrieved");
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}

// function createPieChart1(projects, container) {
//   const chartSize = 300;
//   const center = chartSize / 2;
//   const radius = center - 20;

//   const totalXp = projects.reduce((sum, project) => sum + project.xp, 0);

//   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//   svg.setAttribute("id", "xpPieChart"); // Set an ID for the chart

//   svg.setAttribute("width", chartSize);
//   svg.setAttribute("height", chartSize);
//   svg.style.border = "1px solid #ccc";
//   svg.style.position = "relative"; // Make sure positioning is relative

//   // ✅ Tooltip for Hover
//   const tooltip = document.createElement("div");
//   tooltip.style.position = "absolute";
//   tooltip.style.padding = "5px 10px";
//   tooltip.style.background = "#333";
//   tooltip.style.color = "#fff";
//   tooltip.style.borderRadius = "5px";
//   tooltip.style.display = "none";
//   tooltip.style.pointerEvents = "none";
//   tooltip.style.zIndex = "1000"; // Ensure tooltip is above everything
//   container.appendChild(tooltip);

//   let startAngle = 0;

//   projects.forEach((project, index) => {
//     const percentage = project.xp / totalXp;
//     const endAngle = startAngle + percentage * 360;

//     const largeArcFlag = percentage > 0.5 ? 1 : 0;
//     const startX = center + radius * Math.cos((Math.PI / 180) * startAngle);
//     const startY = center + radius * Math.sin((Math.PI / 180) * startAngle);
//     const endX = center + radius * Math.cos((Math.PI / 180) * endAngle);
//     const endY = center + radius * Math.sin((Math.PI / 180) * endAngle);

//     const pathData = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

//     const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
//     path.setAttribute("d", pathData);
//     path.setAttribute("fill", getColor(index));
//     path.style.cursor = "pointer";

//     // ✅ Add Debugging to check if path is being created
//     //console.log("Creating path for:", project.name, "XP:", project.xp);

//     // ✅ Hover Effect with Debugging
//     path.addEventListener("mouseover", () => {
//       console.log("Mouse over detected on path:", project.name, project.xp);  // Log to check if event fires correctly
//       tooltip.style.display = "block";
//       tooltip.textContent = `${project.name}: ${project.xp} XP`;
//     });

//     path.addEventListener("mousemove", (e) => {
//       console.log("Mousemove detected:", e.pageX, e.pageY);  // Log mouse position to check if move event fires
//       const tooltipWidth = tooltip.offsetWidth;
//       const tooltipHeight = tooltip.offsetHeight;

//       const xPosition = e.pageX + 10;
//       const yPosition = e.pageY - tooltipHeight - 10;

//       tooltip.style.left = `${xPosition}px`;
//       tooltip.style.top = `${yPosition}px`;
//     });

//     path.addEventListener("mouseout", () => {
//       tooltip.style.display = "none";
//     });

//     svg.appendChild(path);
//     startAngle = endAngle;
//   });

//   container.appendChild(svg);
// }


function createPieChart1(projects, container) {
  const chartSize = 300;
  const center = chartSize / 2;
  const radius = center - 20;

  const totalXp = projects.reduce((sum, project) => sum + project.xp, 0);

  // ✅ Create a wrapper div for centering
  const chartWrapper = document.createElement("div");
  chartWrapper.id = "xpPieChartWrapper";
  chartWrapper.style.display = "flex";
  chartWrapper.style.justifyContent = "center";
  chartWrapper.style.alignItems = "center";
  chartWrapper.style.width = "100%"; 
  chartWrapper.style.height = "350px"; // Adjust as needed

  //test

  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "xpPieChart");
  svg.setAttribute("width", chartSize);
  svg.setAttribute("height", chartSize);
  svg.style.border = "1px solid #ccc";
  svg.style.display = "block"; // Ensures proper centering inside div

  // ✅ Tooltip for Hover
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.padding = "5px 10px";
  tooltip.style.background = "#333";
  tooltip.style.color = "#fff";
  tooltip.style.borderRadius = "5px";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.zIndex = "1000"; 
  container.appendChild(tooltip);

  let startAngle = 0;

  projects.forEach((project, index) => {
    const percentage = project.xp / totalXp;
    const endAngle = startAngle + percentage * 360;

    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    const startX = center + radius * Math.cos((Math.PI / 180) * startAngle);
    const startY = center + radius * Math.sin((Math.PI / 180) * startAngle);
    const endX = center + radius * Math.cos((Math.PI / 180) * endAngle);
    const endY = center + radius * Math.sin((Math.PI / 180) * endAngle);

    const pathData = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", getColor(index));
    path.style.cursor = "pointer";

    // ✅ Hover Effect
    path.addEventListener("mouseover", () => {
      tooltip.style.display = "block";
      tooltip.textContent = `${project.name}: ${project.xp} XP`;
    });

    path.addEventListener("mousemove", (e) => {
      const tooltipWidth = tooltip.offsetWidth;
      const tooltipHeight = tooltip.offsetHeight;

      const xPosition = e.pageX + 10;
      const yPosition = e.pageY - tooltipHeight - 10;

      tooltip.style.left = `${xPosition}px`;
      tooltip.style.top = `${yPosition}px`;
    });

    path.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    svg.appendChild(path);
    startAngle = endAngle;
  });

  // ✅ Append SVG to wrapper and then to container
  chartWrapper.appendChild(svg);
  container.appendChild(chartWrapper);
}


// ✅ Color Generator
function getColor(index) {
  const colors = ["#f39c12", "#e74c3c", "#8e44ad", "#3498db", "#2ecc71", "#1abc9c"];
  return colors[index % colors.length];
}

// end of test



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

// async function fetchUserSkills() {
//   const container = document.getElementById("skills-container");
//   container.innerHTML = "Loading..."; // Show loading message

//   try {
//     // API Request
//     const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${localStorage.getItem("jwtToken")}` // Authentication token
//       },
//       body: JSON.stringify({ query: skillsQuery }) // Replace 'skillsQuery' with your actual query
//     });

//     const result = await response.json();
//     container.innerHTML = ""; // Clear container before displaying results

//     // Check if user data exists
//     if (result?.data?.user?.length > 0) {
//       const transactions = result.data.user[0].transactions; // Access transactions for the first user
//       console.log(transactions); // Debugging purpose

//       // Check if transactions exist
//       if (transactions && transactions.length > 0) {
//         console.log("Transactions found:", transactions);

//         // Display each skill
//         transactions.forEach(skill => {
//           const skillDiv = document.createElement("div");
//           skillDiv.className = "skill";
//           skillDiv.innerHTML = `
//             <div class="skill-type">Skill: ${formatSkillType(skill.type)}</div>
//             <div class="skill-amount">Proficiency: ${skill.amount}</div>
//           `;
//           container.appendChild(skillDiv);
//         });

//       } else {
//         console.log("No transactions found.");
//         container.innerHTML = "No skills found.";
//       }
//     } else {
//       console.log("No user data found.");
//       container.innerHTML = "No user data found.";
//     }

//   } catch (error) {
//     console.error("Error fetching skills:", error);
//     container.innerHTML = "Failed to load skills. Please try again.";
//   }
// }

// // Helper function to format skill types
// function formatSkillType(type) {
//   return type.replace("skill_", "").replace("-", " ").toUpperCase();
// }



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
      body: JSON.stringify({ query: skillsQuery })
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

        // Create the pie chart
        createPieChart(transactions);
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

// Helper function to create the pie chart
// function createPieChart(skills) {
//   const chartContainer = document.createElement("div");
//   chartContainer.className = "pie-chart-container";
//   chartContainer.style.display = "flex"; // Align chart and legend side by side
//   chartContainer.style.alignItems = "center";

//   const chartSize = 200;
//   const center = chartSize / 2;
//   const radius = center - 10;

//   const totalProficiency = skills.reduce((acc, skill) => acc + skill.amount, 0);

//   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//   svg.setAttribute("width", chartSize);
//   svg.setAttribute("height", chartSize);
//   svg.setAttribute("viewBox", `0 0 ${chartSize} ${chartSize}`);

//   let startAngle = 0;

//   skills.forEach(skill => {
//     const percentage = skill.amount / totalProficiency;
//     const endAngle = startAngle + percentage * 360;

//     const largeArcFlag = percentage > 0.5 ? 1 : 0;
//     const startX = center + radius * Math.cos((Math.PI / 180) * startAngle);
//     const startY = center + radius * Math.sin((Math.PI / 180) * startAngle);
//     const endX = center + radius * Math.cos((Math.PI / 180) * endAngle);
//     const endY = center + radius * Math.sin((Math.PI / 180) * endAngle);

//     const pathData = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

//     const skillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
//     skillPath.setAttribute("d", pathData);
//     skillPath.setAttribute("fill", getSkillColor(skill.type));
//     svg.appendChild(skillPath);

//     startAngle = endAngle;
//   });

//   // Create the legend container
//   const legendContainer = document.createElement("div");
//   legendContainer.style.marginLeft = "20px"; // Space between chart and legend

//   skills.forEach(skill => {
//     const percentage = ((skill.amount / totalProficiency) * 100).toFixed(1); // Calculate percentage

//     const legendItem = document.createElement("div");
//     legendItem.style.display = "flex";
//     legendItem.style.alignItems = "center";
//     legendItem.style.marginBottom = "5px";

//     const colorBox = document.createElement("div");
//     colorBox.style.width = "15px";
//     colorBox.style.height = "15px";
//     colorBox.style.backgroundColor = getSkillColor(skill.type);
//     colorBox.style.marginRight = "10px";

//     const skillLabel = document.createElement("span");
//     skillLabel.textContent = `${skill.type} (${percentage}%)`; // Add percentage next to skill name

//     legendItem.appendChild(colorBox);
//     legendItem.appendChild(skillLabel);
//     legendContainer.appendChild(legendItem);
//   });

//   chartContainer.appendChild(svg);
//   chartContainer.appendChild(legendContainer);
//   document.body.appendChild(chartContainer);
// }


function createPieChart(skills) {
  const chartWrapper = document.createElement("div");
  chartWrapper.className = "chart-wrapper";

  // Center the chart container using flexbox
  chartWrapper.style.display = "flex";
  chartWrapper.style.flexDirection = "column"; // Stack title & chart vertically
  chartWrapper.style.alignItems = "center"; // Center horizontally
  chartWrapper.style.justifyContent = "center"; // Center vertically
  chartWrapper.style.margin = "20px auto"; // Center in the page
  chartWrapper.style.textAlign = "center"; // Align text properly

  // Create heading above the chart
  const heading = document.createElement("h1");
  heading.textContent = "The Skills Chart";
  heading.style.marginBottom = "10px"; // Space between title & chart

  const chartContainer = document.createElement("div");
  chartContainer.className = "pie-chart-container";
  chartContainer.style.display = "flex"; // Align chart and legend side by side
  chartContainer.style.alignItems = "center";

  const chartSize = 200;
  const center = chartSize / 2;
  const radius = center - 10;

  const totalProficiency = skills.reduce((acc, skill) => acc + skill.amount, 0);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", chartSize);
  svg.setAttribute("height", chartSize);
  svg.setAttribute("viewBox", `0 0 ${chartSize} ${chartSize}`);

  let startAngle = 0;

  skills.forEach(skill => {
    const percentage = skill.amount / totalProficiency;
    const endAngle = startAngle + percentage * 360;

    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    const startX = center + radius * Math.cos((Math.PI / 180) * startAngle);
    const startY = center + radius * Math.sin((Math.PI / 180) * startAngle);
    const endX = center + radius * Math.cos((Math.PI / 180) * endAngle);
    const endY = center + radius * Math.sin((Math.PI / 180) * endAngle);

    const pathData = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    const skillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    skillPath.setAttribute("d", pathData);
    skillPath.setAttribute("fill", getSkillColor(skill.type));
    svg.appendChild(skillPath);

    startAngle = endAngle;
  });

  // Create the legend container
  const legendContainer = document.createElement("div");
  legendContainer.style.marginLeft = "20px"; // Space between chart and legend

  skills.forEach(skill => {
    const percentage = ((skill.amount / totalProficiency) * 100).toFixed(1);

    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.marginBottom = "5px";

    const colorBox = document.createElement("div");
    colorBox.style.width = "15px";
    colorBox.style.height = "15px";
    colorBox.style.backgroundColor = getSkillColor(skill.type);
    colorBox.style.marginRight = "10px";

    const skillLabel = document.createElement("span");
    skillLabel.textContent = `${skill.type} (${percentage}%)`;

    legendItem.appendChild(colorBox);
    legendItem.appendChild(skillLabel);
    legendContainer.appendChild(legendItem);
  });

  chartContainer.appendChild(svg);
  chartContainer.appendChild(legendContainer);

  // Append everything to the wrapper
  chartWrapper.appendChild(heading);
  chartWrapper.appendChild(chartContainer);
  
  // Append to body
  document.body.appendChild(chartWrapper);
}


// Helper function to assign colors to skills
function getSkillColor(skillType) {
  const skillColors = {
    "skill_js": "#f1c40f",
    "skill_go": "#3498db",
    "skill_html": "#e74c3c",
    "skill_prog": "#2ecc71",
    "skill_front-end": "#9b59b6",
    "skill_back-end": "#1abc9c"
  };

  return skillColors[skillType] || "#bdc3c7"; // Default color
}



window.onload = populate;





//   async function getUserXpProjects(userId) {
//     console.log("JWT in LocalStorage:", localStorage.getItem("jwtToken"));
//   try {
//     const response = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
//       },
//       body: JSON.stringify({
//         query: userTransactionQuery,
//         variables: { userId }
//       })
//     });

//     const data = await response.json();

//     if (data && data.data && data.data.transaction.length > 0) {
//       console.log("Retrieved data");

//       // Get the container where the projects will be displayed
//       const projectsContainer = document.getElementById("projects-container");

//       // Loop through the transactions (last 5)
//       const lastFiveTransactions = data.data.transaction.slice(0, 5);
//       for (let tx of lastFiveTransactions) {
//         // Fetch the project name based on the objectId
//         const projectName = await getProjectName(tx.objectId);

//         // Create a new div for each project
//         const projectDiv = document.createElement("div");

//         // Populate the content for each project
//         projectDiv.innerHTML = `
//           <p><strong>Project Name:</strong> ${projectName}</p>
//           <p><strong>Project ID:</strong> ${tx.objectId}</p>
//           <p><strong>XP Earned:</strong> ${tx.amount}</p>
//           <p><strong>Date:</strong> ${new Date(tx.createdAt).toLocaleDateString()}</p>
//         `;

//         // Append the project div to the container
//         projectsContainer.appendChild(projectDiv);
//       }
//     } else {
//       console.log("No data retrieved");
//     }
//   } catch (error) {
//     console.error("Error fetching user details:", error);
//   }
// }

