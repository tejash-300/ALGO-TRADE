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
# Function to calculate moving averages
# -----------------------------------------------------------------------------
def calculate_moving_averages(df, short_window=10, long_window=30):
    """
    Calculate 5-day (short) and 30-day (long) simple moving averages (SMA).
    """
    df['SMA_Short'] = df['Close'].rolling(window=short_window).mean()
    df['SMA_Long'] = df['Close'].rolling(window=long_window).mean()
    return df

# -----------------------------------------------------------------------------
# Backtesting Function
# -----------------------------------------------------------------------------
def backtest_strategy(stock_symbol, start_date, end_date):
    """
    Perform backtesting using an SMA crossover strategy:
    - Buy signal when short-term SMA crosses above long-term SMA.
    - Sell signal when short-term SMA crosses below long-term SMA.
    """
    df = fetch_historical_data(stock_symbol, start_date, end_date)
    if df is None:
        return None  # Return None if data couldn't be fetched
    print("Data fetched successfully", df.tail(1))
    
    # Reset index to make Date a column
    df = df.reset_index()
    
    # Calculate moving averages
    df = calculate_moving_averages(df)
    print("Moving averages calculated successfully")
    
    # Generate buy (1) / sell (-1) signals
    df['Signal'] = 0
    df.loc[df['SMA_Short'] > df['SMA_Long'], 'Signal'] = 1  # Buy signal
    df.loc[df['SMA_Short'] < df['SMA_Long'], 'Signal'] = -1  # Sell signal
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
