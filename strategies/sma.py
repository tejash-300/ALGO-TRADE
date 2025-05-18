# Simple Moving Average Crossover Strategy

def moving_average(prices, window_size):
    """Calculate the moving average over a given window size."""
    if len(prices) < window_size:
        return None  # Not enough data points
    return sum(prices[-window_size:]) / window_size

def trading_strategy(prices, short_window=5, long_window=10):
    """Generates a buy/sell signal based on moving average crossover."""
    if len(prices) < long_window:
        return "No Signal"  # Not enough data

    short_ma = moving_average(prices, short_window)
    long_ma = moving_average(prices, long_window)

    if short_ma and long_ma:
        if short_ma > long_ma:
            return "Buy"
        elif short_ma < long_ma:
            return "Sell"
    
    return "Hold"

# Example usage
if __name__ == "__main__":
    price_data = [100, 102, 101, 105, 110, 108, 107, 112, 115, 117, 120]
    signal = trading_strategy(price_data)
    print(f"Trading Signal: {signal}")
