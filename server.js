const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("FoodieHub Backend is Working!");
});
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => { 
    if (err) {
        console.log("MySQL Connection Failed:", err);
    } else {
        console.log("MySQL Connected Successfully!");
    }
});
app.post("/api/orders", (req, res) => {
    const { name, phone, address, payment, total, items } = req.body;

    if (!name || !phone || !address || !items || items.length === 0) {
        return res.status(400).json({
            message: "Please provide all order details!"
        });
    }

    const orderId = "FH" + Date.now();

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ message: "Order failed!" });
        }

        const sql = `INSERT INTO orders
        (order_id, customer_name, phone, address, payment_method, total_amount)
        VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(sql, [orderId, name, phone, address, payment, total], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: "Order failed!" });
                });
            }

            const itemValues = items.map(item => [
                orderId,
                item.name,
                item.price,
                item.quantity
            ]);

            const itemSql = `INSERT INTO order_items
            (order_id, food_name, price, quantity)
            VALUES ?`;

            db.query(itemSql, [itemValues], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: "Items save failed!" });
                    });
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: "Order failed!" });
                        });
                    }

                    res.json({
                        message: "Order placed successfully!",
                        orderId: orderId
                    });
                });
            });
        });
    });
});
console.log("POST route loaded");
app.get("/api/orders", (req, res) => {
    const sql = `
        SELECT 
            orders.*,
            order_items.food_name,
            order_items.price,
            order_items.quantity
        FROM orders
        LEFT JOIN order_items
        ON orders.order_id = order_items.order_id
        ORDER BY orders.order_date DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch orders!"
            });
        }

        const orderMap = {};

        results.forEach(row => {
            if (!orderMap[row.order_id]) {
                orderMap[row.order_id] = {
                    ...row,
                    items: []
                };
            }

            if (row.food_name) {
                orderMap[row.order_id].items.push({
                    name: row.food_name,
                    price: row.price,
                    quantity: row.quantity
                });
            }
        });

        res.json(Object.values(orderMap));
    });
});

// UPDATE ORDER STATUS
app.put("/api/orders/:id", (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    const allowedStatus = ["Pending", "Confirmed", "Delivered"];

    if (!allowedStatus.includes(status)) {
        return res.status(400).json({
            message: "Invalid order status"
        });
    }

    const sql = "UPDATE orders SET status = ? WHERE order_id = ?";

    db.query(sql, [status, orderId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Status update failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.json({
            message: "Order status updated successfully"
        });
    });
});
app.delete("/api/orders/:id", (req, res) => {
    const orderId = req.params.id;

    db.query(
        "DELETE FROM order_items WHERE order_id = ?",
        [orderId],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to delete order items"
                });
            }

            db.query(
                "DELETE FROM orders WHERE order_id = ?",
                [orderId],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Failed to delete order"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Order not found"
                        });
                    }

                    res.json({
                        message: "Order deleted successfully"
                    });
                }
            );
        }
    );
});

// ADD FOOD REVIEW API
app.post("/api/reviews", (req, res) => {
    const { food_name, customer_name, rating, review } = req.body;

    if (!food_name || !customer_name || !rating || !review) {
        return res.status(400).json({
            message: "All fields are required!"
        });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            message: "Rating must be between 1 and 5!"
        });
    }

    const sql = `
        INSERT INTO food_reviews
        (food_name, customer_name, rating, review)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [food_name, customer_name, rating, review], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Review submission failed!"
            });
        }

        res.status(201).json({
            message: "Review submitted successfully!"
        });
    });
});
console.log("REVIEWS ROUTE LOADED!");
// GET ALL FOOD REVIEWS
app.get("/api/reviews", (req, res) => {

    const sql = "SELECT * FROM food_reviews ORDER BY created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch reviews!"
            });
        }

        res.json(results);
    });
});


// USER SIGNUP API
app.post("/api/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required!"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "Email already registered!"
                    });
                }

                return res.status(500).json({
                    message: "Signup failed!"
                });
            }

            res.status(201).json({
                message: "Account created successfully!"
            });
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong!"
        });
    }
});
console.log("Signup route loaded!");
// USER LOGIN API
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required!"
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Login failed!"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    });
});

app.listen(3000, () => {
    console.log("FoodieHub Server running on port 3000");
});
