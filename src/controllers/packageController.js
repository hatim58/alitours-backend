const prisma = require('../config/db');

// @desc    Get all packages
// @route   GET /api/packages
// @access  Public
const getPackages = async (req, res) => {
    try {
        const packages = await prisma.package.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { reviews: true, bookings: true },
                },
            },
        });
        res.json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single package by ID
// @route   GET /api/packages/:id
// @access  Public
const getPackageById = async (req, res) => {
    try {
        const package = await prisma.package.findUnique({
            where: { id: req.params.id },
            include: {
                reviews: true,
                _count: {
                    select: { bookings: true },
                },
            },
        });
        if (package) {
            res.json(package);
        } else {
            res.status(404).json({ message: 'Package not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new package
// @route   POST /api/packages
// @access  Private/Admin
const createPackage = async (req, res) => {
    const {
        id,
        name,
        destination,
        destinationCity,
        destinationCountry,
        fromCity,
        description,
        duration,
        price,
        originalPrice,
        discount,
        maxGuests,
        destinationType,
        image,
        gallery,
        highlights,
        includes,
        excludes,
        locationId,
        itinerary,
        accommodation
    } = req.body;

    try {
        // Generating a unique ID if not provided
        const finalId = id || `pkg-${Date.now()}`;

        const package = await prisma.package.create({
            data: {
                id: finalId,
                name,
                destination,
                destinationCity: destinationCity || '',
                destinationCountry: destinationCountry || '',
                fromCity: fromCity || '',
                description,
                duration: Number(duration),
                price: Number(price),
                originalPrice: originalPrice ? Number(originalPrice) : null,
                discount: discount ? Number(discount) : null,
                maxGuests: Number(maxGuests),
                destinationType: destinationType || 'Popular',
                image,
                gallery: gallery || [],
                highlights: highlights || [],
                includes: includes || [],
                excludes: excludes || [],
                locationId: locationId || null,
                itinerary: itinerary || [],
                accommodation: accommodation || []
            },
        });
        res.status(201).json(package);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private/Admin
const updatePackage = async (req, res) => {
    const {
        name,
        destination,
        destinationCity,
        destinationCountry,
        fromCity,
        description,
        duration,
        price,
        originalPrice,
        discount,
        maxGuests,
        destinationType,
        image,
        gallery,
        highlights,
        includes,
        excludes,
        locationId,
        itinerary,
        accommodation
    } = req.body;

    try {
        const package = await prisma.package.update({
            where: { id: req.params.id },
            data: {
                name,
                destination,
                destinationCity,
                destinationCountry,
                fromCity,
                description,
                duration: duration ? Number(duration) : undefined,
                price: price ? Number(price) : undefined,
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                discount: discount ? Number(discount) : undefined,
                maxGuests: maxGuests ? Number(maxGuests) : undefined,
                destinationType,
                image,
                gallery,
                highlights,
                includes,
                excludes,
                locationId,
                itinerary,
                accommodation
            },
        });
        res.json(package);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private/Admin
const deletePackage = async (req, res) => {
    try {
        await prisma.package.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Package deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
};
