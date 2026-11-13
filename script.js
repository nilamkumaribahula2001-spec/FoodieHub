let cart = JSON.parse(localStorage.getItem("foodieCart")) || [];

function addToCart(name, price) {
    let foodCard = [...document.querySelectorAll(".food-card")]
        .find(card => card.querySelector("h3").textContent.includes(name));

    let image = foodCard.querySelector("img").src;

    let existingItem = cart.find(item => item.name === name);

if (existingItem) {
    existingItem.quantity++;
} else {
    cart.push({
        name: name,
        price: price,
        image: image,
        quantity: 1
    });
}

    displayCart();
}

function displayCart() {
    let cartItems = document.getElementById("cart-items");
    let total = 0;

    localStorage.setItem("foodieCart", JSON.stringify(cart));

    if (cartItems) {
        cartItems.innerHTML = "";

        cart.forEach((item, index) => {
            total += item.price * item.quantity;

            cartItems.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div>
                        <h3>${item.name}</h3>
                        <p>₹${item.price} × ${item.quantity}</p>
                        <button onclick="changeQuantity(${index}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)">+</button>
                        <button onclick="removeItem(${index})">Remove</button>
                    </div>
                </div>
            `;
        });

        if (cart.length === 0) {
    cartItems.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon">🛒</div>
            <h3>Your Cart is Empty!</h3>
            <p>Looks like you haven't added anything delicious yet.</p>
            <a href="index.html#menu">Browse Menu</a>
        </div>
    `;
}
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
        });
    }

    let totalElement = document.getElementById("total");
    let checkoutTotal = document.getElementById("checkout-total");

    if (totalElement) totalElement.innerText = total;
    if (checkoutTotal) checkoutTotal.innerText = total;
}

function changeQuantity(index, change) {
    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    displayCart();
}
function removeItem(index) {
    cart.splice(index, 1);
    displayCart();
}

async function placeOrder() {
    let name = document.getElementById("customerName").value.trim();
    let phone = document.getElementById("customerPhone").value.trim();
    let address = document.getElementById("customerAddress").value.trim();

    if (!name || !phone || !address) {
        alert("Please fill all details!");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Enter a valid 10-digit mobile number!");
        return;
    }

    if (cart.length === 0) {
        alert("Please add food items to your cart!");
        return;
    }

    let orderTotal = cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);

    let payment = document.getElementById("paymentMethod").value;

    try {
        let response = await fetch("http://localhost:3000/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                address: address,
                payment: payment,
                total: orderTotal,
                items: cart
            })
        });

        let result = await response.json();

        if (!response.ok) {
            alert(result.message || "Order failed!");
            return;
        }

        let orderDetails = {
            orderId: result.orderId,
            name: name,
            phone: phone,
            address: address,
            payment: payment,
            total: orderTotal,
            items: cart
        };

        localStorage.setItem("foodieLastOrder", JSON.stringify(orderDetails));

        cart = [];
        displayCart();

        alert("Order saved successfully!");

        window.location.href = "confirmation.html";

    } catch (error) {
        alert("Server connection failed! Please check if server is running.");
        console.log(error);
    }
}

function loadConfirmation() {
    let order = JSON.parse(localStorage.getItem("foodieLastOrder"));

    if (!order) {
        document.getElementById("order-confirmation").innerHTML =
            "<h2>No order details found!</h2>";
        return;
    }

    document.getElementById("order-id").textContent = order.orderId;
    document.getElementById("confirm-name").textContent = order.name;
    document.getElementById("confirm-phone").textContent = order.phone;
    document.getElementById("confirm-address").textContent = order.address;
    document.getElementById("confirm-payment").textContent = order.payment;
    document.getElementById("confirm-total").textContent = order.total;

    let items = document.getElementById("confirm-items");
    items.innerHTML = "";

    order.items.forEach(item => {
        let p = document.createElement("p");
        p.textContent = item.name + " × " + item.quantity;
        items.appendChild(p);
    });
}

if (document.getElementById("order-confirmation")) {
    loadConfirmation();
}
async function loadOrderHistory() {
    let historyList = document.getElementById("order-history-list");

    try {
        let response = await fetch("http://localhost:3000/api/orders");
        let orders = await response.json();
let totalOrdersElement = document.getElementById("totalOrders");

if (totalOrdersElement) {
    totalOrdersElement.textContent = orders.length;
}
        historyList.innerHTML = "";

        if (orders.length === 0) {
            historyList.textContent = "No orders found.";
            return;
        }

        orders.forEach(order => {
            let card = document.createElement("div");
            card.className = "history-card";

            let heading = document.createElement("h3");
            heading.textContent = "Order ID: " + order.order_id;

            let customer = document.createElement("p");
            customer.textContent = "Customer: " + order.customer_name;

            let total = document.createElement("p");
            let itemsHeading = document.createElement("h4");
itemsHeading.textContent = "Ordered Food Items:";

let itemsList = document.createElement("div");
itemsList.className = "order-items-list";

(order.items || []).forEach(item => {
    let itemText = document.createElement("p");

    itemText.textContent =
        item.name + " × " + item.quantity +
        " — ₹" + (Number(item.price) * Number(item.quantity));

    itemsList.appendChild(itemText);
});
            total.textContent = "Total: ₹" + order.total_amount;

            let payment = document.createElement("p");
            let status = document.createElement("p");
            status.className = "order-status " + order.status.toLowerCase();
status.textContent = "Status: " + order.status;
            payment.textContent = "Payment: " + order.payment_method;

            let date = document.createElement("p");
            date.textContent = "Date: " + new Date(order.order_date).toLocaleString();
let progress = document.createElement("div");
progress.className = "order-progress";

let steps = ["Pending", "Confirmed", "Delivered"];

steps.forEach((step, index) => {
    let stepBox = document.createElement("div");
    stepBox.className = "progress-step";

    if (steps.indexOf(order.status) >= index) {
        stepBox.classList.add("completed");
    }

    stepBox.textContent = step;
    progress.appendChild(stepBox);
});
            card.append(
    heading,
    customer,
    itemsHeading,
    itemsList,
    total,
    payment,
    status,
    progress,
    date
);
            historyList.appendChild(card);
        });

    } catch (error) {
        historyList.textContent = "Unable to load order history.";
        console.log(error);
    }
}

if (document.getElementById("order-history-list")) {
    loadOrderHistory();
}
displayCart();
console.log("Food Search Loaded");
document.getElementById("foodSearch").addEventListener("input", function () {

    let searchValue = this.value.toLowerCase();

    let foodCards = document.querySelectorAll(".food-card");

    foodCards.forEach(function (card) {

        let foodName = card.querySelector("h3").textContent.toLowerCase();

        if (foodName.includes(searchValue)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }

    });
});
function filterCategory(category) {
    let foodCards = document.querySelectorAll(".food-card");

    foodCards.forEach(function(card) {

        let foodName = card.querySelector("h3").textContent.toLowerCase();

        if (category === "all") {
            card.style.display = "block";
        }
        else if (
            (category === "biryani" && foodName.includes("biryani")) ||
            (category === "pizza" && foodName.includes("pizza")) ||
            (category === "burger" && foodName.includes("burger")) ||
            (category === "momos" && foodName.includes("momos")) ||
            (category === "dessert" && (
                foodName.includes("cake") ||
                foodName.includes("ice cream") ||
                foodName.includes("sundae") ||
                foodName.includes("gulab jamun") ||
                foodName.includes("rasmalai") ||
                foodName.includes("ladoo")
            ))
            || (category === "drinks" && (
    foodName.includes("coca-cola") ||
    foodName.includes("pepsi") ||
    foodName.includes("sprite") ||
    foodName.includes("fanta") ||
    foodName.includes("thums up") ||
    foodName.includes("mountain dew")
))
        ) {
            card.style.display = "block";
        }
        else {
            card.style.display = "none";
        }

    });
}
// SHOW BACK TO TOP BUTTON ON SCROLL

document.addEventListener("DOMContentLoaded", function () {
    const backToTop = document.getElementById("backToTop");

    if (backToTop) {
        backToTop.style.display = "none";

        window.addEventListener("scroll", function () {
            if (window.scrollY > 300) {
                backToTop.style.display = "block";
            } else {
                backToTop.style.display = "none";
            }
        });
    }
});