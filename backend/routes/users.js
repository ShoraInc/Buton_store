const express = require("express");
const {
    usersFindAll,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getTopBuyers,
    getUsersStatistics,
    getCurrentUser
} = require("../controllers/userscontroller");
const { authMiddleware } = require("../middleware/auth"); // Импорт middleware

const router = express.Router();

// 📊 СТАТИСТИЧЕСКИЕ МАРШРУТЫ (без авторизации - только для админов)
router.get("/statistics", getUsersStatistics);           // GET /users/statistics
router.get("/top-buyers", getTopBuyers);                // GET /users/top-buyers?limit=10&period=month

// 👤 МАРШРУТ ДЛЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (требует авторизацию)
router.get("/me", authMiddleware, getCurrentUser);       // GET /users/me - получить данные текущего пользователя

// 👥 CRUD МАРШРУТЫ
router.get("/", usersFindAll);                          // GET /users
router.get("/:id", getUserById);                        // GET /users/:id
router.post("/", createUser);                           // POST /users
router.put("/:id", updateUser);                         // PUT /users/:id
router.delete("/:id", deleteUser);                      // DELETE /users/:id

module.exports = router;