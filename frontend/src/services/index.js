// services/index.js
export { authService } from './authService';
export { cartService } from './cartService';
export { favoriteService } from './favoriteService';

export {
  productsAPI,
  usersAPI,
  uploadAPI,
  authAPI,
  cartAPI,
  favoritesAPI,
  ordersAPI, // ✅ Используем ordersAPI из api.js
  apiUtils
} from './api';