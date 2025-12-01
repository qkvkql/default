# my_logic.py
import random

# --- Existing function ---
def get_server_time():
    from datetime import datetime
    return f"Time: {datetime.now().strftime('%H:%M:%S')}"

# --- NEW: Function with 1 argument ---
def greet_user(name):
    if not name:
        return "Hello, Stranger!"
    return f"Welcome back, {name}! nice to see you."

# --- NEW: Function with 2 arguments ---
def calculate_sum(a, b):
    # Ensure inputs are numbers (HTML sometimes sends strings)
    try:
        val_a = float(a)
        val_b = float(b)
        return f"The sum of {val_a} and {val_b} is {val_a + val_b}"
    except ValueError:
        return "Error: Please provide valid numbers."