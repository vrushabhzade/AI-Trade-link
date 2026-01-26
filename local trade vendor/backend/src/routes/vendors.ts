import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { VendorService } from '../services/vendorService';

const router = Router();
const vendorService = new VendorService();

// Create vendor profile
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const vendor = await vendorService.createVendor(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: { vendor }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

// Get vendor profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor not found'
        }
      });
    }

    res.json({
      success: true,
      data: { vendor }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VENDOR_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Update vendor profile
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const vendor = await vendorService.updateVendor(req.params.id, userId!, req.body);
    
    res.json({
      success: true,
      data: { vendor }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

// Get vendors near location
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    const vendors = await vendorService.getVendorsNearby(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      parseFloat(radius as string) || 10
    );
    
    res.json({
      success: true,
      data: { vendors }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VENDOR_SEARCH_FAILED',
        message: error.message
      }
    });
  }
});

export default router;
