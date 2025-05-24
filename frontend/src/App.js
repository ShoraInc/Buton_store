import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";

// Импорт всех страниц
import FlowerShop from "./pages/FlowerShop/FlowerShop";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import MyOrders from "./pages/MyOrders/MyOrders";
import OrderDetail from "./pages/OrderDetail/OrderDetail";
import MyFavorites from "./pages/MyFavorites/MyFavorites";
import ProfileSettings from "./pages/ProfileSettings/ProfileSettings";
import Checkout from "./pages/Checkout/Checkout";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";

// Админские страницы
import AdminPanel from "./pages/Admin/AdminPanel";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminUsers from "./pages/Admin/AdminUsers";
import { CartProvider } from './contexts/CartContext';
import AdminOrderDetail from './pages/Admin/AdminOrderDetail';

// Компонент для отображения загрузки
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '10px' }}>🌸</div>
        <div>Проверка авторизации...</div>
      </div>
    </div>
  );
}

// Основные маршруты приложения
function AppRoutes() {
  const { loading } = useAuth();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/" element={<FlowerShop />} />
      <Route path="/shop" element={<FlowerShop />} />

      {/* Товары */}
      <Route path="/product/:id" element={<ProductDetail />} />

      {/* 
        Защищенные пользовательские маршруты 
        Проверка происходит автоматически в AuthProvider
      */}
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success/:orderId" element={<OrderSuccess />} />
      <Route path="/favorites" element={<MyFavorites />} />
      <Route path="/my-favorites" element={<MyFavorites />} />
      <Route path="/profile" element={<ProfileSettings />} />
      <Route path="/profile/settings" element={<ProfileSettings />} />

      {/* 
        Админские маршруты 
        Проверка админских прав происходит автоматически в AuthProvider
      */}
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />

      {/* 404 страница */}
      <Route path="*" element={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          flexDirection: 'column'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌸</div>
          <div>Страница не найдена</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Возможно, вы ввели неправильный адрес
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;