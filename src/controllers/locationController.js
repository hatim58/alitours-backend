const prisma = require('../config/db');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
const getLocations = async (req, res) => {
    try {
        const locations = await prisma.location.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { packages: true },
                },
            },
        });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single location by slug
// @route   GET /api/locations/:slug
// @access  Public
const getLocationBySlug = async (req, res) => {
    try {
        const location = await prisma.location.findUnique({
            where: { slug: req.params.slug },
            include: {
                packages: true,
            },
        });
        if (location) {
            res.json(location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new location
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
    const { name, slug, image, description } = req.body;

    try {
        const location = await prisma.location.create({
            data: { name, slug, image, description },
        });
        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
    const { name, slug, image, description } = req.body;

    try {
        const location = await prisma.location.update({
            where: { id: req.params.id },
            data: { name, slug, image, description },
        });
        res.json(location);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res) => {
    try {
        await prisma.location.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Location deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLocations,
    getLocationBySlug,
    createLocation,
    updateLocation,
    deleteLocation,
};
