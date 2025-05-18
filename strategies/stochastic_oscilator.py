import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

plt.style.use('fivethirtyeight')
plt.rcParams['figure.figsize'] = (20,10)

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

        df = df[['Open', 'High', 'Low', 'Close']]  # Keep only relevant columns
        return df
    except Exception as e:
        print(f"Error fetching data for {stock_symbol}: {e}")
        return None

# -----------------------------------------------------------------------------
# Function to calculate Stochastic Oscillator
# -----------------------------------------------------------------------------
def calculate_stochastic_oscillator(df, k_lookback=14, d_lookback=3):
    """
    Compute the Stochastic Oscillator.
    %K = (Close - Lowest Low) / (Highest High - Lowest Low) * 100
    %D = 3-day moving average of %K
    """
    df['Lowest_Low'] = df['Low'].rolling(window=k_lookback).min()
    df['Highest_High'] = df['High'].rolling(window=k_lookback).max()
    
    df['%K'] = ((df['Close'] - df['Lowest_Low']) / (df['Highest_High'] - df['Lowest_Low'])) * 100
    df['%D'] = df['%K'].rolling(window=d_lookback).mean()
    
    return df.drop(columns=['Lowest_Low', 'Highest_High'])

# -----------------------------------------------------------------------------
# Function to calculate MACD
# -----------------------------------------------------------------------------
def calculate_macd(df, slow=26, fast=12, smooth=9):
    """
    Compute the Moving Average Convergence Divergence (MACD) indicator.
    """
    df['MACD'] = df['Close'].ewm(span=fast, adjust=False).mean() - df['Close'].ewm(span=slow, adjust=False).mean()
    df['MACD_Signal'] = df['MACD'].ewm(span=smooth, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    return df

# -----------------------------------------------------------------------------
# Backtesting: Stochastic Oscillator + MACD Trading Strategy
# -----------------------------------------------------------------------------
def backtest_strategy(stock_symbol, start_date, end_date):
    """
    Perform backtesting using a Stochastic Oscillator + MACD trading strategy.
    - Buy when %K < 30, %D < 30, MACD < -2, and MACD Signal < -2
    - Sell when %K > 70, %D > 70, MACD > 2, and MACD Signal > 2
    """
    df = fetch_historical_data(stock_symbol, start_date, end_date)
    if df is None:
        return None
    
    df = calculate_stochastic_oscillator(df)
    df = calculate_macd(df)
    
    # Initialize strategy variables
    buy_price, sell_price, signals = [], [], []
    signal = 0  # 1 = buy, -1 = sell, 0 = hold

    for i in range(len(df)):
        if df['%K'][i] < 30 and df['%D'][i] < 30 and df['MACD'][i] < -2 and df['MACD_Signal'][i] < -2:
            if signal != 1:
                buy_price.append(df['Close'][i])
                sell_price.append(None)
                signal = 1
            else:
                buy_price.append(None)
                sell_price.append(None)
            signals.append(signal)
        
        elif df['%K'][i] > 70 and df['%D'][i] > 70 and df['MACD'][i] > 2 and df['MACD_Signal'][i] > 2:
            if signal != -1:
                buy_price.append(None)
                sell_price.append(df['Close'][i])
                signal = -1
            else:
                buy_price.append(None)
                sell_price.append(None)
            signals.append(signal)
        
        else:
            buy_price.append(None)
            sell_price.append(None)
            signals.append(0)
    
    df['Buy_Signal'] = buy_price
    df['Sell_Signal'] = sell_price
    df['Signal'] = signals
    df = df.reset_index()
    return df[['Date', 'Close', '%K', '%D', 'MACD', 'MACD_Signal', 'MACD_Hist', 'Buy_Signal', 'Sell_Signal', 'Signal']]

# -----------------------------------------------------------------------------
# Plot MACD Indicator
# -----------------------------------------------------------------------------
def plot_macd(df, stock_symbol):
    """
    Plot MACD indicator along with the stock's closing price.
    """
    plt.figure(figsize=(14, 7))
    
    ax1 = plt.subplot2grid((11,1), (0,0), rowspan=5, colspan=1)
    ax2 = plt.subplot2grid((11,1), (6,0), rowspan=5, colspan=1)

    ax1.plot(df['Close'], linewidth=2.5, label='Close Price')
    ax1.set_title(f'{stock_symbol} Stock Prices')

    ax2.plot(df['MACD'], color='grey', linewidth=1.5, label='MACD')
    ax2.plot(df['MACD_Signal'], color='skyblue', linewidth=1.5, label='Signal')
    ax2.bar(df.index, df['MACD_Hist'], color=['red' if x < 0 else 'green' for x in df['MACD_Hist']])
    ax2.set_title('MACD Indicator')
    
    ax1.legend()
    ax2.legend()
    plt.show()

# -----------------------------------------------------------------------------
# Example Execution
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    stock = "AAPL"  # Change to any stock symbol
    start = "2010-01-01"
    end = "2024-03-01"
    
    df = backtest_strategy(stock, start, end)
    if df is not None:
        print("Backtesting Completed\n", df.tail())
        plot_macd(df, stock)