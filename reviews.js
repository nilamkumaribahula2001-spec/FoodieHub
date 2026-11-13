
document.getElementById("reviewForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const reviewData = {
        food_name: document.getElementById("foodName").value,
        customer_name: document.getElementById("customerName").value,
        rating: Number(document.getElementById("rating").value),
        review: document.getElementById("review").value
    };

    try {
        const response = await fetch("http://localhost:3000/api/reviews", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Review submitted successfully!");
            document.getElementById("reviewForm").reset();
        } else {
            alert(data.message || "Could not submit review.");
        }
    } catch (error) {
        alert("Server connection failed!");
        console.log(error);
    }
});

// DISPLAY CUSTOMER REVIEWS
async function loadReviews() {
    const reviewsList = document.getElementById("reviewsList");

    try {
        const response = await fetch("http://localhost:3000/api/reviews");
        const reviews = await response.json();

        reviewsList.innerHTML = "";

        if (reviews.length === 0) {
            reviewsList.textContent = "No reviews yet. Be the first to review!";
            return;
        }

        reviews.forEach(item => {
            const card = document.createElement("div");
            card.className = "review-card";

            card.innerHTML = `
                <h3>${item.food_name}</h3>
                <p><strong>${item.customer_name}</strong></p>
                <p>${"⭐".repeat(Number(item.rating))}</p>
                <p>${item.review}</p>
            `;

            reviewsList.appendChild(card);
        });

    } catch (error) {
        reviewsList.textContent = "Unable to load reviews.";
        console.log(error);
    }
}

loadReviews();
