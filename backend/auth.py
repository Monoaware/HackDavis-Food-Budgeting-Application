# backend/auth.py
import os
import datetime
import jwt
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

print(f"[DEBUG] MONGO_URI: {MONGO_URI}")
print(f"[DEBUG] JWT_SECRET exists: {JWT_SECRET is not None}")

client = MongoClient(MONGO_URI)
db = client["meal_app"]
users_collection = db["users"]

print(f"[DEBUG] MongoDB connection established")
print(f"[DEBUG] Database: {db.name}, Collection: {users_collection.name}")


def signup_user(first, last, email, password):
    """Insert new user into MongoDB"""
    print(f"[SIGNUP] Received: first={first}, last={last}, email={email}")

    if not first or not last or not email or not password:
        print("[SIGNUP] Error: Missing required fields")
        return {"error": "All fields are required"}, 400

    existing_user = users_collection.find_one({"email": email})
    print(f"[SIGNUP] Checking existing user: {existing_user is not None}")

    if existing_user:
        print(f"[SIGNUP] Error: Email {email} already exists")
        return {"error": "Email already exists"}, 409

    hashed_password = generate_password_hash(
        password,
        method="pbkdf2:sha256"
    )
    print("[SIGNUP] Password hashed successfully")

    user = {
        "first_name": first,
        "last_name": last,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    }

    try:
        result = users_collection.insert_one(user)
        print(f"[SIGNUP] User {email} created successfully")
        print(f"[SIGNUP] Inserted ID: {result.inserted_id}")
    except Exception as e:
        print(f"[SIGNUP] Error inserting user: {e}")
        return {"error": f"Database error: {str(e)}"}, 500

    return {"message": "User created successfully"}, 201


def login_user(email, password):
    """Authenticate user and return JWT token"""
    print(f"[LOGIN] Attempting login for: {email}")

    if not email or not password:
        print("[LOGIN] Error: Missing email or password")
        return {"error": "Email and password are required"}, 400

    user = users_collection.find_one({"email": email})
    print(f"[LOGIN] User found: {user is not None}")

    if not user:
        print(f"[LOGIN] Error: User {email} not found")
        return {"error": "Invalid email or password"}, 401

    if not check_password_hash(user["password"], password):
        print(f"[LOGIN] Error: Invalid password for {email}")
        return {"error": "Invalid email or password"}, 401

    print(f"[LOGIN] Password verified for {email}")
    token = jwt.encode(
        {
            "email": user["email"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        },
        JWT_SECRET,
        algorithm="HS256"
    )
    print(f"[LOGIN] JWT token generated for {email}")

    return {
        "message": "Login successful",
        "token": token
    }, 200