const express = require('express');
const router = express.Router();
const {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
} = require('../controllers/clientController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, admin, getClients)
    .post(protect, admin, createClient);

router.route('/:id')
    .get(protect, admin, getClientById)
    .put(protect, admin, updateClient)
    .delete(protect, admin, deleteClient);

module.exports = router;
