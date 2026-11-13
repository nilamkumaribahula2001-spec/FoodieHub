let allOrders = [];

async function loadAdminOrders() {
    const orderList = document.getElementById("admin-order-list");

    try {
        const response = await fetch("http://localhost:3000/api/orders");

        if (!response.ok) {
            throw new Error("Failed to fetch orders");
        }

        const orders = await response.json();
        allOrders = orders;
        console.log("First Order Data:", orders[0]);
console.log("Order ID:", orders[0].order_id);
console.log("Customer Name:", orders[0].customer_name);
console.log("All Orders:", allOrders);
        // Dashboard Counts
        document.getElementById("total-orders").textContent =
            orders.length;

        document.getElementById("pending-orders").textContent =
            orders.filter(order => order.status === "Pending").length;

        document.getElementById("delivered-orders").textContent =
            orders.filter(order => order.status === "Delivered").length;

        document.getElementById("confirmed-orders").textContent =
            orders.filter(order => order.status === "Confirmed").length;

        // Total Revenue
        const revenue = orders.reduce((sum, order) => {
            return sum + Number(order.total_amount || 0);
        }, 0);

        document.getElementById("total-revenue").textContent =
            "₹" + revenue.toFixed(2);

        // Today's Sales and Monthly Sales
        const today = new Date();

        const todaySales = orders
            .filter(order => {
                const orderDate = new Date(order.order_date);
                return orderDate.toDateString() === today.toDateString();
            })
            .reduce((sum, order) => {
                return sum + Number(order.total_amount || 0);
            }, 0);

        const monthlySales = orders
            .filter(order => {
                const orderDate = new Date(order.order_date);

                return orderDate.getMonth() === today.getMonth() &&
                    orderDate.getFullYear() === today.getFullYear();
            })
            .reduce((sum, order) => {
                return sum + Number(order.total_amount || 0);
            }, 0);

        document.getElementById("today-sales").textContent =
            "₹" + todaySales.toFixed(2);

        document.getElementById("monthly-sales").textContent =
            "₹" + monthlySales.toFixed(2);

        // Display Orders
        displayOrders(orders);

    } catch (error) {
        orderList.textContent = "Unable to load orders.";
        console.log(error);
    }
}


// Display Order Cards
function displayOrders(orders) {
    const orderList = document.getElementById("admin-order-list");

    orderList.innerHTML = "";

    if (orders.length === 0) {
        orderList.textContent = "No orders found.";
        return;
    }

    orders.forEach(order => {

        const card = document.createElement("div");
        card.className = "history-card";

        card.dataset.orderId =
            String(order.order_id).toLowerCase();

        card.dataset.customerName =
            String(order.customer_name).toLowerCase();

        const heading = document.createElement("h3");
        heading.textContent = "Order ID: " + order.order_id;

        const customer = document.createElement("p");
        customer.textContent = "Customer: " + order.customer_name;

        const phone = document.createElement("p");
        phone.textContent = "Phone: " + order.phone;

        const address = document.createElement("p");
        address.textContent = "Address: " + order.address;

        const payment = document.createElement("p");
        payment.textContent = "Payment: " + order.payment_method;

        const total = document.createElement("p");
        total.textContent = "Total: ₹" + order.total_amount;

        const currentStatus = document.createElement("span");
        currentStatus.textContent = order.status;
        currentStatus.className =
            "status-badge " + order.status.toLowerCase();

        const itemsHeading = document.createElement("h4");
        itemsHeading.textContent = "Ordered Food Items:";

        const itemsList = document.createElement("div");

        (order.items || []).forEach((item, index) => {

            const itemText = document.createElement("p");

            itemText.textContent =
                (index + 1) + ". " +
                item.name + " × " + item.quantity + " — ₹" +
                (Number(item.price) * Number(item.quantity));

            itemsList.appendChild(itemText);
        });

        // Status Dropdown
        const select = document.createElement("select");

        ["Pending", "Confirmed", "Delivered"].forEach(status => {

            const option = document.createElement("option");

            option.value = status;
            option.textContent = status;

            if (status === order.status) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        // Update Status Button
        const button = document.createElement("button");
        button.textContent = "Update Status";

        button.onclick = async function () {

            try {
                const result = await fetch(
                    "http://localhost:3000/api/orders/" + order.order_id,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            status: select.value
                        })
                    }
                );

                if (result.ok) {
                    alert("Order status updated!");
                    loadAdminOrders();
                } else {
                    alert("Status update failed!");
                }

            } catch (error) {
                alert("Could not update order status.");
                console.log(error);
            }
        };

        // Delete Order Button
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete Order";
        deleteButton.style.background = "#dc2626";
        deleteButton.style.marginLeft = "10px";

        deleteButton.onclick = async function () {

            const confirmDelete = confirm(
                "Are you sure you want to delete this order?"
            );

            if (!confirmDelete) {
                return;
            }

            try {
                const result = await fetch(
                    "http://localhost:3000/api/orders/" + order.order_id,
                    {
                        method: "DELETE"
                    }
                );

                if (result.ok) {
                    alert("Order deleted successfully!");
                    loadAdminOrders();
                } else {
                    alert("Failed to delete order!");
                }

            } catch (error) {
                alert("Could not delete order.");
                console.log(error);
            }
        };

        // Add Everything to Card
        card.append(
            heading,
            customer,
            phone,
            address,
            payment,
            total,
            currentStatus,
            itemsHeading,
            itemsList,
            select,
            button,
            deleteButton
        );

        orderList.appendChild(card);
    });
}


// Search Orders
document.getElementById("order-search").addEventListener("input", function () {

    const searchText = this.value.toLowerCase();
console.log("Search:", searchText);
    const filteredOrders = allOrders.filter(order => {

        return String(order.order_id).toLowerCase().includes(searchText) ||
            String(order.customer_name).toLowerCase().includes(searchText);

    });

    displayOrders(filteredOrders);
});


// Load All Orders
loadAdminOrders();
document.getElementById("export-sales-btn").addEventListener("click", function () {
    let csv = "Order ID,Customer Name,Order Date,Status,Total Amount\n";

    allOrders.forEach(order => {
        csv += `${order.order_id},${order.customer_name},${order.order_date},${order.status},${order.total_amount}\n`;
    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FoodieHub_Sales_Report.csv";
    link.click();

    URL.revokeObjectURL(link.href);
});