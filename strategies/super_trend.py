import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

# -----------------------------------------------------------------------------
# Function to fetch historical stock data from Yahoo Finance
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

        df = df[['High', 'Low', 'Close']]  # Keep required columns
        return df
    except Exception as e:
        print(f"Error fetching data for {stock_symbol}: {e}")
        return None

# -----------------------------------------------------------------------------
# Function to calculate the Supertrend Indicator
# -----------------------------------------------------------------------------
def calculate_supertrend(df, lookback=10, multiplier=3):
    """
    Compute the Supertrend indicator.
    """
    high, low, close = df['High'], df['Low'], df['Close']
    
    # Calculate True Range (TR) and Average True Range (ATR)
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=lookback, min_periods=1).mean()
    
    # Calculate Basic Upper and Lower Bands
    hl_avg = (high + low) / 2
    upper_band = hl_avg + (multiplier * atr)
    lower_band = hl_avg - (multiplier * atr)
    
    # Initialize Supertrend and Uptrend/Downtrend arrays
    supertrend = pd.Series(index=df.index)
    
    for i in range(len(df)):
        if i == 0:
            supertrend.iloc[i] = 0  # Default initialization
        elif supertrend.iloc[i-1] == upper_band.iloc[i-1] and close.iloc[i] < upper_band.iloc[i]:
            supertrend.iloc[i] = upper_band.iloc[i]
        elif supertrend.iloc[i-1] == upper_band.iloc[i-1] and close.iloc[i] > upper_band.iloc[i]:
            supertrend.iloc[i] = lower_band.iloc[i]
        elif supertrend.iloc[i-1] == lower_band.iloc[i-1] and close.iloc[i] > lower_band.iloc[i]:
            supertrend.iloc[i] = lower_band.iloc[i]
        elif supertrend.iloc[i-1] == lower_band.iloc[i-1] and close.iloc[i] < lower_band.iloc[i]:
            supertrend.iloc[i] = upper_band.iloc[i]
    
    df['Supertrend'] = supertrend
    return df

# -----------------------------------------------------------------------------
# Backtesting Function for Supertrend Strategy
# -----------------------------------------------------------------------------
def backtest_strategy(stock_symbol, start_date, end_date, lookback=10, multiplier=3):
    """
    Perform backtesting using a Supertrend-based strategy:
    - Buy when price crosses above Supertrend
    - Sell when price crosses below Supertrend
    """
    df = fetch_historical_data(stock_symbol, start_date, end_date)
    if df is None:
        return None  # Return None if data couldn't be fetched
    print("Data fetched successfully", df.tail(1))
    
    # Reset index to make Date a column
    df = df.reset_index()
    
    # Calculate Supertrend
    df = calculate_supertrend(df, lookback=lookback, multiplier=multiplier)
    print("Supertrend calculated successfully")
    
    # Generate buy (1) / sell (-1) signals
    df['Signal'] = 0
    df.loc[df['Close'] > df['Supertrend'], 'Signal'] = 1  # Buy signal
    df.loc[df['Close'] < df['Supertrend'], 'Signal'] = -1  # Sell signal
    df = df.fillna(0)
    print("Signals generated successfully")

    return df

# -----------------------------------------------------------------------------
# Example execution (for debugging/testing)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    stock = "AAPL"  # Example stock symbol
    start = (datetime.today() - timedelta(days=60)).strftime("%Y-%m-%d")
    end = datetime.today().strftime("%Y-%m-%d")

    result = backtest_strategy(stock, start, end)
    
    if result is not None:
        print(result.tail(10))  # Print last 10 rows for testing