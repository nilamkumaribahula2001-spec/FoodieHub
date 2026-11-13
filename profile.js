
const user = JSON.parse(localStorage.getItem("loggedInUser"));

if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
} else {
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
}

function logout() {
    localStorage.removeItem("loggedInUser");
    alert("Logout successful!");
    window.location.href = "login.html";
}
