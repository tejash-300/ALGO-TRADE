import os
import time
import threading
from logzero import logger
import requests
import importlib.util
import pandas as pd
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from SmartApi import SmartConnect
import pyotp
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# SmartAPI Credentials
API_KEY = os.getenv("API_KEY")
USERNAME = os.getenv("USERNAME")
PASSWORD = os.getenv("PASSWORD")
TOTP_SECRET = os.getenv("TOTP")

# Supabase Credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Flask App
app = Flask(__name__)

# Dictionary to store running bot threads and stop flags
running_bots = {}

# Logs storage
logs = []

def log_message(message):
    """Stores logs in memory for frontend retrieval."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logs.insert(0, f"[{timestamp}] {message}")  # Insert new logs at the beginning
    print(f"[LOG] {message}")  # Also print logs in console

def get_symbol_token(stock_symbol):
    df = pd.read_csv("instruments.csv")
    result = df[df["symbol"] == stock_symbol]
    if not result.empty:
        return result.iloc[0]["token"]
    else:
        log_message(f"Symbol token not found for {stock_symbol}")
        return None

# Function to initialize SmartAPI connection
def init_smartapi():
    try:
        smartapi = SmartConnect(api_key=API_KEY)
        totp = pyotp.TOTP(TOTP_SECRET).now()
        data = smartapi.generateSession(USERNAME, PASSWORD, totp)

        if not data.get("status"):
            log_message(f"SmartAPI Login Failed: {data}")
            return None
        
        log_message("SmartAPI Login Successful.")
        return smartapi
    except Exception as e:
        log_message(f"SmartAPI Initialization Failed: {str(e)}")
        return None

# Function to fetch strategy file from Supabase
def fetch_strategy_file(strategy_filename):
    try:
        log_message(f"Fetching strategy file: {strategy_filename}")
        response = supabase.storage.from_("strategies").download(strategy_filename)
        
        if not response:
            log_message(f"Strategy file {strategy_filename} not found.")
            return None

        return response
    except Exception as e:
        log_message(f"Error fetching strategy file from Supabase: {str(e)}")
        return None

# Function to dynamically load strategy module
def load_strategy_module(strategy_filename):
    strategy_code = fetch_strategy_file(strategy_filename)
    if strategy_code is None:
        return None
    # strategy_code = open("trend_follow_99b667f0-70b4-4591-829c-9af7b468b8a6.py", "rb").read()
    module_name = strategy_filename.replace(".py", "")
    spec = importlib.util.spec_from_loader(module_name, loader=None)
    strategy_module = importlib.util.module_from_spec(spec)
    exec(strategy_code.decode("utf-8"), strategy_module.__dict__)
    
    return strategy_module

# Function to place an order
def place_order(smartapi, tradingsymbol, transaction_type, quantity, price, user_id, bot_id, product_type="INTRADAY"):
    tradingsymbol = tradingsymbol + "-EQ"
    try:
        logger.info(f"Placing {transaction_type} order for {tradingsymbol} - Qty: {quantity}, Price: {price}")
        order_params = {
            "variety": "NORMAL",
            "tradingsymbol": tradingsymbol,
            "symboltoken": get_symbol_token(tradingsymbol),
            "transactiontype": transaction_type,
            "exchange": "NSE",
            "ordertype": "LIMIT",
            "producttype": product_type,
            "duration": "DAY",
            "price": price,
            "quantity": quantity
        }
        order_id = smartapi.placeOrder(order_params)
        logger.info(f"Order ID: {order_id}")
        # Insert the executed order into Supabase
        order_data = {
            "order_id": order_id,
            "type": transaction_type,
            "ticker": tradingsymbol,
            "price": price,
            "quantity": quantity,
            "execution_time": datetime.now().isoformat(),
            "user_id": user_id,
            "bot_id": bot_id
        }
        supabase.table("bot_orders").insert(order_data).execute()

        log_message(f"Order placed successfully. Order ID: {order_id}")
        return {"success": True, "order_id": order_id}
    except Exception as e:
        logger.exception("Order placement failed.")
        return {"success": False, "error": str(e)}


# Bot execution function (runs in a separate thread)
def bot_execution(bot_id, stock_symbol, strategy_filename, user_id):
    global running_bots
    smartapi = init_smartapi()
    
    if not smartapi:
        log_message("SmartAPI login failed")
        return
    
    strategy_module = load_strategy_module(strategy_filename)
    if not strategy_module:
        log_message("Failed to load strategy")
        return

    stop_flag = running_bots[bot_id]["stop_flag"]

    while not stop_flag.is_set():  # Check stop flag to exit immediately
        try:
            log_message(f"Executing strategy for {stock_symbol}...")
            backtest_results = strategy_module.backtest_strategy(
                f"{stock_symbol}.NS",
                (datetime.today() - timedelta(days=60)).strftime("%Y-%m-%d"), 
                datetime.now().strftime("%Y-%m-%d")
            )

            if backtest_results is None or backtest_results.empty:
                log_message(f"No backtest results for {stock_symbol}. Retrying in 10 seconds.")
                stop_flag.wait(10)  # Sleep but allows immediate stop
                continue

            latest_signal = backtest_results["Signal"].iloc[-1]
            latest_close = backtest_results["Close"].iloc[-1]

            if latest_signal == 1:
                log_message(f"Buy signal detected for {stock_symbol}.")
                place_order(smartapi, stock_symbol, "BUY", 50, latest_close, user_id, bot_id)

            elif latest_signal == -1:
                log_message(f"Sell signal detected for {stock_symbol}.")
                place_order(smartapi, stock_symbol, "SELL", 50, latest_close, user_id=user_id, bot_id=bot_id)

            stop_flag.wait(10)  # Sleep but allows immediate stop

        except Exception as e:
            log_message(f"Error in bot execution: {str(e)}")
            break

    log_message(f"Bot {bot_id} stopped.")

# API Endpoint: Start a Bot
@app.route("/start-bot", methods=["POST"])
def start_bot():
    data = request.json
    bot_id = data.get("bot_id")
    stock_symbol = data.get("stock_symbol")
    user_id = data.get("user_id")
    print(user_id)

    if bot_id in running_bots:
        return jsonify({"success": False, "error": "Bot is already running"}), 400

    strategy_id_response = supabase.table("bots").select("strategy_id").eq("id", bot_id).execute()
    strategy_id = strategy_id_response.data[0]["strategy_id"]
    strategy_name_response = supabase.table("py_strategies").select("file_path").eq("id", strategy_id).execute()
    strategy_filename = strategy_name_response.data[0]["file_path"]

    stop_flag = threading.Event()
    bot_thread = threading.Thread(target=bot_execution, args=(bot_id, stock_symbol, strategy_filename, user_id), daemon=True)
    
    running_bots[bot_id] = {"thread": bot_thread, "stop_flag": stop_flag}
    bot_thread.start()

    log_message(f"Bot {bot_id} started.")
    return jsonify({"success": True, "message": f"Bot {bot_id} started"}), 200

# API Endpoint: Stop a Bot
@app.route("/stop-bot", methods=["POST"])
def stop_bot():
    data = request.json
    bot_id = data.get("bot_id")

    if bot_id not in running_bots:
        log_message(f"Bot {bot_id} is not running")
        return jsonify({"success": False, "error": "Bot is not running"}), 400

    log_message(f"Stopping bot {bot_id}...")
    running_bots[bot_id]["stop_flag"].set()
    running_bots[bot_id]["thread"].join()
    del running_bots[bot_id]

    return jsonify({"success": True, "message": f"Bot {bot_id} stopped"}), 200

# API Endpoint: Fetch logs
@app.route("/logs", methods=["GET"])
def get_logs():
    return jsonify({"logs": logs[:20]}), 200  # Limit to last 50 logs


@app.route("/backtest", methods=["POST"])
def backtest():
    data = request.json
    strategy_id = data.get("strategy_id")
    stock_symbol = data.get("stock_symbol") + ".NS"
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    # Fetch strategy file from Supabase
    strategy_name_response = supabase.table("py_strategies").select("file_path").eq("id", strategy_id).execute()
    if not strategy_name_response.data:
        return jsonify({"success": False, "error": "Strategy not found"}), 404

    strategy_filename = strategy_name_response.data[0]["file_path"]
    strategy_module = load_strategy_module(strategy_filename)
    if not strategy_module:
        return jsonify({"success": False, "error": "Failed to load strategy"}), 500

    try:
        logger.info(f"Running backtest for {stock_symbol} from {start_date} to {end_date}")
        backtest_results = strategy_module.backtest_strategy(stock_symbol, start_date, end_date)
        backtest_results = backtest_results.fillna(0)
        backtest_results = backtest_results.reset_index()
        backtest_results = backtest_results.to_dict(orient="records")
        if backtest_results is None or len(backtest_results) == 0:
            return jsonify({"success": False, "error": "No backtest results found"}), 404
        logger.info("Backtest successful.")
        print(backtest_results, type(backtest_results))
        return jsonify({"success": True, "results": backtest_results})
    except Exception as e:
        logger.exception("Backtest failed.")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/")
def home():
    return "Hello, Flask is running!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT"))
