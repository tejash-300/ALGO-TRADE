import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

# -----------------------------------------------------------------------------
# Function to fetch real historical stock data from Yahoo Finance
# -----------------------------------------------------------------------------
def fetch_historical_data(stock_symbol, start_date, end_date):
    """
    Fetch historical stock data from Yahoo Finance.
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
# Function to calculate Rate of Change (ROC)
# -----------------------------------------------------------------------------
def calculate_roc(df, n):
    """
    Compute the Rate of Change (ROC) over a given period.
    """
    df[f'ROC_{n}'] = df['Close'].pct_change(n) * 100
    return df

# -----------------------------------------------------------------------------
# Function to calculate Know Sure Thing (KST) Indicator
# -----------------------------------------------------------------------------
def calculate_kst(df, sma1, sma2, sma3, sma4, roc1, roc2, roc3, roc4, signal):
    """
    Compute the Know Sure Thing (KST) indicator.
    """
    df = calculate_roc(df, roc1)
    df = calculate_roc(df, roc2)
    df = calculate_roc(df, roc3)
    df = calculate_roc(df, roc4)

    df['KST'] = (df[f'ROC_{roc1}'].rolling(sma1).mean() * 1 +
                 df[f'ROC_{roc2}'].rolling(sma2).mean() * 2 +
                 df[f'ROC_{roc3}'].rolling(sma3).mean() * 3 +
                 df[f'ROC_{roc4}'].rolling(sma4).mean() * 4)
    
    df['Signal_Line'] = df['KST'].rolling(signal).mean()
    return df

# -----------------------------------------------------------------------------
# Function to Implement KST Crossover Trading Strategy
# -----------------------------------------------------------------------------
def implement_kst_strategy(df):
    """
    Generate buy and sell signals based on KST and signal line crossovers.
    """
    df['Signal'] = 0
    
    # Buy when KST crosses above the signal line
    df.loc[(df['KST'].shift(1) < df['Signal_Line'].shift(1)) & (df['KST'] > df['Signal_Line']), 'Signal'] = 1
    
    # Sell when KST crosses below the signal line
    df.loc[(df['KST'].shift(1) > df['Signal_Line'].shift(1)) & (df['KST'] < df['Signal_Line']), 'Signal'] = -1
    
    return df

# -----------------------------------------------------------------------------
# Backtesting Function
# -----------------------------------------------------------------------------
def backtest_strategy(stock_symbol, start_date, end_date):
    """
    Perform backtesting using the KST-based strategy.
    """
    df = fetch_historical_data(stock_symbol, start_date, end_date)
    if df is None:
        return None  # Return None if data couldn't be fetched
    print("Data fetched successfully", df.tail(1))

    # Reset index to make Date a column
    df = df.reset_index()

    # Calculate KST indicator
    df = calculate_kst(df, sma1=10, sma2=10, sma3=10, sma4=15, roc1=10, roc2=15, roc3=20, roc4=30, signal=9)
    print("KST indicator calculated successfully")

    # Generate buy/sell signals
    df = implement_kst_strategy(df)
    print("Trading signals generated successfully")

    return df[['Date', 'Close', 'KST', 'Signal_Line', 'Signal']]

# -----------------------------------------------------------------------------
# Example execution (for debugging/testing)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    stock = "AAPL"  # Change as needed
    start = (datetime.today() - timedelta(days=365)).strftime("%Y-%m-%d")  # 1-year historical data
    end = datetime.today().strftime("%Y-%m-%d")

    result = backtest_strategy(stock, start, end)

    if result is not None:
        print(result.tail(10))  # Print last 10 rows for testing