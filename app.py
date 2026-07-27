from flask import Flask, render_template, request, redirect, session, url_for,jsonify,flash
from werkzeug.security import generate_password_hash,check_password_hash
from dbconnection import get_connection

app = Flask(__name__)
app.secret_key = "abc"

# Home page
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/cart")
def cart():
    return render_template("cart.html")     


@app.route("/orders")
def orders():
    return render_template("orders.html")

@app.route("/checkout")
def checkout():
    return render_template("checkout.html")


#API for User registration
@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        full_name = request.form.get("full_name")
        email = request.form.get("email")
        phone = request.form.get("phone")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        address = request.form.get("address")

        if password != confirm_password:
            flash("Passwords do not match", "danger")
            return render_template("register.html")
        # Connect to MySQL
        con = get_connection()
        cmd = con.cursor()

        # Check whether email is already registered
        cmd.execute( "SELECT * FROM users WHERE email = %s",(email,))

        existing_user = cmd.fetchone()

        if existing_user is not None:
            cmd.close()
            con.close()
            flash("An account with this email already exists.", "warning")
            return render_template("register.html")

        # Hash the password before storing it
        hashed_password = generate_password_hash(password)

        # Insert user into database
        cmd.execute(""" INSERT INTO users (full_name, email, phone, password,address)
            VALUES (%s, %s, %s, %s,%s)""",
            (full_name, email, phone, hashed_password,address))

        con.commit()

        # Close database connection
        cmd.close()
        con.close()

        # Redirect to login page after successful registration
        flash("Registration successful! Please log in.", "success")
    return redirect(url_for("login"))


#API for User login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        con = get_connection()
        cmd = con.cursor(dictionary=True)
        cmd.execute("select * from users where email = %s",(email,))
        users = cmd.fetchone()
        cmd.close()
        con.close()
        if users is not None and check_password_hash(users["password"],password):

            session['user_id'] = users["user_id"]
            session["user_name"] = users["full_name"]
            return redirect(url_for("home"))
        else:
            flash("Invalid email or password.", "danger")
            return render_template("login.html")
            

        
    return render_template("login.html")

#API for user logout
@app.route("/logout")
def logout():
    session.pop("user_id", None)
    session.pop("user_name", None)
    return redirect(url_for("home"))

#API for admin login
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        con = get_connection()
        cmd = con.cursor(dictionary=True)

        cmd.execute("SELECT * FROM admins WHERE email = %s",(email,))

        admin = cmd.fetchone()

        cmd.close()
        con.close()

        if admin is not None and check_password_hash(
            admin["password"], password
        ):
            session["admin_id"] = admin["admin_id"]
            session["admin_email"] = admin["email"]
            flash("Admin login successful!", "success")
            return redirect(url_for("admin_dashboard"))
        else:
            flash("Invalid admin email or password.", "danger")
            return render_template("admin_login.html")

    return render_template("admin_login.html")

#API to remove the session of the admin 
@app.route("/admin/dashboard")
def admin_dashboard():

    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    return render_template("dashboard.html")

#API for admin logout
@app.route("/admin/logout")
def admin_logout():

    session.pop("admin_id", None)
    session.pop("admin_email", None)

    return redirect(url_for("admin_login"))


#API for the menu page
@app.route("/menu")
def menu():
    return render_template("menu.html")

@app.route("/api/menu")
def api_menu():
    con = get_connection()
    cmd = con.cursor(dictionary=True)
    cmd.execute("""
        SELECT
            food_id,
            food_name,
            category,
            description,
            price,
            image,
            availability
        FROM food_items
        WHERE availability = 'Available'
    """)
    foods = cmd.fetchall()
    cmd.close()
    con.close()
    return jsonify(foods)

@app.route("/api/cart/add", methods=["POST"])
def add_to_cart():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]
    data = request.get_json()
    food_id = data.get("food_id")

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    # Check whether the user already has a cart
    cmd.execute("SELECT * FROM cart WHERE user_id=%s",(user_id,))
    cart = cmd.fetchone()

    # Create a cart if it doesn't exist
    if cart is None:
        cmd.execute("INSERT INTO cart(user_id) VALUES(%s)",(user_id,))
        con.commit()
        cart_id = cmd.lastrowid

    else:
        cart_id = cart["cart_id"]

    # Check whether the food is already in the cart
    cmd.execute(
        """
        SELECT *
        FROM cart_items
        WHERE cart_id=%s AND food_id=%s
        """,
        (cart_id, food_id))
    
    item = cmd.fetchone()
    if item:
        cmd.execute(
            """
            UPDATE cart_items
            SET quantity = quantity + 1
            WHERE cart_item_id=%s
            """,
            (item["cart_item_id"],)
        )
    else:
        cmd.execute(
            """
            INSERT INTO cart_items(cart_id, food_id, quantity)
            VALUES(%s,%s,1)
            """,
            (cart_id, food_id)
        )

    con.commit()

    cmd.close()
    con.close()
    return jsonify({
        "success": True,
        "message": "Added to cart"
    })

@app.route("/api/cart", methods=["GET"])
def get_cart():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    cmd.execute("""
        SELECT cart_id
        FROM cart
        WHERE user_id = %s
    """, (user_id,))

    cart = cmd.fetchone()

    if cart is None:

        cmd.close()
        con.close()

        return jsonify([])

    cart_id = cart["cart_id"]

    cmd.execute("""
        SELECT
            ci.cart_item_id,
            ci.food_id,
            fi.food_name,
            fi.description,
            fi.price,
            fi.image,
            ci.quantity
        FROM cart_items ci
        JOIN food_items fi
            ON ci.food_id = fi.food_id
        WHERE ci.cart_id = %s
    """, (cart_id,))

    items = cmd.fetchall()

    cmd.close()
    con.close()

    return jsonify(items)

@app.route("/api/cart/update", methods=["POST"])
def update_cart():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]
    data = request.get_json()

    food_id = data.get("food_id")
    action = data.get("action")      # "increase" or "decrease"

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    # Find the user's cart
    cmd.execute(
        "SELECT cart_id FROM cart WHERE user_id=%s",
        (user_id,)
    )
    cart = cmd.fetchone()

    if not cart:
        cmd.close()
        con.close()
        return jsonify({
            "success": False,
            "message": "Cart not found."
        }), 404

    cart_id = cart["cart_id"]

    # Find the cart item
    cmd.execute(
        """
        SELECT *
        FROM cart_items
        WHERE cart_id=%s AND food_id=%s
        """,
        (cart_id, food_id)
    )

    item = cmd.fetchone()

    if not item:
        cmd.close()
        con.close()
        return jsonify({
            "success": False,
            "message": "Item not found."
        }), 404

    # Increase quantity
    if action == "increase":
        cmd.execute(
            """
            UPDATE cart_items
            SET quantity = quantity + 1
            WHERE cart_item_id=%s
            """,
            (item["cart_item_id"],)
        )

    # Decrease quantity
    elif action == "decrease":

        if item["quantity"] > 1:

            cmd.execute(
                """
                UPDATE cart_items
                SET quantity = quantity - 1
                WHERE cart_item_id=%s
                """,
                (item["cart_item_id"],)
            )

        else:
            cmd.execute(
                """
                DELETE FROM cart_items
                WHERE cart_item_id=%s
                """,
                (item["cart_item_id"],)
            )

    con.commit()

    cmd.close()
    con.close()

    return jsonify({
        "success": True,
        "message": "Cart updated successfully."
    })

@app.route("/api/cart/remove", methods=["POST"])
def remove_from_cart():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]
    data = request.get_json()

    food_id = data.get("food_id")

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    cmd.execute(
        "SELECT cart_id FROM cart WHERE user_id=%s",
        (user_id,)
    )

    cart = cmd.fetchone()

    if not cart:
        cmd.close()
        con.close()
        return jsonify({
            "success": False,
            "message": "Cart not found."
        }), 404

    cmd.execute(
        """
        DELETE FROM cart_items
        WHERE cart_id=%s AND food_id=%s
        """,
        (cart["cart_id"], food_id)
    )

    con.commit()

    cmd.close()
    con.close()

    return jsonify({
        "success": True,
        "message": "Item removed successfully."
    })

@app.route("/api/user")
def get_user():
    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    cmd.execute("""
        SELECT full_name, phone, address
        FROM users
        WHERE user_id=%s
    """, (user_id,))

    user = cmd.fetchone()

    cmd.close()
    con.close()

    return jsonify(user)

@app.route("/api/place-order", methods=["POST"])
def place_order():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    # Get the user's cart
    cmd.execute(
        """
        SELECT cart_id
        FROM cart
        WHERE user_id=%s
        """,
        (user_id,)
    )

    cart = cmd.fetchone()

    if not cart:
        cmd.close()
        con.close()
        return jsonify({
            "success": False,
            "message": "Cart not found."
        }), 404

    cart_id = cart["cart_id"]

    # Get all cart items
    cmd.execute(
        """
        SELECT
            ci.food_id,
            ci.quantity,
            f.price
        FROM cart_items ci
        JOIN food_items f
            ON ci.food_id = f.food_id
        WHERE ci.cart_id=%s
        """,
        (cart_id,)
    )

    cart_items = cmd.fetchall()

    if not cart_items:
        cmd.close()
        con.close()
        return jsonify({
            "success": False,
            "message": "Your cart is empty."
        }), 400

    # Calculate total amount
    # Calculate total amount
    total_amount = 0

    for item in cart_items:
        total_amount += item["price"] * item["quantity"]

    # Insert order into orders table
    cmd.execute(
        """
        INSERT INTO orders(user_id, total_amount)
        VALUES(%s, %s)
        """,
        (user_id, total_amount)
    )

    con.commit()

    order_id = cmd.lastrowid
    for item in cart_items:
        cmd.execute(
        """
        INSERT INTO order_items(order_id, food_id, quantity, price)
        VALUES(%s, %s, %s, %s)
        """,
        (
            order_id,
            item["food_id"],
            item["quantity"],
            item["price"]
        )
    )

    con.commit()
    # Clear all items from the cart
    cmd.execute(
        """
        DELETE FROM cart_items
        WHERE cart_id=%s
        """,
        (cart_id,)
    )

    con.commit()
    return jsonify({
        "success": True,
        "order_id": order_id,
        "total_amount": float(total_amount)
    })

@app.route("/api/orders", methods=["GET"])
def get_orders():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    cmd.execute("""
    SELECT
        o.order_id,
        o.total_amount,
        o.status,
        o.order_date,
        oi.quantity,
        f.food_name
    FROM orders o
    JOIN order_items oi
        ON o.order_id = oi.order_id
    JOIN food_items f
        ON oi.food_id = f.food_id
    WHERE o.user_id = %s
    ORDER BY o.order_date DESC
""", (user_id,))
    orders = cmd.fetchall()
    grouped_orders = {}

    for row in orders:

        order_id = row["order_id"]

        if order_id not in grouped_orders:
            grouped_orders[order_id] = {
                "order_id": order_id,
                "total_amount": float(row["total_amount"]),
                "status": row["status"],
                "order_date": row["order_date"],
                "items": []
            }

        grouped_orders[order_id]["items"].append({
            "food_name": row["food_name"],
            "quantity": row["quantity"]
        })
    cmd.close()
    con.close()

    return jsonify(list(grouped_orders.values()))


@app.route("/api/admin/orders", methods=["GET"])
def admin_orders():

    if "admin_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login as admin."
        }), 401

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    cmd.execute("""
        SELECT
            o.order_id,
            o.total_amount,
            o.status,
            o.order_date,
            u.full_name,
            oi.quantity,
            f.food_name
        FROM orders o
        JOIN users u
            ON o.user_id = u.user_id
        JOIN order_items oi
            ON o.order_id = oi.order_id
        JOIN food_items f
            ON oi.food_id = f.food_id
        ORDER BY o.order_date DESC
    """)

    rows = cmd.fetchall()

    grouped_orders = {}

    for row in rows:

        order_id = row["order_id"]

        if order_id not in grouped_orders:
            grouped_orders[order_id] = {
                "order_id": order_id,
                "customer": row["full_name"],
                "total_amount": float(row["total_amount"]),
                "status": row["status"],
                "order_date": row["order_date"],
                "items": []
            }

        grouped_orders[order_id]["items"].append({
            "food_name": row["food_name"],
            "quantity": row["quantity"]
        })

    cmd.close()
    con.close()

    return jsonify(list(grouped_orders.values()))

@app.route("/api/admin/foods", methods=["GET"])
def admin_foods():

    if "admin_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login as admin."
        }), 401

    con = get_connection()
    cmd = con.cursor(dictionary=True)

    cmd.execute("""
        SELECT
            food_id,
            food_name,
            category,
            description,
            price,
            image,
            availability,
            veg
        FROM food_items
        ORDER BY food_id DESC
    """)

    foods = cmd.fetchall()

    cmd.close()
    con.close()

    return jsonify(foods)

@app.route("/manage-food")
def manage_food():

    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    return render_template("manage_food.html")

@app.route("/api/admin/foods", methods=["POST"])
def add_food():

    if "admin_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login as admin."
        }), 401

    data = request.get_json()

    con = get_connection()
    cmd = con.cursor()

    cmd.execute("""
        INSERT INTO food_items
        (
            food_name,
            category,
            description,
            price,
            image,
            availability,
            veg
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        data["food_name"],
        data["category"],
        data.get("description"),
        data["price"],
        data.get("image"),
        data.get("availability", "Available"),
        data["veg"]
    ))

    con.commit()

    cmd.close()
    con.close()

    return jsonify({
        "success": True,
        "message": "Food added successfully."
    })

@app.route("/api/admin/foods/<int:food_id>", methods=["PUT"])
def update_food(food_id):

    if "admin_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login as admin."
        }), 401

    data = request.get_json()

    con = get_connection()
    cmd = con.cursor()

    cmd.execute("""
        UPDATE food_items
        SET
            food_name=%s,
            category=%s,
            description=%s,
            price=%s,
            image=%s,
            availability=%s,
            veg=%s
        WHERE food_id=%s
    """, (
    data["food_name"],
    data["category"],
    data.get("description"),
    data["price"],
    data.get("image"),
    data.get("availability", "Available"),
    data["veg"],
    food_id
))

    con.commit()

    cmd.close()
    con.close()

    return jsonify({
        "success": True,
        "message": "Dish updated successfully."
    })


@app.route("/api/admin/foods/<int:food_id>", methods=["DELETE"])
def delete_food(food_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM food_items WHERE food_id = %s",(food_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Food deleted successfully"
    })

@app.route("/admin/orders")
def admin_orders_page():
    return render_template("admin_orders.html")

@app.route("/api/admin/orders/<int:order_id>", methods=["PUT"])
def update_order_status(order_id):

    if "admin_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login as admin."
        }), 401

    data = request.get_json()

    con = get_connection()
    cmd = con.cursor()

    cmd.execute("""UPDATE orders SET status = % WHERE order_id = %s """,
                (data["status"], order_id))

    con.commit()

    cmd.close()
    con.close()

    return jsonify({
        "success": True,
        "message": "Status updated successfully."
    })




if __name__ == "__main__":
    app.run(debug=True) 