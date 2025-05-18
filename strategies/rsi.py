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

        df = df[['Close']]  # Keep only the closing price
        return df
    except Exception as e:
        print(f"Error fetching data for {stock_symbol}: {e}")
        return None

# -----------------------------------------------------------------------------
# Function to calculate Relative Strength Index (RSI)
# -----------------------------------------------------------------------------
def calculate_rsi(df, period=14):
    """
    Compute the Relative Strength Index (RSI) based on the given period.
    """
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    return df

# -----------------------------------------------------------------------------
# Backtesting Function
# -----------------------------------------------------------------------------
def backtest_strategy(stock_symbol, start_date, end_date, rsi_period=14, oversold_threshold=30, overbought_threshold=70):
    """
    Perform backtesting using an RSI-based strategy:
    - Buy signal when RSI < oversold threshold (default: 30)
    - Sell signal when RSI > overbought threshold (default: 70)
    """
    df = fetch_historical_data(stock_symbol, start_date, end_date)
    if df is None:
        return None  # Return None if data couldn't be fetched
    print("Data fetched successfully", df.tail(1))
    
    # Reset index to make Date a column
    df = df.reset_index()
    
    # Calculate RSI
    df = calculate_rsi(df, period=rsi_period)
    print("RSI calculated successfully")
    
    # Generate buy (1) / sell (-1) signals
    df['Signal'] = 0
    df.loc[df['RSI'] < oversold_threshold, 'Signal'] = 1  # Buy signal
    df.loc[df['RSI'] > overbought_threshold, 'Signal'] = -1  # Sell signal
    df = df.fillna(0)
    print("Signals generated successfully")

    return df

# -----------------------------------------------------------------------------
# Example execution (for debugging/testing)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    stock = "RELIANCE.NS"  # NSE stock symbol (change as needed)
    start = (datetime.today() - timedelta(days=60)).strftime("%Y-%m-%d")
    end = datetime.today().strftime("%Y-%m-%d")

    result = backtest_strategy(stock, start, end)
    
    if result is not None:
        print(result.tail(10))  # Print last 10 rows for testing