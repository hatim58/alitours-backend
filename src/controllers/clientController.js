const prisma = require('../config/db');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private/Admin
const getClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { quotations: true, bookings: true },
                },
            },
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Private/Admin
const getClientById = async (req, res) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                quotations: true,
                bookings: true,
                payments: true,
            },
        });
        if (client) {
            res.json(client);
        } else {
            res.status(404).json({ message: 'Client not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private/Admin
const createClient = async (req, res) => {
    const { name, email, phone, address } = req.body;

    try {
        const client = await prisma.client.create({
            data: { name, email, phone, address },
        });
        res.status(201).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private/Admin
const updateClient = async (req, res) => {
    const { name, email, phone, address } = req.body;

    try {
        const client = await prisma.client.update({
            where: { id: Number(req.params.id) },
            data: { name, email, phone, address },
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
const deleteClient = async (req, res) => {
    try {
        await prisma.client.delete({
            where: { id: Number(req.params.id) },
        });
        res.json({ message: 'Client removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
};
