
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        alert(data.message);

        if (response.ok) {
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));
            window.location.href = "index.html";
        }

    } catch (error) {
        alert("Server connection failed!");
    }
});
