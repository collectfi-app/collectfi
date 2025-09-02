import express from 'express';
import { CollectFi } from '../core/CollectFi';
import { Connection } from '@solana/web3.js';
import { DEFAULT_CONFIG } from '../config';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Initialize CollectFi instance
const connection = new Connection(DEFAULT_CONFIG.rpcEndpoint, 'confirmed');
const collectFi = new CollectFi(connection, DEFAULT_CONFIG);

// Initialize the platform
collectFi.initialize().catch(console.error);

/**
 * @route GET /api/vault/:assetId
 * @desc Get vault information for an asset
 * @access Public (with API key)
 */
router.get('/:assetId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { assetId } = req.params;
  
  const vaultInfo = await collectFi.getVaultInfo(assetId);
  
  if (!vaultInfo) {
    return res.status(404).json({
      success: false,
      error: 'Vault info not found',
      message: `Vault information for asset ${assetId} not found`,
      code: 'VAULT_INFO_NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: vaultInfo,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vault/status/overview
 * @desc Get overall vault security status
 * @access Public (with API key)
 */
router.get('/status/overview', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const vaultStats = await collectFi.vaultManager.getVaultStatistics();
  
  res.json({
    success: true,
    data: vaultStats,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/vault/redemption/request
 * @desc Request asset redemption
 * @access Private (API key required)
 */
router.post('/redemption/request', asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Check if user has redemption permissions
  if (!req.permissions?.includes('*') && !req.permissions?.includes('write:redemption')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Redemption permissions required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  const { assetMint, shippingAddress } = req.body;
  
  // Validate required fields
  if (!assetMint || !shippingAddress) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'assetMint and shippingAddress are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Validate shipping address
  if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
    return res.status(400).json({
      success: false,
      error: 'Invalid shipping address',
      message: 'Shipping address must include street, city, and country',
      code: 'INVALID_SHIPPING_ADDRESS'
    });
  }
  
  try {
    const redemptionId = await collectFi.requestRedemption(assetMint, shippingAddress);
    
    res.status(201).json({
      success: true,
      data: { redemptionId, assetMint, status: 'pending' },
      message: 'Redemption request submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Redemption request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'REDEMPTION_REQUEST_FAILED'
    });
  }
}));

/**
 * @route GET /api/vault/redemption/:requestId
 * @desc Get redemption request details
 * @access Private (API key required)
 */
router.get('/redemption/:requestId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { requestId } = req.params;
  
  const redemptionRequest = await collectFi.vaultManager.getRedemptionRequest(requestId);
  
  if (!redemptionRequest) {
    return res.status(404).json({
      success: false,
      error: 'Redemption request not found',
      message: `Redemption request ${requestId} not found`,
      code: 'REDEMPTION_REQUEST_NOT_FOUND'
    });
  }
  
  // Check if user has permission to view this redemption request
  if (req.userId && req.userId !== redemptionRequest.userId && !req.permissions?.includes('*')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'You can only view your own redemption requests',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  res.json({
    success: true,
    data: redemptionRequest,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vault/redemption/user/:userId
 * @desc Get user's redemption requests
 * @access Private (API key required)
 */
router.get('/redemption/user/:userId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  
  // Check if user has permission to view these redemption requests
  if (req.userId && req.userId !== userId && !req.permissions?.includes('*')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'You can only view your own redemption requests',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  const redemptionRequests = await collectFi.vaultManager.getUserRedemptionRequests(userId);
  
  res.json({
    success: true,
    data: redemptionRequests,
    count: redemptionRequests.length,
    userId,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route PUT /api/vault/redemption/:requestId/status
 * @desc Update redemption request status (Admin only)
 * @access Private (Admin API key required)
 */
router.put('/redemption/:requestId/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Check if user has admin permissions
  if (!req.permissions?.includes('*') && !req.permissions?.includes('admin:redemption')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Admin permissions required to update redemption status',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  const { requestId } = req.params;
  const { status, trackingNumber } = req.body;
  
  // Validate status
  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      code: 'INVALID_STATUS'
    });
  }
  
  try {
    let updated = false;
    
    if (status === 'shipped' && trackingNumber) {
      updated = await collectFi.vaultManager.shipRedemption(requestId, trackingNumber);
    } else if (status === 'delivered') {
      updated = await collectFi.vaultManager.markRedemptionDelivered(requestId);
    } else {
      updated = await collectFi.vaultManager.updateRedemptionStatus(requestId, status);
    }
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Redemption request not found',
        message: `Redemption request ${requestId} not found`,
        code: 'REDEMPTION_REQUEST_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: { requestId, status, updated: true },
      message: `Redemption request status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Status update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'STATUS_UPDATE_FAILED'
    });
  }
}));

/**
 * @route DELETE /api/vault/redemption/:requestId
 * @desc Cancel redemption request
 * @access Private (API key required)
 */
router.delete('/redemption/:requestId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { requestId } = req.params;
  
  try {
    const cancelled = await collectFi.vaultManager.cancelRedemption(requestId, req.userId!);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Redemption request not found',
        message: `Redemption request ${requestId} not found or cannot be cancelled`,
        code: 'REDEMPTION_REQUEST_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: { requestId },
      message: 'Redemption request cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Cancellation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'CANCELLATION_FAILED'
    });
  }
}));

export default router;
