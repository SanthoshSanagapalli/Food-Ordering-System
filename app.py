from flask import Flask, render_template, request, redirect, session, url_for,jsonify
from werkzeug.security import generate_password_hash,check_password_hash
from dbconnection import get_connection


app = Flask("__name__")
app.secret_key = "abc"


# Home page
@app.route("/")
def home():
    return render_template("index.html")


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
            return "Passwords do not match"

        # Connect to MySQL
        con = get_connection()
        cmd = con.cursor()

        # Check whether email is already registered
        cmd.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cmd.fetchone()

        if existing_user is not None:
            cmd.close()
            con.close()
            return "Email already registered"

        # Hash the password before storing it
        hashed_password = generate_password_hash(password)

        # Insert user into database
        cmd.execute(
            """
            INSERT INTO users (full_name, email, phone, password,address)
            VALUES (%s, %s, %s, %s,%s)
            """,
            (full_name, email, phone, hashed_password,address)
        )

        con.commit()

        # Close database connection
        cmd.close()
        con.close()

        # Redirect to login page after successful registration
        return redirect(url_for("login"))


    return render_template("register.html")


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
            return "Invalid email or password"
        
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

        cmd.execute(
            "SELECT * FROM admins WHERE email = %s",
            (email,)
        )

        admin = cmd.fetchone()

        cmd.close()
        con.close()

        if admin is not None and check_password_hash(
            admin["password"], password
        ):
            session["admin_id"] = admin["admin_id"]
            session["admin_email"] = admin["email"]

            return redirect(url_for("admin_dashboard"))

        return "Invalid admin email or password"

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
    con = get_connection()
    cmd = con.cursor(dictionary=True)
    cmd.execute("SELECT * FROM food_items WHERE availability='Available'")
    foods = cmd.fetchall()
    con.commit()
    cmd.close()
    con.close()

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


if __name__ == "__main__":
    app.run(debug=True) 