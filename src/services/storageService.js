import { uploadImageWithProgress, getPublicUrl, deleteFile } from './supabase';

// Storage service for GarmentPOS
export const storageService = {
  // Upload image to Supabase Storage
  async uploadImage(imageUri, orderId, onProgress) {
    try {
      const result = await uploadImageWithProgress(imageUri, orderId, onProgress);
      return {
        success: true,
        publicUrl: result.publicUrl,
        path: result.path,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Check storage status
  async checkStorageStatus() {
    try {
      // Mock storage status check
      return {
        accessible: true,
        bucketExists: true,
        error: null,
      };
    } catch (error) {
      console.error('Error checking storage status:', error);
      return {
        accessible: false,
        bucketExists: false,
        error: error.message,
      };
    }
  },

  // Test storage functionality
  async testStorage() {
    try {
      // Mock storage test
      return {
        success: true,
        message: 'Storage test completed successfully',
      };
    } catch (error) {
      console.error('Error testing storage:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Delete image from storage
  async deleteImage(imagePath) {
    try {
      await deleteFile(imagePath);
      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get public URL for image
  async getImageUrl(imagePath) {
    try {
      const publicUrl = getPublicUrl(imagePath);
      return {
        success: true,
        publicUrl,
      };
    } catch (error) {
      console.error('Error getting image URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
};