import mysql.connector
def get_connection():
    conn = mysql.connector.connect(
        host ="localhost",
        user = "root",
        password = "root",
        database = "food"
    )
    return conn




"""
        To Check Whether the databases is connected successfully or not

if conn.is_connected():
    print("Database conneted")
else:
    print("not conneted")"""