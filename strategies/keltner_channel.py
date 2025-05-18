import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

# -----------------------------------------------------------------------------
# Function to fetch real historical stock data from Yahoo Finance
# -----------------------------------------------------------------------------
def fetch_historical_data(stock_symbol, start_date, end_date):
    """
    Fetch real historical stock data from Yahoo Finance.
    """
    try:
        stock = yf.Ticker(stock_symbol)
        end_date_plus_one = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
        df = stock.history(start=start_date, end=end_date_plus_one)
        
        if df.empty:
            print(f"⚠ No data found for {stock_symbol}. Check the symbol and date range.")
            return None

        df = df[['High', 'Low', 'Close']]  # Keep necessary columns
        return df
    except Exception as e:
        print(f"Error fetching data for {stock_symbol}: {e}")
        return None

# -----------------------------------------------------------------------------
# Function to calculate Keltner Channels
# -----------------------------------------------------------------------------
def calculate_keltner_channels(df, kc_lookback=20, multiplier=2, atr_lookback=10):
    """
    Compute Keltner Channels (upper, middle, and lower bands).
    """
    tr1 = df['High'] - df['Low']
    tr2 = abs(df['High'] - df['Close'].shift(1))
    tr3 = abs(df['Low'] - df['Close'].shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    atr = tr.ewm(alpha=1/atr_lookback).mean()
    kc_middle = df['Close'].ewm(span=kc_lookback).mean()
    kc_upper = kc_middle + (multiplier * atr)
    kc_lower = kc_middle - (multiplier * atr)
    
    df['KC_Middle'] = kc_middle
    df['KC_Upper'] = kc_upper
    df['KC_Lower'] = kc_lower
    
    return df

# -----------------------------------------------------------------------------
# Function to implement the Keltner Channel strategy
# -----------------------------------------------------------------------------
def implement_kc_strategy(df):
    """
    Generate buy/sell signals based on Keltner Channel:
    - Buy when price crosses above lower band
    - Sell when price crosses below upper band
    """
    df['Signal'] = 0
    for i in range(1, len(df)):
        if df['Close'].iloc[i - 1] < df['KC_Lower'].iloc[i - 1] and df['Close'].iloc[i] > df['Close'].iloc[i - 1]:
            df.at[df.index[i], 'Signal'] = 1  # Buy signal
        elif df['Close'].iloc[i - 1] > df['KC_Upper'].iloc[i - 1] and df['Close'].iloc[i] < df['Close'].iloc[i - 1]:
            df.at[df.index[i], 'Signal'] = -1  # Sell signal

    return df

# -----------------------------------------------------------------------------
# Backtesting Function
# -----------------------------------------------------------------------------
def backtest_strategy(stock_symbol, start_date, end_date):
    """
    Perform backtesting using the Keltner Channel strategy.
    """
    df = fetch_historical_data(stock_symbol, start_date, end_date)
    if df is None:
        return None  # Return None if data couldn't be fetched
    print("Data fetched successfully", df.tail(1))

    df = calculate_keltner_channels(df)
    print("Keltner Channels calculated successfully")
    
    df = implement_kc_strategy(df)
    print("Trading signals generated successfully")
    df = df.reset_index()
    return df[['Signal', 'Close', 'KC_Lower', 'KC_Upper', 'Date']]

# -----------------------------------------------------------------------------
# Example execution (for debugging/testing)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    stock = "AAPL"  # Change to any stock symbol
    start = (datetime.today() - timedelta(days=60)).strftime("%Y-%m-%d")
    end = datetime.today().strftime("%Y-%m-%d")

    result = backtest_strategy(stock, start, end)
    
    if result is not None:
        print(result.tail(10))  # Print last 10 rows for testing