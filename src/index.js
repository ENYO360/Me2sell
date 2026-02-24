import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider } from './context/AuthContext';
import { DirectSaleProvider } from './context/DirectSaleContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmationModalProvider } from './context/ConfirmationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { NetworkProvider } from './context/NetworkContext';
import { LoadingProvider } from './context/LoadingContext';
import { ModeProvider } from './context/UserModeContext';
import { ProductProvider } from './context/ProductContext';
import { DashboardProvider } from './context/DashboardContext';
import { MetaProvider } from './context/MetaContext';
import { MarketplaceProvider } from './context/MarketPlaceContext';
import { SellerCacheProvider } from './context/SellerCacheContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LoadingProvider>
      <BrowserRouter>
        <ModeProvider>
          <NetworkProvider>
            <CurrencyProvider>
              <ConfirmationModalProvider>
                <ThemeProvider>
                  <MetaProvider>
                    <ProductProvider>
                      <SearchProvider>
                        <AuthProvider>
                          <NotificationProvider>
                            <CartProvider>
                              <DirectSaleProvider>
                                <MarketplaceProvider>
                                  <SellerCacheProvider>
                                    <DashboardProvider>
                                      <App />
                                    </DashboardProvider>
                                  </SellerCacheProvider>
                                </MarketplaceProvider>
                              </DirectSaleProvider>
                            </CartProvider>
                          </NotificationProvider>
                        </AuthProvider>
                      </SearchProvider>
                    </ProductProvider>
                  </MetaProvider>
                </ThemeProvider>
              </ConfirmationModalProvider>
            </CurrencyProvider>
          </NetworkProvider>
        </ModeProvider>
      </BrowserRouter>
    </LoadingProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
