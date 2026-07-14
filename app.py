from flask import Flask, render_template, request, redirect, session, url_for
from werkzeug.security import generate_password_hash,check_password_hash
from dbconnection import get_connection


app = Flask("__name__")
app.secret_key = "abc"


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# User registration
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

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(debug=True) 