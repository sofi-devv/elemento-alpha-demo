"""
Script para generar datos JSON de portafolios desde archivos Excel.

Archivos de entrada:
- assetgrafica.xlsx: Datos históricos con columnas Date, Provided, Portafolio 32, Portafolio 33, Portafolio 36
- rebalanceoopciones.xlsx: Allocaciones de assets con columnas Asset, BMK Actual, Portafolio 32, Portafolio 33, Portafolio 36
  - Filas 1-15: Assets
  - Filas 16-19: TRM, Expected Return, Volatility, Max Drawdown
"""

import pandas as pd
import json
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
ASSET_GRAFICA_PATH = BASE_DIR / "assetgrafica.xlsx"
REBALANCE_OPTIONS_PATH = BASE_DIR / "rebalanceoopciones.xlsx"
OUTPUT_DIR = BASE_DIR / "lib" / "portfolio" / "data"

def read_rebalance_options():
    """Lee el archivo de opciones de rebalanceo y separa assets de métricas."""
    df = pd.read_excel(REBALANCE_OPTIONS_PATH)
    
    print("Columnas encontradas en rebalanceoopciones.xlsx:")
    print(df.columns.tolist())
    print("\nPrimeras filas:")
    print(df.head(20))
    
    # Normalizar nombres de columnas
    df.columns = df.columns.str.strip()
    
    # Las primeras 15 filas son assets, las últimas 4 son métricas
    assets_df = df.iloc[:15].copy()
    metrics_df = df.iloc[15:19].copy()
    
    return assets_df, metrics_df

def read_asset_grafica():
    """Lee el archivo de gráfica de assets (datos históricos)."""
    df = pd.read_excel(ASSET_GRAFICA_PATH)
    
    print("\nColumnas encontradas en assetgrafica.xlsx:")
    print(df.columns.tolist())
    print("\nPrimeras filas:")
    print(df.head())
    
    # Normalizar nombres de columnas
    df.columns = df.columns.str.strip()
    
    return df

def generate_asset_allocation_json(assets_df):
    """Genera JSON de allocación de assets."""
    allocations = []
    
    # Detectar nombres de columnas
    col_names = assets_df.columns.tolist()
    asset_col = col_names[0]  # Primera columna es Asset
    bmk_col = col_names[1]     # Segunda columna es BMK Actual
    p32_col = col_names[2]     # Tercera columna es Portfolio 32
    p33_col = col_names[3]     # Cuarta columna es Portfolio 33
    p36_col = col_names[4]     # Quinta columna es Portfolio 36
    
    for _, row in assets_df.iterrows():
        asset_name = str(row[asset_col]).strip()
        if pd.isna(asset_name) or asset_name == 'nan':
            continue
            
        allocation = {
            "asset": asset_name,
            "bmkActual": float(row[bmk_col]) if pd.notna(row[bmk_col]) else 0.0,
            "portfolio32": float(row[p32_col]) if pd.notna(row[p32_col]) else 0.0,
            "portfolio33": float(row[p33_col]) if pd.notna(row[p33_col]) else 0.0,
            "portfolio36": float(row[p36_col]) if pd.notna(row[p36_col]) else 0.0,
        }
        allocations.append(allocation)
    
    return allocations

def generate_portfolio_metrics_json(metrics_df):
    """Genera JSON de métricas de portafolios."""
    col_names = metrics_df.columns.tolist()
    asset_col = col_names[0]
    bmk_col = col_names[1]
    p32_col = col_names[2]
    p33_col = col_names[3]
    p36_col = col_names[4]
    
    metrics = {
        "benchmark": {
            "trm": None,
            "expectedReturn": None,
            "volatility": None,
            "maxDrawdown": None,
        },
        "portfolio32": {
            "trm": None,
            "expectedReturn": None,
            "volatility": None,
            "maxDrawdown": None,
        },
        "portfolio33": {
            "trm": None,
            "expectedReturn": None,
            "volatility": None,
            "maxDrawdown": None,
        },
        "portfolio36": {
            "trm": None,
            "expectedReturn": None,
            "volatility": None,
            "maxDrawdown": None,
        },
    }
    
    metric_mapping = {
        "trm": "trm",
        "expected return": "expectedReturn",
        "expectedreturn": "expectedReturn",
        "volatility": "volatility",
        "max drawdown": "maxDrawdown",
        "maxdrawdown": "maxDrawdown",
    }
    
    for _, row in metrics_df.iterrows():
        metric_name = str(row[asset_col]).strip().lower()
        
        for key, json_key in metric_mapping.items():
            if key in metric_name:
                # Benchmark
                if pd.notna(row[bmk_col]):
                    metrics["benchmark"][json_key] = float(row[bmk_col])
                # Portfolio 32
                if pd.notna(row[p32_col]):
                    metrics["portfolio32"][json_key] = float(row[p32_col])
                # Portfolio 33
                if pd.notna(row[p33_col]):
                    metrics["portfolio33"][json_key] = float(row[p33_col])
                # Portfolio 36
                if pd.notna(row[p36_col]):
                    metrics["portfolio36"][json_key] = float(row[p36_col])
                break
    
    return metrics

def generate_historical_data_json(grafica_df):
    """Genera JSON de datos históricos para gráficas."""
    col_names = grafica_df.columns.tolist()
    date_col = col_names[0]
    provided_col = col_names[1] if len(col_names) > 1 else None
    p32_col = col_names[2] if len(col_names) > 2 else None
    p33_col = col_names[3] if len(col_names) > 3 else None
    p36_col = col_names[4] if len(col_names) > 4 else None
    
    historical_data = []
    
    for _, row in grafica_df.iterrows():
        date_value = row[date_col]
        
        # Convertir fecha a string ISO
        if pd.notna(date_value):
            if hasattr(date_value, 'strftime'):
                date_str = date_value.strftime('%Y-%m-%d')
            else:
                date_str = str(date_value)
        else:
            continue
        
        data_point = {
            "date": date_str,
        }
        
        if provided_col and pd.notna(row[provided_col]):
            data_point["provided"] = float(row[provided_col])
        
        if p32_col and pd.notna(row[p32_col]):
            data_point["portfolio32"] = float(row[p32_col])
            
        if p33_col and pd.notna(row[p33_col]):
            data_point["portfolio33"] = float(row[p33_col])
            
        if p36_col and pd.notna(row[p36_col]):
            data_point["portfolio36"] = float(row[p36_col])
        
        historical_data.append(data_point)
    
    return historical_data

def generate_portfolio_history_json(grafica_df):
    """Genera JSON en formato de portfolio-history (dates array + portfolios object)."""
    col_names = grafica_df.columns.tolist()
    date_col = col_names[0]
    provided_col = col_names[1] if len(col_names) > 1 else None
    p32_col = col_names[2] if len(col_names) > 2 else None
    p33_col = col_names[3] if len(col_names) > 3 else None
    p36_col = col_names[4] if len(col_names) > 4 else None
    
    dates = []
    provided = []
    portfolio32 = []
    portfolio33 = []
    portfolio36 = []
    
    for _, row in grafica_df.iterrows():
        date_value = row[date_col]
        
        if pd.isna(date_value):
            continue
            
        if hasattr(date_value, 'strftime'):
            date_str = date_value.strftime('%Y-%m-%d')
        else:
            date_str = str(date_value)
        
        dates.append(date_str)
        
        if provided_col and pd.notna(row[provided_col]):
            provided.append(float(row[provided_col]))
        else:
            provided.append(100.0)
            
        if p32_col and pd.notna(row[p32_col]):
            portfolio32.append(float(row[p32_col]))
        else:
            portfolio32.append(100.0)
            
        if p33_col and pd.notna(row[p33_col]):
            portfolio33.append(float(row[p33_col]))
        else:
            portfolio33.append(100.0)
            
        if p36_col and pd.notna(row[p36_col]):
            portfolio36.append(float(row[p36_col]))
        else:
            portfolio36.append(100.0)
    
    return {
        "dates": dates,
        "portfolios": {
            "provided": provided,
            "portfolio32": portfolio32,
            "portfolio33": portfolio33,
            "portfolio36": portfolio36,
        }
    }

def main():
    # Crear directorios de salida si no existen
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DATA_DIR = BASE_DIR / "public" / "data"
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("Leyendo archivos Excel...")
    print("=" * 60)
    
    # Leer archivos
    assets_df, metrics_df = read_rebalance_options()
    grafica_df = read_asset_grafica()
    
    print("\n" + "=" * 60)
    print("Generando JSON...")
    print("=" * 60)
    
    # Generar JSONs
    asset_allocation = generate_asset_allocation_json(assets_df)
    portfolio_metrics = generate_portfolio_metrics_json(metrics_df)
    historical_data = generate_historical_data_json(grafica_df)
    portfolio_history = generate_portfolio_history_json(grafica_df)
    
    # Guardar JSONs en lib/portfolio/data
    allocation_path = OUTPUT_DIR / "assetAllocation.json"
    with open(allocation_path, 'w', encoding='utf-8') as f:
        json.dump(asset_allocation, f, indent=2, ensure_ascii=False)
    print(f"\nGuardado: {allocation_path}")
    
    metrics_path = OUTPUT_DIR / "portfolioMetrics.json"
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(portfolio_metrics, f, indent=2, ensure_ascii=False)
    print(f"Guardado: {metrics_path}")
    
    historical_path = OUTPUT_DIR / "historicalData.json"
    with open(historical_path, 'w', encoding='utf-8') as f:
        json.dump(historical_data, f, indent=2, ensure_ascii=False)
    print(f"Guardado: {historical_path}")
    
    # Archivo combinado para TypeScript
    combined = {
        "assetAllocation": asset_allocation,
        "portfolioMetrics": portfolio_metrics,
        "historicalData": historical_data,
    }
    
    combined_path = OUTPUT_DIR / "portfolioData.json"
    with open(combined_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    print(f"Guardado: {combined_path}")
    
    # Guardar portfolio-history.json en public/data (formato para fetch)
    history_path = PUBLIC_DATA_DIR / "portfolio-history.json"
    with open(history_path, 'w', encoding='utf-8') as f:
        json.dump(portfolio_history, f, ensure_ascii=False)
    print(f"Guardado: {history_path}")
    
    print("\n" + "=" * 60)
    print("Resumen de datos generados:")
    print("=" * 60)
    print(f"- Assets: {len(asset_allocation)}")
    print(f"- Portafolios con métricas: {len(portfolio_metrics)}")
    print(f"- Puntos de datos históricos: {len(historical_data)}")
    
    # Mostrar preview
    print("\n--- Preview Asset Allocation ---")
    for a in asset_allocation[:3]:
        print(f"  {a['asset']}: BMK={a['bmkActual']}, P32={a['portfolio32']}, P33={a['portfolio33']}, P36={a['portfolio36']}")
    print("  ...")
    
    print("\n--- Preview Portfolio Metrics ---")
    for k, v in portfolio_metrics.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
